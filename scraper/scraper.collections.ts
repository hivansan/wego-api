#!/usr/bin/env node

/**
 * Example usage:
 * npx ts-node scraper/scraper.collections.ts
 */

import { sleep } from '../server/util';
import * as Query from '../lib/query';
import { toResult } from '../server/endpoints/util';
import * as AssetLoader from '../lib/asset-loader';
import { db } from '../bootstrap';
import * as Historicals from '../lib/historicals.utils';
import { map, path, pipe, prop } from 'ramda';

const main = () => {
  const q = { match_all: {} };
  // below queries just for tests
  // const q = { bool: { must_not: { match: { 'deleted': true } } } };
  // const q = { bool: { must: { match: { 'slug.keyword': 'boredapeyachtclub' } } } };

  Query.find(db, 'collections', q,
    {
      limit: 5000,
      sort: [{ 'stats.totalVolume': { order: 'desc', missing: '_first' } }],
      source: ['slug', 'deleted', 'stats.totalVolume', 'stats.featuredCollection']
    }
  )
    // .then(
    //   ({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
    //     ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any; }) => r.value), }, })
    // )
    .then(path(['body', 'hits', 'hits']) as any)
    .then(map(pipe(toResult, prop('value'))))
    .then(async (collections) => {
      for (const collection of collections) {
        await sleep(0.8);
        AssetLoader.collectionFromRemote(collection.slug)
          // colection from remote
          .then(async (collectionFR) => {
            if (collectionFR !== null/*  && !!collection.stats */) {
              Historicals.load({ index: 'collections', id: collectionFR.slug, slug: collectionFR.slug, data: collectionFR.stats })
              console.log(`${collection.slug}, deleted: ${collectionFR.deleted} \t\t actual Volume: ${collection.stats?.totalVolume} os: ${collectionFR.stats.totalVolume}`);
              (collectionFR as any).stats.featuredCollection = collection.stats?.featuredCollection || false;
              try {
                if (collection.stats?.totalVolume === collectionFR.stats.totalVolume) return;
                console.log(`updating ${collection.slug}`);
                await Query.update(db, 'collections', collection.slug, collectionFR, true);
                console.log(`[success updated collection] ${collectionFR.slug}`);

                if (collection.deleted === collectionFR.deleted) return;
                await Query.updateByQuery(db, 'assets', { match: { 'slug.keyword': collection.slug } }, { source: `ctx._source['deleted'] = ${collectionFR.deleted}` }, true);
                console.log(`[success updated assets] ${collectionFR.slug}`);
              } catch (error) {
                console.log('[error in collection scraper] ', collection.slug, error?.meta?.body ? JSON.stringify(error.meta.body, null, 2) : error);
              }

            } /* else if (collectionFR !== null && !collection.stats) {
              try {
                console.log('collectionFR', collectionFR);

                await Query.update(db, 'collections', collection.slug, collectionFR, true);

              } catch (error) {
                console.log('[error in collection scraper] ', collection.slug, error?.meta?.body ? JSON.stringify(error.meta.body, null, 2) : error);
              }
            } */
          });
      }
    });
}

if (require.main === module) main();