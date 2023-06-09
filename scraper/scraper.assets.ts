#!/usr/bin/env node

/**
 * this saves the assets
 * Example usage:
 * `npx ts-node ./scraper/scraper.assets.ts --exec=saveAssets --bots=4 --errsToFile=./data/errors-to-assets.txt`
 * 
 * only requested via score endpoint
 * `npx ts-node ./scraper/scraper.assets.ts --exec=saveAssets --onlyRequested=1 --errsToFile=./data/errors-to-assets.txt`
 * via the built dist
 * `/usr/bin/env node ./dist/scraper/scraper.assets.js --exec=saveAssets --onlyRequested=1 --errsToFile=./errors-to-assets.txt`
 *
 * for just a collection
 * `npx ts-node ./scraper/scraper.assets.ts --exec=saveAssets --collectionFilter=nfh --bots=1`
 *
 * from a file
 * `npx ts-node ./scraper/scraper.assets.ts --exec=fromFile --errsFromFile=./data/errors-from.txt --bots=6`
 */

import fs from 'fs';

import { map, pick, pipe, toString, prop, props, sortBy, tap, flatten, dropRepeats, split, forEach, filter, mergeRight, path, clamp, ifElse, splitEvery, when } from 'ramda';
import axios from 'axios';
import queryString from 'query-string';


import { sleep } from '../server/util';
import { load, openseaAssetMapper, readPromise } from './scraper.utils';
import * as Query from '../lib/query';
import { toResult } from '../server/endpoints/util';

const promiseRetry = require('promise-retry');
const torAxios = require('tor-axios');

import * as AssetLoader from '../lib/asset-loader';

import { db } from '../bootstrap';
import * as Scrape10K from './scrape10k+';
import { OPENSEA_API } from '../lib/constants';


// add SocksPort mac: /usr/local/etc/tor/torrc linux: /etc/tor/torrc
const ports: number[] = [9050]//, 9052, 9053, 9054, 9055, 9056, 9057, 9058, 9059, 9060, 9061, 9062, 9063, 9064, 9065, 9066, 9067, 9068, 9069, 9070, 9071, 9072, 9074, 9075, 9076, 9077, 9078, 9079, 9080, 9081, 9082, 9083, 9084, 9085, 9086, 9087, 9088, 9089, 9090, 9091, 9092, 9093, 9094, 9095, 9096, 9097, 9098, 9099, 9100];

const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const bots: number = +(process.argv.find((s) => s.startsWith('--bots='))?.replace('--bots=', '') as any) || ports.length;
const errsToFile: any = process.argv.find((s) => s.startsWith('--errsToFile='))?.replace('--errsToFile=', '') || './data/errors-to.txt';
const errsFromFile: any = process.argv.find((s) => s.startsWith('--errsFromFile='))?.replace('--errsFromFile=', '') || './data/errors-from.txt';
const linear: boolean = !!process.argv.find((s) => s.startsWith('--linear='))?.replace('--linear=', '');

// only requested collections via /score endpoint
const onlyRequested: boolean = !!process.argv.find((s) => s.startsWith('--onlyRequested='))?.replace('--onlyRequested=', '');

// rate for the sleep
const factor: number = Number(process.argv.find((s) => s.startsWith('--factor='))?.replace('--factor=', '') || 3);
const limitCollections: number = Number(process.argv.find((s) => s.startsWith('--limitCollections='))?.replace('--limitCollections=', '') || 3000);
// this does the process cyclic. 
const forceScrape: boolean = !!process.argv.find((s) => s.startsWith('--forceScrape='))?.replace('--forceScrape=', '');
const above10k: boolean = !!process.argv.find((s) => s.startsWith('--above10k='))?.replace('--above10k=', '');
const slug: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');


let collectionsCounts: any = {};

export const saveAssetsFromUrl = async (
  { url, i, tor, torInstance, sleepFactor, slug, factor, collectionData }:
    { url: string, i: number, tor?: any, torInstance?: any, sleepFactor?: number, slug?: string, factor: number, collectionData?: object }
): Promise<any[]> => {
  // const SLEEP = (ports.length - 1) * .8;
  // await sleep(linear ? i / factor : (sleepFactor as number * SLEEP));
  await sleep(i / factor);

  console.log(`[attempting] ${url} ${i}`);
  return promiseRetry({ retries: 5, randomize: true, factor: 2 }, (retry: any, number: any) =>
    // torInstance.get(url)
    axios(url, { headers: { Accept: 'application/json', 'X-API-KEY': process.env.OPENSEA_API_KEY }, })
      .then(({ data }: any) => ({
        assets: data.assets,
        slug: slug ? slug : queryString.parseUrl(url).query.collection,
        offset: queryString.parseUrl(url).query.offset,
        limit: queryString.parseUrl(url).query.limit,
      }))
      .then((body: { slug: any; }) => ({ ...body }))
      .then(tap(({ assets, slug, offset, limit }: any) => console.log(`[url] ${url} assets: ${assets.length} thread: ${i} offset: ${offset}, limit: ${limit}`)))
      .then(tap(({ assets, slug, offset, limit }: any) => {
        const isLastUrlOfCollection = (+offset + 50) >= +collectionsCounts[slug]?.supply;

        if (assets?.length) {
          const content = JSON.stringify(assets.map((asset: any) => ({
            ...asset,
            collection: collectionData ? collectionData : { ...asset.collection, stats: { totalSupply: collectionsCounts[slug]?.supply } }
          })).map(openseaAssetMapper)) as any;

          load(JSON.parse(content), 'assets');
          if (isLastUrlOfCollection || assets.length < (+limit || 20)) {
            Query.update(db, 'collections', slug, { lastScrapedAt: new Date(), updatedAt: new Date(), requestedScore: false }, true).catch((e) => console.log(`[error update collection] url: ${url} ${e}`));
          }
        } else {
          Query.update(db, 'collections', slug, { lastScrapedAt: new Date(), updatedAt: new Date(), requestedScore: false }, true).catch((e) => console.log(`[error update collection] url: ${url} ${e}`));
        }
      }))
      .catch(async (e: any) => {
        console.log('\x1b[41m%s\x1b[0m', `[error inside PR] ${e} ${url}`);
        // await tor.torNewSession();
        retry(e);
      })
  )
    .then((result: any) => result.assets)
    .catch(async (e: any) => {
      console.log(`[error catch PR] ${e} ${url}`);
      const collection = slug ? slug : queryString.parseUrl(url).query?.collection as string;
      if (collection) {
        Query.update(db, 'collections', collection, { lastScrapedAt: new Date(), updatedAt: new Date(), requestedScore: false, damagedCollection: true }, true)
          .catch((e) => console.log(`[error update collection] url: ${url} ${e}`));
      }
      fs.appendFile(errsToFile, `${url}\n`, (err) => {
        if (err) console.log(`[write 504 file error]`, err);
      });
    });

}

/** this only saves the array of links sliced. optionally further to read from several instances */
const saveLinkSlicedFile = (links: string[][]) => {
  for (const [index, value] of links.entries()) {
    fs.writeFile(`./data/links-chunks/${index}.json`, JSON.stringify(value), (err) => {
      if (err) console.log(`[write file err] ${err}`);
    });
  }
  return links;
};

const sortByRequested = sortBy(prop('requestedScore') as any);
const sortByAddedAt = sortBy(prop('addedAt') as any);
// const sortByAddedAt = (x: any) => x.sort((a, b) => (!!a.addedAt ? a.addedAt > b.addedAt : true));

const filterData = pipe(
  // when(() => onlyRequested, filter(prop('requestedScore') as any)),
  when(() => !forceScrape, filter(prop('shouldScrape') as any)) as any,
  // filter(prop('shouldScrape') as any) as any,
  map((pick(['slug', 'totalSupply', 'addedAt', 'count', 'loading', 'updatedAt', 'requestedScore']) as any)),
  filter((c: any) => c.totalSupply),
);

const getLinks = (c: { totalSupply: number; slug: any, count: number }): string[] => {
  c.count = 0; // c.count || 0;
  const startingOffset = 0; // Math.floor(c.count / 50) || 0;
  return [...Array(Math.ceil((c.totalSupply - c.count) / 50)).keys()].map((i) =>
    `${OPENSEA_API}/assets?format=json&limit=50&offset=${(i + startingOffset) * 50}&collection=${c.slug}`);
}

const toLinks = map((c): string[] => [...getLinks(Object(c))]);

const transform = pipe(
  toLinks,
  flatten,
  dropRepeats,
);

const distributeToHttpClients = (arrOfLinks: string[]) => {
  const split = Math.ceil(arrOfLinks.length / +bots)
  const tors: any = [];
  const torInstances: any = [];
  for (let i = 0; i < +bots; i++) {

    const tor = torAxios.torSetup({
      ip: 'localhost',
      port: ports[i],
      controlPort: '9051',
      controlPassword: 't00r',
    })

    torInstances.push(axios.create({
      httpAgent: tor.httpAgent(),
      httpsAgent: tor.httpsAgent(),
      timeout: 0,
    }));

    tors.push(tor);
  }

  if (linear) {
    return Promise.all(
      arrOfLinks.map((link: any, linkIndex: number) =>
        saveAssetsFromUrl({
          url: link,
          i: linkIndex,
          tor: tors[linkIndex % (ports.length)],
          torInstance: torInstances[linkIndex % (ports.length)],
          sleepFactor: linkIndex,
          factor,
        })
      )
    ).then(flatten)
  } else {
    return Promise.all(
      splitEvery(split, arrOfLinks)
        .map((chunk, i) => Promise.all(chunk.map((link: any, linkIndex: number) =>
          saveAssetsFromUrl({
            url: link,
            i,
            tor: tors[i],
            torInstance: torInstances[i],
            sleepFactor: linkIndex,
            factor
          })))
        )
    ).then(flatten)
  }
}

const collectionsData = ({ slug, sort, query }: any) =>
  !!slug
    ? AssetLoader.getCollection(db, slug)
      .then(({ body }) => [body])
    : Query.find(db, 'collections', query, { limit: slug ? 1 : limitCollections, sort, })
      .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
        ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any }) => r.value) } }))
      .then(({ body }) => body.results.filter((c: { slug: string | any[] }) => c.slug?.length));

export const countInDb = (collections: any[]): any => {
  const dbPromises = collections.map((c: { slug: any }) => Query.count(db, 'assets', { term: { 'slug.keyword': c.slug } }, {}));
  return Promise.all(dbPromises)
    .then((dbResults: any[]) =>
      collections.map((c: any, i: number) => ({
        ...c,
        totalSupply: c.stats?.count, // clamp(1, 10000, c.stats?.count), // should have
        count: dbResults[i].count,  // has
        shouldScrape: ((c.stats?.count - dbResults[i].count) > c.stats?.count * 0.003)
      }))
    )
    .catch((e) => console.log(`[err], ${e}`));
}

const assignSupplies = (x: any[]) => (collectionsCounts = x.reduce((obj, cur, i) => ((obj[cur.slug] = { supply: cur.totalSupply }), obj), {}));

const saveAssets = () => {
  console.log('[scraper assets options]', {
    exec,
    bots,
    errsToFile,
    errsFromFile,
    linear,
    onlyRequested,
    factor,
    limitCollections,
    forceScrape,
    above10k,
    slug,
  });

  collectionsData({
    slug, sort: [{ requestedScore: { order: 'desc' } }], query: {
      bool: {
        "must": [
          { "exists": { "field": "slug" } },
          { "match": { "requestedScore": true } }, // this does first the requested score collections via /score
          { "range": { "stats.totalSupply": above10k ? { "lte": 13000, "gt": 10000 } : { "lte": 10000, "gt": 1 } } },
        ],
        "must_not": [{ "match": { "deleted": true } }]
      }
    },
  })
    .then(when((x: any) => !x.length && !onlyRequested && !slug, (x) => collectionsData({
      "sort": [
        { "lastScrapedAt": { "order": "asc", "missing": "_first" } },
        { "requestedScore": { "order": "desc" } },
        { "revealedPercentage": { "order": "asc" } },
        { "stats.totalSupply": { "order": "desc" } }
      ],
      query: {
        "bool": {
          "must_not": [
            { "match": { "deleted": true } },
            { "match": { "ranked": true } }
          ],
          "must": [
            { "range": { "stats.totalSupply": above10k ? { "lte": 13000, "gt": 10000 } : { "lte": 10000, "gt": 1 } } },
            // { "range": { "revealedPercentage": { "lt": 1 } } },
            { "exists": { "field": "slug" } }
          ]
        }
      }
    })))
    .then(tap((x: any[]) => console.log('x 1 raw ---------', x)) as any)
    .then(countInDb as any)
    .then(tap((x: any[]) => console.log('x 2 count in db ---------', x)) as any)
    .then(filterData as any)
    .then(tap(assignSupplies) as any)
    .then(tap((x: any[]) => console.log('x 3 filtered data ---------', x)) as any)
    .then(
      ifElse(
        (collections) => above10k,
        async (collections) => {
          console.log(' this is a 10 k ');
          if (collections?.length) {
            for (const collection of collections) await Scrape10K.scrape10k(collection.slug)
          };
        },
        pipe(transform, distributeToHttpClients)
      )
    )
    // .then(transform as any)
    // .then(distributeToHttpClients as any)
    // .then(tap((x: any[]) => console.log('x 4 ---------', x.length)) as any)
    .catch((e) => {
      console.error('[save assets from collections]', e);
    });
}

const readFilePromise = (path: fs.PathOrFileDescriptor) =>
  new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) resolve(err);
      resolve(data);
    });
  });

const fromFile = () =>
  readFilePromise(errsFromFile)
    .then(toString)
    .then(split('\\n'))
    .then(distributeToHttpClients)
    .catch((e) => console.log(`[err] ${e}`));


if (require.main === module) if (exec) eval(`${exec}()`);
