import * as ElasticSearch from '@elastic/elasticsearch';
import axios from 'axios';
import moment from 'moment';
import queryString from 'query-string';


import * as Network from './network';
import * as Asset from '../models/asset';
import * as Collection from '../models/collection';
import * as Remote from '../models/remote';
import * as Query from './query';
import Result from '@ailabs/ts-utils/dist/result';
import { array } from '@ailabs/ts-utils/dist/decoder';

import { URLSearchParams } from 'url';
import { filter, map, mergeAll, path, pipe, prop, tap, uniq } from 'ramda';

import { error } from '../server/util';
import { isUnrevealed } from './stats';
import { cleanTraits, consecutiveArray, openseaAssetMapper } from '../scraper/scraper.utils';

import { MAX_TOTAL_SUPPLY, MIN_TOTAL_VOLUME_COLLECTIONS_ETH, OPENSEA_API } from './constants';
import dotenv from 'dotenv';
import { toResult } from '../server/endpoints/util';
dotenv.config();

const BASE_URL = 'https://api.opensea.io/api/v1';

export async function fromDb(
  db: ElasticSearch.Client,
  { offset, limit, sort, source }: Query.Options,
  slug?: string,
  tokenId?: string,
  traits?: { [key: string]: (string | number | object | any)[] },
  priceRange?: { lte: number, gte: number } | null,
  priceRangeUSD?: { lte: number, gte: number } | null,
  rankRange?: { lte: number, gte: number } | null,
  traitsCountRange?: { lte: number, gte: number } | null,
  query?: string,
  buyNow?: string,
  ownerAddress?: string,
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
        ...Object.entries(traits || {}).map(([type, value]) => ({
          bool: {
            should: typeof value[0] === 'string' || value[0] === null
              ? value.map((val) => ({ match: { 'traitsFlat.keyword': `${type}:${val}` } }))
              : consecutiveArray(value[0]['gte'], value[0]['lte'] - value[0]['gte'] + 1)
                .map(val => ({ match: { 'traitsFlat.keyword': `${type}:${val}` } })),
            minimum_should_match: typeof value[0] === 'string' || value[0] === null ? 1 : 0,
          },
        })),
      ],
    },
  };

  if (priceRange && Object.keys(priceRange as {}).length) q.bool.must.push({ range: { currentPrice: priceRange } });
  if (priceRangeUSD && Object.keys(priceRangeUSD as {}).length) q.bool.must.push({ range: { currentPriceUSD: priceRangeUSD } });
  if (rankRange && Object.keys(rankRange as {}).length) q.bool.must.push({ range: { rarityScoreRank: rankRange } });
  if (buyNow) q.bool.must.unshift({ range: { currentPrice: { gt: 0 } } });
  if (traitsCountRange && Object.keys(traitsCountRange as {}).length) q.bool.must.push({ range: { traitsCount: traitsCountRange } });
  if (ownerAddress) q.bool.must.push({
    bool: {
      should: [{ match: { 'owner.address.keyword': ownerAddress.toLowerCase() } }, { match: { owners: ownerAddress.toLowerCase() } }],
      minimum_should_match: 1
    }
  });

  if (query) q.bool['must'].push({ multi_match: { query, fuzziness: 1, fields: searchFields } });

  console.log('Query: ', JSON.stringify(q));
  console.log('sort:  ', sort);
  return Query.find(db, 'assets', q, { offset, sort, limit, source });
}

export async function assetFromRemote(contractAddress: string, tokenId: string): Promise<Asset.Asset | null> {

  const [rariNft, openseaNft] = await Network.arrayFetch([
    `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}`,
    `${BASE_URL}/asset/${contractAddress}/${tokenId}/`,
  ]);

  // console.log('openseaNft --', JSON.stringify(openseaNft, null, 3));
  const asset: Result<any, Asset.Asset> = Remote.openSeaAsset(openseaNft)
    .chain((openSea) =>
      Remote.rarible(rariNft).map((rari) =>
        Asset.init({
          name: openSea.name,
          slug: openSea.collection.slug,
          tokenId,
          contractAddress,
          owners: rari.owners,
          owner: openSea.owner,
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
          traitsCount: openSea.traits?.length || 0,
          // sellOrders: openSea.orders?.filter((o: { side: number; }) => o.side === 1).map(sellOrderMapper) || [],
          ...(openSea.orders?.filter((o: { side: number; }) => o.side === 1).length
            ? {
              sellOrders: openSea.orders.filter((o: { side: number; }) => o.side === 1).map(sellOrderMapper) || [],
              currentPrice: openSea.orders.filter((o: { side: number; }) => o.side === 1)[0].current_price / 10 ** 18,
              currentPriceUSD: (openSea.orders.filter((o: { side: number; }) => o.side === 1)[0].current_price / 10 ** 18) * +openSea.orders.filter((o: { side: number; }) => o.side === 1)[0].payment_token_contract?.usd_price,
            }
            : {
              sellOrders: null,
              currentPrice: null,
              currentPriceUSD: null,
            }
          ),
          ...(openSea.last_sale
            ? {
              lastSale: openSea.last_sale,
              lastSalePrice: +openSea.last_sale.total_price / 10 ** 18,
              lastSalePriceUSD: (+openSea.last_sale.total_price / 10 ** 18) * +openSea.last_sale.payment_token?.usd_price,
            }
            : {
              lastSale: null,
              lastSalePrice: null,
              lastSalePriceUSD: null,
            }),
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

export async function events(args: { limit?: number, offset?: number, before?: number, after?: number }): Promise<Remote.OpenSeaEvent[]> {
  const limit = args.limit || 50;
  const offset = args.offset || 0;
  const query = new URLSearchParams(mergeAll([
    { limit },
    { offset },
    // { collection_slug: 'social-bees-university' },
    // { event_type: 'created' },
    // { asset_contract_address: '0x4848a07744e46bb3ea93ad4933075a4fa47b1162' },
    // { token_id: 9612 },
    args.before ? { occurred_before: args.before } : {},
    args.after ? { occurred_after: args.after } : {},
  ]) as { [key: string]: any });

  console.log('[market events args ]', args);
  console.log('[market events query]', query.toString());

  return Network.fetchNParse(`${BASE_URL}/events?${query.toString()}`,
    { headers: { Accept: 'application/json', 'X-API-KEY': process.env.OPENSEA_API_KEY } })
    .then(prop('asset_events') as any)
    .then(filter((event: any) => event.asset && event.asset.permalink.indexOf('/matic/') < 0 && event.asset.asset_contract.schema_name === 'ERC721') as any)
    .then(array(Remote.openSeaEvent))
    .then(Result.toPromise)
}

const indexCollection = (db: ElasticSearch.Client) => tap((collection: any) => (
  Query.update(db, 'collections', `${collection.slug}`, collection, true)
    .catch(error => console.log('[error index collection]', error?.meta?.body?.error, `slug: ${collection.slug}`))
));

export async function getCollection(db: ElasticSearch.Client, slug: string, requestedScore?: boolean): Promise<any> {
  return Query.findOne(db, 'collections', { term: { _id: slug } })
    .then(body => body === null ? null : body._source)
    .then((collectionDB) => {
      const now = moment();
      return collectionDB === null || (collectionDB.updatedAt && now.diff(moment(collectionDB?.updatedAt), 'hours') > 3)
        ? collectionFromRemote(slug).then((collectionRemote) => (
          collectionRemote === null
            ? null
            : ({
              body: indexCollection(db)({
                ...(collectionDB || {}),
                ...collectionRemote,
                addedAt: +new Date(),
                updatedAt: new Date(),
                requestedScore: !!requestedScore,
                traits: cleanTraits(collectionRemote.traits)
              })
            })
        ))
        : { body: collectionDB }
    })
    .catch(e => Promise.reject(error(503, 'Service error')));
}

const indexAsset = (db: ElasticSearch.Client) => tap((asset: Asset.Asset) => (
  Query.update(db, 'assets', `${asset.contractAddress.toLowerCase()}:${asset.tokenId}`, { ...asset, unrevealed: isUnrevealed(asset) }, true)
));

const assetWithTraits = async (db: ElasticSearch.Client, asset: Asset.Asset) => {
  return asset.traits?.length
    ? Query.find(db, 'traits', {
      bool: {
        must: [
          { match: { 'slug.keyword': asset.slug } },
          { terms: { 'key.keyword': (asset as any).traitsFlat } }
        ]
      }
    }, { limit: 20 })
      .then(body => body === null ? Promise.resolve(asset) : body)
      .then(path(['body', 'hits', 'hits']) as any)
      .then(map(pipe(toResult, prop('value'))))
      .then(body => ({ body: { ...asset, traits: body } }))
      .catch(e => Promise.resolve(asset))
    : { body: asset }
}


export async function getAsset(db: ElasticSearch.Client, contractAddress: string, tokenId: string): Promise<any> {
  const now = moment();
  return Query.findOne(db, 'assets', { term: { _id: `${contractAddress.toLowerCase()}:${tokenId}` } })
    .then(body => body === null ? null : body._source)
    .then(assetDB => {
      return assetDB === null || (assetDB.unrevealed && now.diff(moment(assetDB?.updatedAt), 'minutes') > 5) || now.diff(moment(assetDB?.updatedAt), 'hours') > 1
        ? assetFromRemote(contractAddress, tokenId)
          .then(assetRemote => assetRemote === null
            ? null
            : assetWithTraits(db, indexAsset(db)({
              ...(assetDB || {}), /* priority to asset db for ranks and stuff */
              ...assetRemote, /* then to new data */
              ...(assetDB !== null && !isUnrevealed(assetDB) ? { traits: assetDB.traits } : {}) /* if assetdb had traits before, use those */
            }))
          )
          .catch(e => error(503, 'Service error'))
        : assetWithTraits(db, assetDB) as any
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


export function fromOwner(db: ElasticSearch.Client, contractAddress: string) {
  return rawAssetsFromRemoteFromOwner(contractAddress)
    .then((raw: any[]) => {
      console.log(JSON.stringify(raw, null, 3));

      return raw.map(openseaAssetMapper)
    })
    .then(assets => pairAssetWithExisting(db, assets))
}

export function rawAssetsFromRemoteFromOwner(contractAddress: string): Promise<any[]> {
  const size = 50;
  const params = { owner: contractAddress, limit: size, format: 'json' }
  const getAssets: any = async ({ offset }) => {
    const url = `${OPENSEA_API}/assets?${queryString.stringify({ ...params, offset })}`;
    const { assets } = (await Network.fetchNParse(url, { headers: { Accept: 'application/json', 'X-API-KEY': process.env.OPENSEA_API_KEY }, }) as any);
    return assets.length < size ? assets : assets.concat(await getAssets({ offset: offset + size }))
  }
  return getAssets({ offset: 0 })/* .then((assets: any[]) => ({ body: assets })) */;
}

export function pairAssetWithExisting(db: ElasticSearch.Client, assets: any[]) {
  const ids = assets.map(({ tokenId, contractAddress }) => `${contractAddress}:${tokenId}`);
  return Query.find(db, 'assets', { terms: { _id: ids } }, { limit: ids.length })
    .then(
      ({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) => hits.map(toResult)
        .map((r: any) => r.value)
        .filter(a => a.traits?.length && !a.deleted)
        .map(a => ({
          ...a,
          ...(assets.find(({ tokenId, contractAddress }) => `${contractAddress}${tokenId}` === `${a.contractAddress}${a.tokenId}`) || {})
        }))
    )
}
export async function toggleFavorite({ db, address, slug, tokenId, value, contractAddress }): Promise<any> {
  return value === true
    ? tokenId
      ? Query.create(db, 'favorites', { slug, contractAddress, user: address, tokenId, createdAt: moment() })
      : Query.create(db, 'favorites', { slug, user: address, createdAt: moment() })
    : tokenId
      ? Query.deleteByQuery(db, 'favorites', {
        bool: {
          must: [
            { match: { 'slug.keyword': slug } },
            { match: { 'user.keyword': address } },
            { match: { 'tokenId.keyword': tokenId } },
          ]
        }
      })
      : Query.deleteByQuery(db, 'favorites', {
        bool: {
          must: [
            { match: { 'slug.keyword': slug } },
            { match: { 'user.keyword': address } },
          ],
          must_not: { exists: { field: "tokenId" } },
        }
      })
}


export async function favorites(
  db: ElasticSearch.Client,
  index: string,
  { offset, limit, sort, source }: Query.Options,
  address: string,
  slug?: string,
): Promise<any> {
  const q: any = {
    bool: {
      must: [
        { match: { 'user.keyword': address } },
      ]
    }
  };
  if (index === 'assets') q.bool.must.push({ exists: { field: 'tokenId' } });
  if (index === 'assets' && slug) q.bool.must.push({ match: { 'slug.keyword': slug } });
  if (index === 'collections') q.bool.must_not = [{ exists: { field: 'tokenId' } }, { exists: { field: 'contractAddress' } }];

  return Query.find(db, 'favorites', q, { limit: 1000 })
    .then((body) => (body === null ? error(404, 'Not found') : (body as any)))
    .then(({ body: { hits: { hits }, }, }) => hits.map(toResult).map((r: any) => r.value))
    .then(favs => favs.map((f: { slug: any; contractAddress: any; tokenId: any; }) => toId(f, index)))
    .then(uniq)
    .then(tap(x => console.log(x)))
    .then(ids =>
      Query.find(db, index, { terms: { _id: ids } }, { offset, limit: limit || ids.length })
        .then(({ body: { hits: { hits }, }, }) => ({ body: hits.map(toResult).map((r: any) => r.value) })))
  // .then(tap(favs => console.log(`[favs]`, favs)))
}

function toId(fav: { slug: any; contractAddress: any; tokenId: any; }, index: string) {
  if (index === 'collections') return fav.slug
  if (index === 'assets') return `${fav.contractAddress}:${fav.tokenId}`
  return null;
}

const sellOrderMapper = (order: any) => ({
  created_date: order.created_date,
  closing_date: order.closing_date,
  closing_extendable: order.closing_extendable,
  expiration_time: order.expiration_time,
  listing_time: order.listing_time,
  order_hash: order.order_hash,
  maker: { address: order.maker.address },
  taker: { address: order.taker.address },
  current_price: order.current_price,
  current_bounty: order.current_bounty,
  bounty_multiple: order.bounty_multiple,
  maker_relayer_fee: order.maker_relayer_fee,
  taker_relayer_fee: order.taker_relayer_fee,
  maker_protocol_fee: order.maker_protocol_fee,
  taker_protocol_fee: order.taker_protocol_fee,
  maker_referrer_fee: order.maker_referrer_fee,
  fee_method: order.fee_method,
  side: order.side,
  sale_kind: order.sale_kind,
  target: order.target,
  payment_token_contract: order.payment_token_contract,
  base_price: order.base_price,
  extra: order.extra,
  quantity: order.quantity,
  approved_on_chain: order.approved_on_chain,
  cancelled: order.cancelled,
  finalized: order.finalized,
  marked_invalid: order.marked_invalid,
  prefixed_hash: order.prefixed_hash,
})

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
