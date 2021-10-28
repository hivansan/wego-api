import * as ElasticSearch from '@elastic/elasticsearch';
import axios from 'axios';
import * as Network from './network';
import * as Asset from '../models/asset';
import * as Collection from '../models/collection';
import * as Remote from '../models/remote';
import * as Query from './query';
import Result from '@ailabs/ts-utils/dist/result';

import { URLSearchParams } from 'url';
import { curry, tap } from 'ramda';

import { error } from '../server/util';

export async function fromDb(
  db: ElasticSearch.Client,
  { offset, limit, sort }: Query.Options,
  slug?: string,
  tokenId?: string,
  traits?: { [key: string]: string | number | (string | number)[] },
) {

  const q = {
    bool: {
      must: [
        slug ? { match: { slug } } : null,
        /**
         * @TODO Either get rid of tokenId or also take contract address
         */
        // tokenId ? { "match": { tokenId } } : null,
        ...Object.entries(traits || {}).map(([type, value]) => {
          return Array.isArray(value)
            ? {
              bool: {
                must: [{ match: { 'traits.trait_type': type } }],
                should: value.map((val) => ({ match: { 'traits.value': val } })),
                minimum_should_match: 1,
              },
            }
            : {
              bool: {
                must: [
                  { match: { 'traits.trait_type': type } },
                  { match: { 'traits.value': value } }
                ],
              },
            };
        }),
      ],
    },
  };

  // console.log('Query', util.inspect(q, false, null, true));
  return Query.find(db, 'assets', q, { offset, sort, limit });
}

export async function assetFromRemote(contractAddress: string, tokenId: string): Promise<Asset.Asset | null> {
  const [rariNft, openseaNft] = await Network.arrayFetch([
    `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}`,
    `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/`,
  ]);

  const asset: Result<any, Asset.Asset> = Remote.openSeaAsset(openseaNft)
    .chain((openSea) =>
      Remote.rarible(rariNft).map((rari) =>
        Asset.init({
          name: openSea.name,
          slug: openSea.collection.slug,
          tokenId,
          contractAddress,
          owners: rari.owners,
          owner: null,
          description: openSea.description,              //  rariMeta.description
          imageBig: openSea.image_original_url,       // rariMeta.image.url.BIG,
          imageSmall: openSea.image_preview_url,        // rariMeta.image.url.PREVIEW,
          animationUrl: openSea.animation_original_url,
          //rariscore: https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c
          tokenMetadata: openSea.token_metadata,
          rarityScore: !openSea.traits.length || !openSea.collection.stats.total_supply ? null : openSea.traits.reduce((acc, t) => acc + 1 / (t.trait_count / openSea.collection.stats.total_supply), 0),
          traits: openSea.traits,
          collection: { ...remoteCollectionMapper({ collection: openSea.collection, contractAddress }), stats: remoteCollectionStatsMapper({ stats: openSea.collection.stats, contractAddress, slug: openSea.collection.slug }) },
        })
      )
    )

  return asset.defaultTo(null as any);
};

/**
 * @TODO This needs a decoder so we validate we're getting the right data
 */
export async function fromCollection(contractAddress: Asset.Address, tokenId?: number) {
  try {
    const limit = 50;
    let assets: any[] = [];

    const iterator = Network.paginated(
      result => !result || !(result as any).data?.assets?.length,
      page => {
        const params = Object.assign(tokenId && page === 0 ? { token_ids: tokenId } : {}, {
          asset_contract_address: contractAddress,
          offset: page * limit,
          limit,
        });
        const query = new URLSearchParams(params as any).toString();
        return axios(`https://api.opensea.io/api/v1/assets?${query}`)
      }
    );

    for await (const newAssets of iterator) {
      assets = assets.concat(newAssets);
    }

    return assets;

  } catch (error) {
    throw error;
  }
}

// this would mean that collection - and neither it's assets - would exists
const indexCollection = (db: ElasticSearch.Client) => tap((collection: any) => (
  Query.createWithIndex(db, 'collections', collection, `${collection.slug}`)
  //, console.log('hola') // this function will execute without being returned
));

export async function getCollection(db: ElasticSearch.Client, slug: string): Promise<any> {
  return Query.findOne(db, 'collections', { term: { _id: slug } })
    .then((body) =>
      body === null
        ? collectionFromRemote(slug).then((body) => (
          body === null
            ? null
            : ({ body: indexCollection(db)({ ...body, addedAt: +new Date() }) } as any)
        ))
        : { body: body._source }
    )
    .catch(e => Promise.reject(error(503, 'Service error')));
}

const indexAsset = (db: ElasticSearch.Client) => tap((asset: Asset.Asset) => (
  Query.createWithIndex(db, 'assets', asset, `${asset.contractAddress.toLowerCase()}:${asset.tokenId}`)
));

export async function getAsset(db: ElasticSearch.Client, contractAddress: string, tokenId: string): Promise<any> {
  return Query.findOne(db, 'assets', { term: { _id: `${contractAddress.toLowerCase()}:${tokenId}` } })
    .then(body => body === null
      ? assetFromRemote(contractAddress, tokenId)
        .then(body => body === null ? null : { body: indexAsset(db)(body) } as any)
        .catch(e => {
          return error(503, 'Service error');
        })
      : { body: body._source } as any)
}

export async function collectionFromRemote(slug: string): Promise<Collection.Collection & { stats: Collection.CollectionStats } | null> {
  const params: any = {
    collection: slug,
    offset: 0,
    limit: 1,
  };
  const queryParams = new URLSearchParams(params).toString();
  const url = `https://api.opensea.io/api/v1/assets?${queryParams}`;

  const { data } = await axios(url);
  const [asset] = data.assets;

  console.log(`[collectionFromRemote url] `, url);
  const contractAddress = asset?.asset_contract?.address;
  if (!asset || !asset.token_id || !contractAddress) {
    return null;
  }

  try {
    const assetUrl = `http://api.opensea.io/api/v1/asset/${contractAddress}/${asset.token_id}/`;
    const os = await Network.fetchNParse(assetUrl)
      .then(Remote.openSeaCollection)
      .then(Result.toPromise);

    const collection: Collection.Collection = remoteCollectionMapper({ collection: os.collection, contractAddress });
    const stats: Collection.CollectionStats = remoteCollectionStatsMapper({ contractAddress, slug, stats: os.collection.stats });

    return Object.assign(collection, { stats });
  } catch (e) {
    console.log('err--', JSON.stringify(e));
    return null;
  }
}

const remoteCollectionMapper = ({ collection, contractAddress }: any): Collection.Collection => ({
  contractAddress,
  slug: collection.slug,
  name: collection.name,
  releaseDate: collection.created_date,
  released: true,
  imgPortrait: collection.banner_image_url,
  imgMain: collection.image_url,
  imgLarge: collection.large_image_url,
  twitter: collection.twitter_username,
  discord: collection.discord_url,
  instagram: collection.instagram_username,
  telegram: collection.telegram_url,
  website: collection.external_url,
});

const remoteCollectionStatsMapper = ({ stats, contractAddress, slug }: any): Collection.CollectionStats => ({
  contractAddress,
  slug,
  wegoScore: 0,
  featuredCollection: false,
  featuredScore: 0,
  oneDayVolume: stats.one_day_volume,
  oneDayChange: stats.one_day_change,
  oneDaySales: stats.one_day_sales,
  oneDayAveragePrice: stats.one_day_average_price,
  sevenDayVolume: stats.seven_day_volume,
  sevenDayChange: stats.seven_day_change,
  sevenDaySales: stats.seven_day_sales,
  sevenDayAveragePrice: stats.seven_day_average_price,
  thirtyDayVolume: stats.thirty_day_volume,
  thirtyDayChange: stats.thirty_day_change,
  thirtyDaySales: stats.thirty_day_sales,
  thirtyDayAveragePrice: stats.thirty_day_average_price,
  totalVolume: stats.total_volume,
  totalSales: stats.total_sales,
  totalSupply: stats.total_supply,
  count: stats.count,
  numOwners: stats.num_owners,
  averagePrice: stats.average_price,
  numReports: stats.num_reports,
  marketCap: stats.market_cap,
  floorPrice: stats.floor_price,
});

export async function assetsFromRemote(
  slug?: string | undefined | null,
  limit?: number,
  offset?: number,
  sortBy?: string | null,
  sortDirection?: string,
  q?: string | null,
): Promise<any | null> {

  try {
    const params: any = {
      collection: slug,
      offset,
      limit,
    };
    if (!!sortBy) params.order_by = sortBy;
    if (!!sortDirection) params.order_direction = sortDirection;

    const queryParams = new URLSearchParams(params).toString();
    const url = `https://api.opensea.io/api/v1/assets?${queryParams}`;

    console.log('[assets from remote url]', url);

    const { data } = await axios(url);
    const { assets } = data;

    // if (!assets?.length) return null;
    return assets;
  } catch (e) {
    console.log('err--', JSON.stringify(e));
    return null;
  }
}