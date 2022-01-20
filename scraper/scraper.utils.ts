import axios from 'axios';
import { Client } from '@elastic/elasticsearch';
import datasources from '../server/datasources';
import { flattenTraits } from '../models/util';
const { es } = datasources;
const client = new Client({ node: es.configuration.node, requestTimeout: 1000 * 60 * 60 });
const fs: any = require('fs');

const getItem = (html: string) => '0x' + html.substr(0, 40);

const pages = 162;

const getList = async (page: number) => {
  console.log('page', `${page}/${pages}`);
  let url = `https://etherscan.io/tokens-nft?ps=100`;
  if (page) url += `&p=${page}`;
  const res = await axios.get(url);
  let html = res.data;
  let strings = html.split('/token/0x');
  strings.shift();
  let items: string[] = [];
  for (const str of strings) items.push(getItem(str));
  return items;
};

const getAllItems = async () => {
  const arr = [...Array(pages).keys()];
  let items: string[] = [];
  for (const i of arr) {
    items = [...items, ...(await getList(i + 1))];
  }
  items = [...new Set(items)];
};

export const sleep = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));

export const maxChop = (array: any[], step = 1_000) => {
  if (step % 2 != 0) throw new Error('step must be divisible by 2');
  let max = 1_000;
  while (Buffer.byteLength(JSON.stringify(array.slice(0, max + step))) * 8 < 200_000_000 && array.length > max) {
    max += step;
  }
  return array.splice(0, max);
};

const getDocId = (doc: any, index: string) => {
  if (index == 'collections') return doc.slug;
  if (index === 'assets') return `${doc.contractAddress}:${doc.tokenId}`;
  if (index === 'asset_traits') return `${doc.contractAddress}:${doc.traitType}:${doc.value.toLowerCase().split(' ').join('-')}`;
  if (index == 'traits') return `${doc.slug}:${doc.traitType.toLowerCase().split(' ').join('-')}:${doc.value.toString().toLowerCase().split(' ').join('-')}`;
};

/**
 * Loads a document into elastic search
 * @param {any[]} content document to be saved
 * @param {index} index name of the index that will be saved. Recomended in plural.
 * @param {boolean | string } [update] whether the document is an update an upsert or neither.
 *  If it's and update use boolean true, if it is an upsert update = "upsert", else update can be lefted undefined
 * @returns
 */
export const load = async (content: any[], index: string, update?: boolean | string) => {
  let ix = 0;
  // console.log('content', content);

  if (!content.length) return;

  console.log(`loading ${content.length} ${index}...`, typeof content);
  const body = content.flatMap((doc: any) => [
    update
      ? {
        update: {
          _id: getDocId(doc, index),
          _index: index,
        },
      }
      : {
        index: {
          _index: index,
          _type: '_doc',
          _id: getDocId(doc, index),
        },
      },
    update ? { doc, doc_as_upsert: update === 'upsert' } : doc,
  ]);

  // console.log(JSON.stringify(body))

  while (body.length > 0) {
    try {
      const chop = maxChop(body);
      const result: any = await client.bulk({ refresh: true, body: chop }).catch((e) => console.log(`${e} ------`));
      console.log(`result items: ${result?.body?.items?.length} status code : ${result?.statusCode}`);
      // console.log('[load results]', JSON.stringify(result.body.items, null, 3));
      // console.log(`${(ix / 2 + result.body?.items?.length).toLocaleString()} objects done. ${body.length / 2} left.`);
      ix += chop.length;
    } catch (error) {
      console.log('[error loading]', error);
    }
  }
};

export const readPromise = (path: string, method: string) =>
  new Promise((resolve, reject) => {
    fs[method](path, 'utf8', (err: any, data: unknown) => {
      if (err) reject(err);
      resolve(data);
    });
  });

export const openseaAssetMapper = (asset: any) => {
  const count = asset.collection?.stats?.totalSupply;
  const reducer = (acc: number, t: { trait_count: number }) => {
    const norm = t.trait_count / count;
    return norm ? acc + 1 / norm : acc;
  };
  const rarityScore = asset?.traits?.length && count && asset.traits.reduce(reducer, 0);

  return {
    tokenId: asset.token_id,
    contractAddress: asset.asset_contract.address.toLowerCase(),
    slug: asset.collection.slug,
    name: asset.name,
    owners: asset.owners,
    owner: asset.owner,
    description: asset.description, //  rariMeta.description,
    imageBig: asset.image_original_url, // rariMeta.image.url.BIG,
    imageSmall: asset.image_preview_url, // rariMeta.image.url.PREVIEW,
    animationUrl: asset.animation_url,
    traits: asset.traits,
    traitsFlat: Array.isArray(asset.traits) ? flattenTraits(asset.traits) : [],
    traitsCount: asset.traits?.length,
    rarityScore,
    tokenMetadata: asset.token_metadata,
    updatedAt: new Date(),
    creator: asset.creator,
    topBid: asset.top_bid,
    lastSale: asset.last_sale,
    sellOrders: asset.sell_orders,
    numSales: asset.num_sales,
    lastSalePrice: asset.last_sale ? +asset.last_sale.total_price / 10 ** 18 : null,
    lastSalePriceUSD: asset.last_sale ? (+asset.last_sale.total_price / 10 ** 18) * +asset.last_sale.payment_token?.usd_price : null,
    currentPrice: asset.sell_orders?.length ? asset.sell_orders[0].current_price / 10 ** 18 : null,
    currentPriceUSD: asset.sell_orders?.length ? (asset.sell_orders[0].current_price / 10 ** 18) * +asset.sell_orders[0].payment_token_contract?.usd_price : null,
  };
};

export const consecutiveArray = (min: number, size: number): Array<Number> => new Array(size).fill(0).map((_, ix) => ix + min);
/**
 * Cleans an object of null and undefined properties (values).
 * Intended use: when updating an asset, we can clean an object, so we don't
 * update with null or undefined values.
 * @param {any} obj Object that will be clean
 * @param {any} [filter=(v)=>v!=null] If true the value will be kept
 * @returns {any} A new object with the same properties minus the null and
 *  undefined ones.
 */
// i'd rename this to cleanObjValues
export const cleanEntries = (obj: any, filter: (v: any) => boolean = (v) => v != null) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => filter(v)));


/**
 * removes inner keys as 'min', 'max' and number-as.
 */
export const cleanTraits = (traits: object): { [k: string]: any; } =>
  Object.fromEntries(
    Object.entries(traits)
      .filter(([key, value]) =>
        !Object.entries(value).some(([key, value]) => ['min', 'max'].includes(key) || !isNaN(key as any)))
  )