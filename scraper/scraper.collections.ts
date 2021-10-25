#!/usr/bin/env node

/**
 * this saves the assets
 * Example usage:
 *
 * save collections from scraped opensea.io/rankings
 * `./node_modules/.bin/ts-node ./scraper/scraper.collections.ts --dir=./data/slugs --errsToFile=./data/errors-to.txt`
 * `./node_modules/.bin/ts-node ./scraper/scraper.collections.ts --dir=/Users/ivanflores/dev/projects/py/data/slugs --errsToFile=./data/errors-to.txt`
 */

import { sleep } from '../server/util';
import { readPromise } from './scraper.utils';
import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import * as AssetLoader from '../lib/asset-loader';

const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const dirPath: any = process.argv.find((s) => s.startsWith('--dir='))?.replace('--dir=', '');

/**
 * loads data from collections previously get by python script. these files contain the links to opensea
 */
const loadCollections = () => {
  readPromise(dirPath, 'readdir')
    .then(async (fileNames: any) => {
      const data: any = {};
      fileNames = fileNames.map((t: string) => t.replace('.json', ''));
      const files: any = await Promise.all(fileNames.map((f: string) => readPromise(`${dirPath}/${f}.json`, 'readFile')))
      for (const [i, v] of fileNames.entries()) {
        data[v] = files[i]
          .replace(/[\[\]']+/g, '')
          .replace(/"/g, '')
          .replace(/ /g, '')
          .replace(/(?:\r\n|\r|\n)/g, '')
          .split(',')
          .map((c: string) => c.split('https://opensea.io/collection/')[1])
          .filter((c: string | any[]) => c && c.length);
      }
      return data;
    })
    .then((data) => {
      const collections: any = {};
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

      Query.find(db, 'collections', { match_all: {} }, { limit: 5000 })
        .then(
          ({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
            ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any; }) => r.value), }, })
        )
        .then(async (fromDB) => {
          const toUpdate: any = Object.keys(collections).map((slug) => {
            const result = fromDB.body.results.find((r: { slug: string; }) => r.slug === slug);
            return {
              slug,
              ...(result ? result : {}),
              tags: collections[slug],
              updatedAt: new Date(),
              addedAt: result?.addedAt ? result.addedAt : +new Date()
            };
          });

          toUpdate.sort((a: { addedAt: number; }, b: { addedAt: number; }) => (!!a.addedAt ? a.addedAt > b.addedAt : true)); // undefined first
          // toUpdate.sort((a,b) => !!b.addedAt ? a.addedAt > b.addedAt : true); // undefined last

          for (const collection of toUpdate) {
            await sleep(0.3);
            AssetLoader.collectionFromRemote(collection.slug).then((body) => {
              if (body !== null) {
                console.log(`updating ${collection.slug}`);
                Query.update(db, 'collections', collection.slug, { ...collection, ...body }, true)
                  .catch((e) => console.log(`[e updating collection]`, e));
              }
            });
          }
        });
    })
}

loadCollections();