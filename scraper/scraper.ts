#!/usr/bin/env node
'use strict';

/**
 * this saves the assets
 * Example usage:
 * `./node_modules/.bin/ts-node ./scraper/scraper.ts --exec=saveAssetsFromCollections --bots=6`
 *
 * save collections from scraped opensea.io/rankings
 * `./node_modules/.bin/ts-node ./scraper/scraper.ts --exec=loadCollections --dir=./data/slugs`
 */

import fs, { readFile } from 'fs';
import moment from 'moment';
import axios from 'axios';
import torAxios from 'tor-axios';

import * as QuerySQL from '../lib/query.mysql';

import { fromPairs, map, pick, pipe, toString, prop, props, sortBy, tap, flatten, dropRepeats, split, forEach } from 'ramda';
import { sleep } from '../server/util';
import { load, readPromise } from './scraper.utils';
import { dir } from 'console';
import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import * as AssetLoader from '../lib/asset-loader';


const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const ports = [9050, 9052, 9053, 9054];
const bail = (err) => {
  console.error(err);
  process.exit(1);
};

const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const bots: any = process.argv.find((s) => s.startsWith('--bots='))?.replace('--bots=', '');
const errsToFile: any = process.argv.find((s) => s.startsWith('--errsToFile='))?.replace('--errsToFile=', '') || './data/errors-to.txt';
const errsFromFile: any = process.argv.find((s) => s.startsWith('--errsFromFile='))?.replace('--errsFromFile=', '') || './data/errors-from.txt';

const dirPath: any = process.argv.find((s) => s.startsWith('--dir='))?.replace('--dir=', '');


const xForm = pipe(map(props(['trait_type', 'value'])), fromPairs as any);

const DAYS_WINDOW = 5;

const openseaAssetMapper = (asset: any) => ({
  tokenId: asset.token_id,
  contractAddress: asset.asset_contract.address,
  slug: asset.collection.slug,
  name: asset.name,
  owners: asset.owners,
  owner: asset.owner,
  description: asset.description, //  rariMeta.description,
  imageBig: asset.image_original_url, // rariMeta.image.url.BIG,
  imageSmall: asset.image_preview_url, // rariMeta.image.url.PREVIEW,
  animationUrl: asset.animation_url,
  traits: asset.traits,
  traitMap: xForm(asset.traits),
  //rariscore: https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c
  rariScore: asset?.traits?.length && asset.collection?.stats?.total_supply ? asset.traits.reduce((acc, t) => acc + 1 / (t.trait_count / asset.collection.stats.total_supply), 0) : null,
  tokenMetadata: asset.token_metadata,
  updatedAt: new Date(),
});

/**
 * maybe not used anymore
 */
// export const saveAssetsFromCollection = async (slug?: string) => {
//   try {
//     // const { Collection, Asset } = Scraper.app.models;
//     const collection = await QuerySQL.findOne(`select * from Collection where slug is not null and slug = '${slug}' and updatedAt < '${moment().subtract(DAYS_WINDOW, 'days').format('YYYY-MM-DD HH:mm:ss')}' limit 1`);

//     const today = moment();
//     const updatedDate = moment(collection.updatedAt);
//     const shouldUpdate = !collection.updatedAt || today.diff(updatedDate, 'days') > 3;
//     // assetsCount != null &&
//     // collection.totalSupply &&
//     // assetsCount < collection.totalSupply;

//     console.log(`slug: ${slug} assetsCount: completed: ${!shouldUpdate}`);
//     if (!shouldUpdate) {
//       return;
//     }

//     let page = 0;
//     let assets: Array<any> = [];
//     const params: any = {
//       collection: slug,
//       offset: 0,
//       limit: 50,
//     };

//     let queryParams: URLSearchParams, url: any;
//     let results = { data: { assets: [1] } };
//     while (results.data?.assets?.length && page < 201) {
//       params.offset = page * params.limit;
//       queryParams = new URLSearchParams(params); //.toString();
//       url = `https://api.opensea.io/api/v1/assets?${queryParams}`;
//       console.log(`page: ${page} slug: ${slug} offset: ${params.offset} results?.data?.assets.length: ${results?.data?.assets.length}`);
//       console.log(`page: ${url}`);
//       results = await axios(url);

//       if (results?.data?.assets?.length) {
//         console.log('results?.data?.assets?.length', results?.data?.assets?.length);
//         assets = [...assets, ...results?.data?.assets];
//         // scraperHelpers.saveAssets(results.data.assets);
//         page++;
//       }
//     }

//     fs.writeFile(`./data/${slug}.json`, JSON.stringify(assets.map(openseaAssetMapper)), (err) => {
//       if (err) console.log(`[write file err] ${err}`);
//       load(JSON.stringify(assets.map(openseaAssetMapper)) as any, 'assets')
//     });
//     QuerySQL.run(`update Collection set updatedAt = '${moment().format('YYYY-MM-DD HH:mm:ss')}' where slug = '${slug}'`);

//     // return {}
//   } catch (error) {
//     // throw error;
//     return;
//   }
// };

export const saveAssetsFromLinks = async (links: string[], i?: number): Promise<void> => {
  const tor = torAxios.torSetup({
    ip: 'localhost',
    port: i !== undefined ? ports[i] : 9050,
    controlPort: '9051',
    controlPassword: 't00r',
  });

  for (const url of links) {
    const prom = i !== undefined ? tor.get(url) : axios(url);
    await sleep(0.35);
    prom
      .then(({ data }) => ({
        assets: data.assets,
        slug: (url as any).split('&').find((s: string) => s.startsWith('collection=')).split('=')[1],
        offset: (url as any).split('&').find((s: string) => s.startsWith('offset=')).split('=')[1],
      }))
      // .then(tap((x) => console.log(x)))
      .then((body: { slug: any }) => ({ ...body, filteredBySlug: links.filter((s) => s.includes(`collection=${body.slug}`)) }))
      .then(tap(({ assets, slug, offset }) => console.log(url, assets?.length, `-- ${i}`)))
      .then(({ assets, slug, offset, filteredBySlug }) => {
        if (assets?.length) {
          const content = JSON.stringify(assets.map(openseaAssetMapper)) as any;
          fs.writeFile(`./data/chunks/${slug}:${offset}.json`, content, (err) => {
            if (err) console.log(`[write file err] ${err}`);
            load(content, 'assets')
          });

          const isLastUrlOfCollection = links.indexOf(url) == filteredBySlug.length - 1;
          console.log(`[${slug}]`, isLastUrlOfCollection, filteredBySlug.length - 1);

          if (isLastUrlOfCollection || 1 || assets.length < 50) {
            QuerySQL.run(`update Collection set updatedAt = '${moment().format('YYYY-MM-DD HH:mm:ss')}' where slug = '${slug}'`);
          }
        } else {
          QuerySQL.run(`update Collection set updatedAt = '${moment().format('YYYY-MM-DD HH:mm:ss')}' where slug = '${slug}'`);
        }
      })
      .catch((e: any) => {
        tor.torNewSession();
        console.log(`[err] ${e} ${url}`);
        fs.appendFile(errsToFile, `${url}\n`, (err) => {
          if (err) console.log(`[save 504 file error]`, err);
        });
      });
  }
};

const getLinks = (c: { totalSupply: number; slug: any }): string[] => [...Array(Math.ceil(c.totalSupply / 50)).keys()].map((i) => `https://api.opensea.io/api/v1/assets?limit=50&offset=${i * 50}&collection=${c.slug}`);

const topSupply = map((c) => ({ ...Object(c), totalSupply: Object(c).totalSupply > 10000 ? 10000 : Object(c).totalSupply }));
const toLinks = map((c): string[] => [...getLinks(Object(c))]);

const getSplices = (links: string[]): string[][] => {
  const len = Math.ceil(links.length / +bots);
  return [...Array(+bots).keys()].map((c, i) => links.splice(0, len));
};

/** this only saves the array of links sliced. optionally further to read from several instances */
const saveLinkSlicedFile = (links: string[][]) => {
  for (const [index, value] of links.entries()) {
    fs.writeFile(`./data/links-chunks/${index}.json`, JSON.stringify(value), (err) => {
      if (err) console.log(`[write file err] ${err}`);
    });
  }
  return links;
};

const sort = sortBy(prop('totalSupply') as any);
const transformData = pipe(
  map(pick(['slug', 'totalSupply'])),
  sort,
  map(Object),
  topSupply,
  toLinks,
  flatten,
  dropRepeats,
  tap((x) => console.log(x)),
  getSplices
);

const distributeBots = (arrOfLinks: string[][]) => {
  for (const [i, links] of arrOfLinks.entries()) saveAssetsFromLinks(links, i);
};

export const saveAssetsFromCollections = () =>
  QuerySQL.find(`select * from Collection where updatedAt < '${moment().subtract(DAYS_WINDOW, 'days').format('YYYY-MM-DD HH:mm:ss')}';`)
    // .then(sortWith(descend(prop('totalSupply'))))
    .then(transformData)
    // .then(saveLinkSlicedFile)
    .then(distributeBots)
    .catch((e) => {
      console.error('[save assets from collections]', e);
    });

const readFilePromise = (path) =>
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
    .then(distributeBots)
    .catch((e) => console.log(`[err] ${e}`));

const readSlugsFile = (file: any) => {
  readPromise(dirPath, 'readFile')
}

/**
 * loads data from collections previously get by python script. these files contain the links to opensea
 */
const loadCollections = () => {
  readPromise(dirPath, 'readdir')
    // esto regrsea un array de promises. [0,1,2,3,4] esos hay que mappearlos con los files.
    .then(async (fileNames: any) => {
      const data = {};
      fileNames = fileNames.map((t: string) => t.replace('.json', ''));
      const files : any = await Promise.all(fileNames.map((f: string) => readPromise(`${dirPath}/${f}.json`, 'readFile')))
      for (const [i, v] of fileNames.entries()) {
        data[v] = JSON.parse(files[i].split('][').join(',')).map((c: string) => c.split('https://opensea.io/collection/')[1]).filter((c: string | any[]) => c.length);
      }
      return data;
    })
    .then((data) => {
      const collections = {};
      // 1. transform collection from scraped files into { key value } and get the tags
      for (const [file, v] of Object.entries(data)) {
        for (const slug of v as string[]) {
          const tags = file.includes('new')
            ? [file.replace('_new', ''), 'new']
            : [file];
          // console.log(slug);
          collections[slug] = collections[slug]
            ? [...new Set([...collections[slug], ...tags])]
            : tags;
        }
      }

      // console.log('collections', collections);

      Query.find(db, 'collections', { match_all: {} }, { limit: 5000 })
        .then(
          ({body: {took,timed_out: timedOut,hits: { total, hits },}, }) =>
          ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r) => r.value), }, })
        )
        .then(async (fromDB) => {

          const toUpdate: any = Object.keys(collections).map((key) => {
            const result = fromDB.body.results.find((r) => r.slug === key);
            return {
              ...(result ? result : { addedAt: new Date() }),
              tags: collections[key],
              udpatedAt: new Date(),
            };
          });

          // toUpdate.length = 1;
          console.log('toUpdate', toUpdate.length);

          // load(toUpdate, 'collections');
          toUpdate.sort((a, b) => (!!a.addedAt ? a.addedAt > b.addedAt : true)); // undefined first
          // toUpdate.sort((a,b) => !!b.addedAt ? a.addedAt > b.addedAt : true); // undefined last

          for (const collection of toUpdate) {
            await sleep(0.3);
            AssetLoader.collectionFromRemote(collection.slug).then((body) => {
              if (body !== null) {
                console.log('body to update', body.slug);
                Query.updateByIndex(db, 'collections', collection.slug, { doc: { ...body, updatedAt: new Date() } })
                  .catch((e) => console.log(`[e updating collection]`));
              }
            });
          }
        });
    })
}

/**
 * @TODO
 * sort newest collections first (by date added or without info, just slug)
 * pull collection and save it
 */
const updateCollections = () => {

}

if (exec) eval(`${exec}()`);
