import axios from 'axios';
import fs from 'fs';

import nftAddresses from '../data/nft-addresses';
import qs from 'qs';
import { Client } from '@elastic/elasticsearch';
import datasources from '../server/datasources';
import { filter, flatten, map, pipe, prop } from 'ramda';
const { es } = datasources;
const client = new Client({ node: es.configuration.node, requestTimeout: 1000 * 60 * 60 });

const getItem = (html) => '0x' + html.substr(0, 40);

const pages = 162;

const getList = async (page) => {
  console.log('page', `${page}/${pages}`);
  let url = `https://etherscan.io/tokens-nft?ps=100`;
  if (page) url += `&p=${page}`;
  let res = await axios.get(url);
  let html = res.data;

  let strings = html.split('/token/0x');
  strings.shift();
  // return console.log(strings);
  let items: string[] = [];
  for (const str of strings) items.push(getItem(str));
  // items = [...new Set(items)];
  // console.log(items);
  return items;
};

const getAllItems = async () => {
  const arr = [...Array(pages).keys()];
  let items: string[] = [];
  for (const i of arr) {
    items = [...items, ...(await getList(i + 1))];
  }
  items = [...new Set(items)];

  console.log(JSON.stringify(items));
  // console.log(items);
};

export const postItems = async (adresses, method) => {
  const items = adresses ? adresses : nftAddresses;
  for (const address of items) {
    const data = method === 'getTokenIdJSON' ? qs.stringify({ address, tokenId: 1 }) : qs.stringify({ address });

    try {
      await sleep(0.2);

      const res = axios('http://localhost:3000/api/Scrapers/' + method, {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        data,
      });
    } catch (error) {
      console.log(error);
    }
  }
};

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

// getAllItems()

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
 * @TODO use a decoder here for type trait
 */
const getTraits = pipe(
  filter((x: any) => x.traits.length) as any,
  map(prop('traits')),
  flatten,
  map((c: any) => ({traitType: c.trait_type, value: c.value, displayType: c.display_type, maxValue: c.max_value, traitCount: c.trait_count, order: c.order}))
) as any;

const loadTraitsFromAssets = (assets: any[]) => {
  const content = getTraits(assets).map((x: any) => ({ ...x, slug: assets[0].slug}))
  load(content, 'traits');
}

export const load = async (content: any[], index: string) => {
  let ix = 0;
  if (index === 'assets') loadTraitsFromAssets(content);

  console.log(`loading ${content.length} ${index}...`);
  const body = content.flatMap((doc: any) => [
    {
      index: {
        _index: index,
        _type: '_doc',
        _id: getDocId(doc, index),
      },
    },
    doc,
  ]);

  while (body.length > 0) {
    const chop = maxChop(body);
    const result = await client.bulk({ refresh: true, body: chop });
    // console.log(`result items: ${result.body?.items?.length} status code : ${result.statusCode}`);
    // console.log(`${(ix / 2 + result.body?.items?.length).toLocaleString()} objects done. ${body.length / 2} left.`);
    ix += chop.length;
  }
};

export const readPromise = (path: string, method: string) =>
  new Promise((resolve, reject) => {
    fs[method](path, 'utf8', (err: any, data: unknown) => {
      if (err) reject(err);      
      resolve(data);
    });
  });