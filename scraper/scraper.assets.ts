#!/usr/bin/env node

/**
 * this saves the assets
 * Example usage:
 * `./node_modules/.bin/ts-node ./scraper/scraper.assets.ts --exec=saveAssets --bots=4 --errsToFile=./data/errors-to-assets.txt`
 *
 * for just a collection
 * `./node_modules/.bin/ts-node ./scraper/scraper.assets.ts --exec=saveAssets --collectionFilter=nfh --bots=1`
 *
 * from a file
 * `./node_modules/.bin/ts-node ./scraper/scraper.assets.ts --exec=fromFile --errsFromFile=./data/errors-from.txt --bots=6`
 */

import fs from 'fs';

import { map, pick, pipe, toString, prop, props, sortBy, tap, flatten, dropRepeats, split, forEach, filter, mergeRight, path, clamp, ifElse, splitEvery } from 'ramda';
import axios from 'axios';

import { sleep } from '../server/util';
import { load, openseaAssetMapper, readPromise } from './scraper.utils';
import * as Query from '../lib/query';
import { toResult } from '../server/endpoints/util';

const promiseRetry = require('promise-retry');
const torAxios = require('tor-axios');

import * as AssetLoader from '../lib/asset-loader';

import { db } from '../bootstrap';
import { Asset } from '../models/asset';

// add SocksPort mac: /usr/local/etc/tor/torrc linux: /etc/tor/torrc
const ports: number[] = [9050]//, 9052, 9053, 9054, 9055, 9056, 9057, 9058, 9059, 9060, 9061, 9062, 9063, 9064, 9065, 9066, 9067, 9068, 9069, 9070, 9071, 9072, 9074, 9075, 9076, 9077, 9078, 9079, 9080, 9081, 9082, 9083, 9084, 9085, 9086, 9087, 9088, 9089, 9090, 9091, 9092, 9093, 9094, 9095, 9096, 9097, 9098, 9099, 9100];

const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const bots: number = +(process.argv.find((s) => s.startsWith('--bots='))?.replace('--bots=', '') as any) || ports.length;
const errsToFile: any = process.argv.find((s) => s.startsWith('--errsToFile='))?.replace('--errsToFile=', '') || './data/errors-to.txt';
const errsFromFile: any = process.argv.find((s) => s.startsWith('--errsFromFile='))?.replace('--errsFromFile=', '') || './data/errors-from.txt';
const linear: boolean = true;//!!process.argv.find((s) => s.startsWith('--linear='))?.replace('--linear=', '');

let collectionsCounts: any = {};

export async function saveAssetsFromUrl(url: string, i: number, tor?: any, torInstance?: any, sleepFactor?: number): Promise<void> {
  const SLEEP = (ports.length - 1) * .8;
  await sleep(linear ? i / 3 : (sleepFactor as number * SLEEP));

  console.log(`[attempting] ${url} ${i}`);
  return promiseRetry({ retries: 5, randomize: true, factor: 2 }, (retry: any, number: any) =>
    // torInstance.get(url)
    axios(url)
      .then(({ data }: any) => ({
        assets: data.assets,
        slug: (url as any).split('&').find((s: string) => s.startsWith('collection=')).split('=')[1],
        offset: (url as any).split('&').find((s: string) => s.startsWith('offset=')).split('=')[1],
      }))
      .then((body: { slug: any; }) => ({ ...body }))
      .then(tap(({ assets, slug, offset }: any) => console.log(`[url] ${url} assets: ${assets.length} thread: ${i} offset: ${offset}`)))
      .then(tap(({ assets, slug, offset }: any) => {
        const isLastUrlOfCollection = (+offset + 50) > +collectionsCounts[slug].supply;

        console.log('collectionsCounts', collectionsCounts);


        if (assets?.length) {
          const content = JSON.stringify(assets.map((c: any) => ({ ...c, collection: { stats: { total_supply: collectionsCounts[slug].supply } } })).map(openseaAssetMapper)) as any;
          // console.log(content);

          load(JSON.parse(content), 'assets');
          if (isLastUrlOfCollection || assets.length < 50) {
            Query.update(db, 'collections', slug, { updatedAt: new Date() }, true).catch((e) => console.log(`[err update collection] url: ${url} ${e}`));
          }
        } else {
          Query.update(db, 'collections', slug, { updatedAt: new Date() }, true).catch((e) => console.log(`[err update collection] url: ${url} ${e}`));
        }
        return assets;
      }))
      .catch(async (e: any) => {
        console.log(`[err inside PR] ${e} ${url}`);
        await tor.torNewSession();
        retry(e);
      })
  )
    .then((result: any) => {
      return result;
    })
    .catch(async (e: any) => {
      console.log(`[err catch PR] ${e} ${url}`);
      fs.appendFile(errsToFile, `${url}\n`, (err) => {
        if (err) console.log(`[write 504 file error]`, err);
      });
    });

}

const topSupply = map((c) => ({ ...Object(c), totalSupply: Object(c).totalSupply > 10000 ? 10000 : Object(c).totalSupply }));

/** this only saves the array of links sliced. optionally further to read from several instances */
const saveLinkSlicedFile = (links: string[][]) => {
  for (const [index, value] of links.entries()) {
    fs.writeFile(`./data/links-chunks/${index}.json`, JSON.stringify(value), (err) => {
      if (err) console.log(`[write file err] ${err}`);
    });
  }
  return links;
};

const sortByAddedAt = sortBy(prop('addedAt') as any);
// const sortByAddedAt = (x: any) => x.sort((a, b) => (!!a.addedAt ? a.addedAt > b.addedAt : true));

const filterData = pipe(
  map(pipe<any, any, any>(({ stats, ...fields }) => mergeRight(fields, stats), pick(['slug', 'totalSupply', 'addedAt', 'count', 'loading', 'updatedAt']))),
  sortByAddedAt,
  filter((c: any) => c.totalSupply),
);

const getLinks = (c: { totalSupply: number; slug: any, count: number }): string[] => {
  // console.log('c ------------', c);
  c.count = c.count || 0;
  const startingOffset = Math.floor(c.count / 50) || 0;
  return [...Array(Math.ceil((c.totalSupply - c.count) / 50)).keys()].map((i) =>
    `https://api.opensea.io/api/v1/assets?format=json&limit=50&offset=${(i + startingOffset) * 50}&collection=${c.slug}`);
}

const toLinks = map((c): string[] => [...getLinks(Object(c))]);

const transform = pipe(toLinks, flatten, dropRepeats);

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
      arrOfLinks.map((link: any, linkIndex: number) => {
        console.log(linkIndex, ports, ports.length, linkIndex % (ports.length))
        return saveAssetsFromUrl(link, linkIndex, tors[linkIndex % (ports.length)], torInstances[linkIndex % (ports.length)], linkIndex)
      })
    ).then(flatten)
  } else {
    return Promise.all(
      splitEvery(split, arrOfLinks)
        .map((chunk, i) => Promise.all(chunk.map((link: any, linkIndex: number) => saveAssetsFromUrl(link, i, tors[i], torInstances[i], linkIndex))))
    ).then(flatten)
  }
}

const collectionData = (slug?: string) =>
  !!slug
    ? AssetLoader.getCollection(db, slug)
      .then(({ body }) => [body])
    : Query.find(db, 'collections', { match_all: {} }, { limit: 5000 })
      .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
        ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any }) => r.value) } }))
      .then(async ({ body }) =>
        body.results.filter((c: { slug: string | any[] }) => c.slug?.length)
      );

export const countInDb = (collections: any[]): any => {
  const dbPromises = collections.map((c: { slug: any }) => Query.count(db, 'assets', { term: { 'slug.keyword': c.slug } }, {}));
  return Promise.all(dbPromises)
    .then((dbResults: any[]) =>
      collections.map((c: any, i: number) => ({
        slug: c.slug,
        updatedAt: c.updatedAt,
        addedAt: c.addedAt,
        totalSupply: c.stats.count, // should have
        count: dbResults[i].count,  // has
        loading: dbResults[i].loading,
        shouldScrape: dbResults[i].count < clamp(1, 10000, c.stats.count),
      }))
    )
    .catch((e) => console.log(`[err], ${e}`));
}

const assignSupplies = (x: any[]) => (collectionsCounts = x.reduce((obj, cur, i) => ((obj[cur.slug] = { supply: cur.totalSupply }), obj), {}));

export const saveAssets = (slug?: string) =>
  collectionData(slug)
    .then(countInDb as any)
    // .then(filter(prop('shouldScrape') as any))
    .then(topSupply as any)
    .then(filterData as any)
    .then(tap(assignSupplies) as any)
    .then(transform as any)
    // .then(saveLinkSlicedFile) // optional
    .then(tap((x: any[]) => console.log('x ---------', x)) as any)
    .then(distributeToHttpClients as any)
    .then(tap((x: any[]) => console.log('x ---------', x.length)) as any)
    .catch((e) => {
      console.error('[save assets from collections]', e);
    });

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

if (exec) eval(`${exec}()`);
