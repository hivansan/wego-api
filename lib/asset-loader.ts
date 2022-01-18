import * as ElasticSearch from '@elastic/elasticsearch';
import axios from 'axios';
import moment from 'moment';

import * as Network from './network';
import * as Asset from '../models/asset';
import * as Collection from '../models/collection';
import * as Remote from '../models/remote';
import * as Query from './query';
import Result from '@ailabs/ts-utils/dist/result';
import { array } from '@ailabs/ts-utils/dist/decoder';

import { URLSearchParams } from 'url';
import { filter, mergeAll, pipe, prop, tap } from 'ramda';

import { error } from '../server/util';
import { isUnrevealed } from './stats';
import { cleanTraits } from '../scraper/scraper.utils';

import { MAX_TOTAL_SUPPLY, MIN_TOTAL_VOLUME_COLLECTIONS_ETH } from './constants';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://api.opensea.io/api/v1';

export async function fromDb(
  db: ElasticSearch.Client,
  { offset, limit, sort }: Query.Options,
  slug?: string,
  tokenId?: string,
  traits?: { [key: string]: string | number | (string | number)[] },
  priceRange?: { lte: number, gte: number } | null,
  priceRangeUSD?: { lte: number, gte: number } | null,
  rankRange?: { lte: number, gte: number } | null,
  traitsCountRange?: { lte: number, gte: number } | null,
  query?: string,
  buyNow?: string,
): Promise<any> {

  const searchFields = [
    'name^6',
    'tokenId^6',
    'traits.trait_type^3',
    'traits.value^3',
    'description^2',
  ];

  const q: any = {
    bool: {
      must: [
        slug ? { term: { 'slug.keyword': slug } } : null,
        /**
         * @TODO Either get rid of tokenId or also take contract address
         */
        // tokenId ? { "match": { tokenId } } : null,
        ...Object.entries(traits || {}).map(([type, value]) =>
          Array.isArray(value)
            ? {
              bool: {
                must: [
                  { match: { 'traits.trait_type.keyword': type } },
                  ...(typeof value[0] === 'object'
                    ? value.flatMap((val) => Object.keys(val).map(v => ({ range: { 'traits.value.keyword': { [v]: val[v] } } })))
                    : [])
                ],
                should: typeof value[0] === 'string' ? value.map((val) => ({ match: { 'traits.value.keyword': val } })) : [],
                minimum_should_match: typeof value[0] === 'string' ? 1 : 0,
              },
            }
            : {
              bool: {
                must: [
                  { match: { 'traits.trait_type.keyword': type } },
                  { match: { 'traits.value.keyword': value } }
                ],
              },
            }
        ),
      ],
    },
  };

  if (priceRange && Object.keys(priceRange as {}).length) q.bool.must.push({ range: { currentPrice: priceRange } } as any);
  if (priceRangeUSD && Object.keys(priceRangeUSD as {}).length) q.bool.must.push({ range: { currentPriceUSD: priceRangeUSD } } as any);
  if (rankRange && Object.keys(rankRange as {}).length) q.bool.must.push({ range: { rarityScoreRank: rankRange } } as any);
  if (buyNow) q.bool.must.unshift({ range: { currentPrice: { gt: 0 } } } as any);
  if (traitsCountRange && Object.keys(traitsCountRange as {}).length) q.bool.must.push({ range: { traitsCount: traitsCountRange } } as any);

  if (query) q.bool['must'].push({ multi_match: { query, fuzziness: 1, fields: searchFields } });

  console.log('Query: ', JSON.stringify(q));
  console.log('sort:  ', sort);
  return Query.find(db, 'assets', q, { offset, sort, limit });
}

export async function assetFromRemote(contractAddress: string, tokenId: string): Promise<Asset.Asset | null> {

  const [rariNft, openseaNft] = await Network.arrayFetch([
    `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}`,
    `${BASE_URL}/asset/${contractAddress}/${tokenId}/`,
  ]);

  // console.log('openseaNft --', openseaNft);
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
          collection: {
            ...remoteCollectionMapper({ collection: openSea.collection, contractAddress }),
            stats: remoteCollectionStatsMapper({ stats: openSea.collection.stats, contractAddress, slug: openSea.collection.slug })
          },
          traitsCount: openSea.traits?.length || 0
        })
      )
    )
  // console.log(`getting asset from remote ${contractAddress}/${tokenId}`);
  // console.log('asset', asset);
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
        return axios(`${BASE_URL}/assets?${query}`)
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

export async function events(args: { limit?: number, before?: number, after?: number }): Promise<Remote.OpenSeaEvent[]> {
  const limit = args.limit || 50;

  const query = new URLSearchParams(mergeAll([
    { limit },
    // { event_type: 'successful' },
    // { collection_slug: 'official-dormant-dragons' },
    args.before ? { occurred_before: args.before } : {},
    args.after ? { occurred_after: args.after } : {},
  ]) as { [key: string]: any });

  console.log('[market events query]', query.toString());

  return Network.fetchNParse(`${BASE_URL}/events?${query.toString()}`,
    { headers: { Accept: 'application/json', 'X-API-KEY': process.env.OPENSEA_API_KEY } })
    .then(prop('asset_events') as any)
    .then(filter((event: any) => event.asset && event.asset.permalink.indexOf('/matic/') < 0 && event.asset.asset_contract.schema_name === 'ERC721') as any)
    // .then(tap(c => console.log(c)) as any)
    .then(array(Remote.openSeaEvent))
    .then(Result.toPromise)
}

const indexCollection = (db: ElasticSearch.Client) => tap((collection: any) => (
  Query.createWithIndex(db, 'collections', collection, `${collection.slug}`)
    .catch(error => console.log('[error index collection]', error?.meta?.body?.error, `slug: ${collection.slug}`))
));

export async function getCollection(db: ElasticSearch.Client, slug: string, requestedScore?: boolean): Promise<any> {
  return Query.findOne(db, 'collections', { term: { _id: slug } })
    .then((body) => {
      const now = moment();
      return body === null || (body._source.updatedAt && now.diff(moment(body._source?.updatedAt), 'hours') > 3)
        ? collectionFromRemote(slug).then((body) => (
          body === null
            ? null
            : ({
              body: indexCollection(db)({
                ...body,
                addedAt: +new Date(),
                updatedAt: new Date(),
                requestedScore: !!requestedScore,
                traits: cleanTraits(body.traits)
              })
            } as any)
        ))
        : { body: body._source }
    })
    .catch(e => Promise.reject(error(503, 'Service error')));
}

const indexAsset = (db: ElasticSearch.Client) => tap((asset: Asset.Asset) => (
  Query.createWithIndex(db, 'assets', { ...asset, unrevealed: isUnrevealed(asset) }, `${asset.contractAddress.toLowerCase()}:${asset.tokenId}`)
));

export async function getAsset(db: ElasticSearch.Client, contractAddress: string, tokenId: string): Promise<any> {
  const now = moment();
  return Query.findOne(db, 'assets', { term: { _id: `${contractAddress.toLowerCase()}:${tokenId}` } })
    .then(body => {
      // console.log('unrevealed and updated -----', body, body._source.unrevealed, now.diff(moment(body._source?.updatedAt), 'minutes') > 5);
      return body === null || !!!body?._source?.slug || (body._source.unrevealed && now.diff(moment(body._source?.updatedAt), 'minutes') > 5)
        ? assetFromRemote(contractAddress, tokenId)
          .then(body => body === null ? null : { body: indexAsset(db)(body) } as any)
          .catch(e => {
            return error(503, 'Service error');
          })
        : { body: body._source } as any
    })
}

export async function collectionFromRemote(slug: string): Promise<Collection.Collection & { stats: Collection.CollectionStats } | null> {
  try {
    const os: any = await Network.fetchNParse(`${BASE_URL}/collection/${slug}?format=json`)
      .then(Remote.openSeaCollection)
      .then(Result.toPromise);

    // console.log('[os collection]', os);
    const collection: Collection.Collection = remoteCollectionMapper({ collection: os.collection });
    const stats: Collection.CollectionStats = remoteCollectionStatsMapper({ slug, stats: os.collection.stats });

    return Object.assign(collection, { stats });
  } catch (e) {
    console.log('[collection from remote err]', slug, JSON.stringify(e), e);
    return null;
  }
}

const remoteCollectionMapper = ({ collection }: any): Collection.Collection => {
  // console.log('[remote collection mapper collection]', collection);
  return {
    contractAddresses: collection.primary_asset_contracts?.length ? collection.primary_asset_contracts.map((x: any) => x.address) : null,
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
    traits: collection.traits ? cleanTraits(collection.traits) as any : null,
    primaryAssetConctracts: collection.primary_asset_contracts || null,
    deleted: collection?.stats?.total_volume < MIN_TOTAL_VOLUME_COLLECTIONS_ETH || collection?.stats?.total_supply > MAX_TOTAL_SUPPLY
  }
};

const remoteCollectionStatsMapper = ({ stats, slug }: any): Collection.CollectionStats => ({
  // contractAddress,
  slug,
  wegoScore: 0,
  // featuredCollection: false,
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
    const url = `${BASE_URL}/assets?${queryParams}`;

    console.log('[assets from remote url]', url);

    const { data } = await axios(url);
    const { assets } = data;

    // if (!assets?.length) return null;
    return assets;
  } catch (e) {
    console.log('[assetsFromRemote err]', JSON.stringify(e));
    return null;
  }
}