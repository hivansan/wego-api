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
// import moment from 'moment';
import axios from 'axios';

import { map, pick, pipe, toString, prop, props, sortBy, tap, flatten, dropRepeats, split, forEach, filter, mergeRight, path, clamp, ifElse } from 'ramda';

import { sleep } from '../server/util';
import { load, openseaAssetMapper, readPromise } from './scraper.utils';
import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';

const promiseRetry = require('promise-retry');
const torAxios = require('tor-axios');
import * as AssetLoader from '../lib/asset-loader';


const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const ports = [9050, 9052, 9053, 9054];
const bail = (err: any) => {
  console.error(err);
  process.exit(1);
};

const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const bots: number = +(process.argv.find((s) => s.startsWith('--bots='))?.replace('--bots=', '') as any) || 1;
const errsToFile: any = process.argv.find((s) => s.startsWith('--errsToFile='))?.replace('--errsToFile=', '') || './data/errors-to.txt';
const errsFromFile: any = process.argv.find((s) => s.startsWith('--errsFromFile='))?.replace('--errsFromFile=', '') || './data/errors-from.txt';
const collectionFilter: string = process.argv.find((s) => s.startsWith('--collectionFilter='))?.replace('--collectionFilter=', '') || '';

const DAYS_WINDOW = 5;

let collectionsCounts: any = {};

const dum = (data: unknown): any => // just to not break the previous flow
  new Promise((resolve, reject) => {
    resolve(data);
  });

/**
 * Save assets from distributed array of links (opensea)
 * saves them to disk ./data/chunks/ (this should be parameter)
 * and to db via laod()
 */
export const saveAssetsFromLinks = async (links: string[], i?: number): Promise<void> => {
  const tor = torAxios.torSetup({
    ip: 'localhost',
    port: i !== undefined ? ports[i] : 9050,
    controlPort: '9051',
    controlPassword: 't00r',
  });

  for (const url of links) {
    const clientCall = !!bots ? tor.get(url) : axios(url);
    // console.log(!!bots, bots, url);
    await sleep(0.35);
      // const data = await clientCall;
    // try {
    promiseRetry({ retries: 5 }, (retry: any, number: any) =>
      clientCall
        .then(({ data }: any) => ({
          assets: data.assets,
          slug: (url as any)
            .split('&')
            .find((s: string) => s.startsWith('collection='))
            .split('=')[1],
          offset: (url as any)
            .split('&')
            .find((s: string) => s.startsWith('offset='))
            .split('=')[1],
        }))
        .then((body: { slug: any }) => ({ ...body, filteredBySlug: links.filter((s) => s.includes(`collection=${body.slug}`)) }))
        .then(tap(({ assets, slug, offset }: any) => console.log(`[url] ${url} assets: ${assets.length} thread: ${i} offset: ${offset}`)))
        .then(({ assets, slug, offset, filteredBySlug }: any) => {
          const isLastUrlOfCollection = (+offset + 50) > +collectionsCounts[slug].supply; // links.indexOf(url) == filteredBySlug.length - 1;

          console.log('collectionsCounts --', collectionsCounts);
          
          
          if (assets?.length) {
            const content = JSON.stringify(assets.map(openseaAssetMapper)) as any;
            load(JSON.parse(content), 'assets');
            if (isLastUrlOfCollection || assets.length < 50) {
              Query.update(db, 'collections', slug, { updatedAt: new Date() }, true).catch((e) => console.log(`[err update collection] url: ${url} ${e}`));
            }
          } else {
            Query.update(db, 'collections', slug, { updatedAt: new Date() }, true).catch((e) => console.log(`[err update collection] url: ${url} ${e}`));
          }
          return isLastUrlOfCollection;
        })
        .catch(async (e: any) => {
          console.log(`[err inside PR] ${e} ${url}`);
          await tor.torNewSession();
          retry(e);
        })
    )
      .then((result: any) => {
        console.log('isLastUrlOfCollection --', result);
        return result;
      })
      .catch(async (e: any) => {
        console.log(`[err catch PR] ${e} ${url}`);
        // fs.appendFile(errsToFile, `${url}\n`, (err) => {
        //   if (err) console.log(`[write 504 file error]`, err);
        // });
      });
  }
};

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
  map(pipe<any, any, any>(({ stats, ...fields }) => mergeRight(fields, stats), pick(['slug', 'totalSupply', 'addedAt', 'updatedAt']))),
  sortByAddedAt,
  filter((c: any) => c.totalSupply),
);

const getLinks = (c: { totalSupply: number; slug: any }): string[] =>
  [...Array(Math.ceil(c.totalSupply / 50)).keys()].map((i) =>
    `https://api.opensea.io/api/v1/assets?format=json&limit=50&offset=${i * 50}&collection=${c.slug}`);

const toLinks = map((c): string[] => [...getLinks(Object(c))]);

const getSplices = (links: string[]): string[][] => {
  const len = Math.ceil(links.length / +bots);
  return [...Array(+bots).keys()].map((c, i) => links.splice(0, len));
};

const divideLinksByWorkers = pipe(toLinks, flatten, dropRepeats, getSplices);

/**
 * arrays from links and send them to download to tor or axios
 */
const distributeToHttpClients = tap((arrOfLinks: string[][]) => {
  for (const [i, links] of arrOfLinks.entries()) saveAssetsFromLinks(links, i);
});

const collectionData = (slug?: string) =>
  !!slug
    ? AssetLoader.getCollection(slug)
      .then(({ body }) => [body])
    : Query.find(db, 'collections', { match_all: {} }, { limit: 5000 })
      .then( ({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
        ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any }) => r.value) } }))
      .then(async ({ body }) =>
        body.results.filter((c: { slug: string | any[] }) => c.slug?.length)
    );

export const countInDb = (collections: any[]): any => {
  const dbPromises = collections.map((c: { slug: any }) => Query.count(db, 'assets', { match: { slug: c.slug } }, {}));
    return Promise.all(dbPromises)
      .then((dbResults: any[]) =>
        collections.map((c: any, i: number) => ({
          slug: c.slug,
          updatedAt: c.updatedAt,
          addedAt: c.addedAt,
          totalSupply: c.stats.count, // should have
          count: dbResults[i].count, // has
          // originalSlug: dbResults[i].slug,
          shouldScrape: dbResults[i].count < clamp(1, 10000, c.stats.count),
        }))
      )
      .catch((e) => console.log(`[err], ${e}`));
}

const assignSupplies = (x: any[]) => (collectionsCounts = x.reduce((obj, cur, i) => ((obj[cur.slug] = { supply: cur.totalSupply }), obj), {}));

export const saveAssets = (slug?: string) =>
  collectionData(slug)
    .then(countInDb as any)
    // .then((x) => { console.log('x =============', x); return x; })
    .then(filter((c: any) => c.shouldScrape))
    .then(topSupply as any)
    .then(filterData as any)
    .then(tap(assignSupplies) as any)
    .then(divideLinksByWorkers as any)
    // .then(saveLinkSlicedFile) // optional
    .then(distributeToHttpClients as any)
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
    .then(getSplices)
    .then(distributeToHttpClients)
    .catch((e) => console.log(`[err] ${e}`));

if (exec) eval(`${exec}()`);
