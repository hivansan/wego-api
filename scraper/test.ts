#!/usr/bin/env node

import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import { clamp } from 'ramda';


const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const main = () =>
  Query.find(db, 'collections', { match_all: {} }, { limit: 5000 })
    .then(
      ({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
        ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any; }) => r.value), }, })
    )
    .then(async ({ body }) => {
      const collections = body.results.filter((c: { slug: string | any[]; }) => c.slug?.length);
      const all = collections.map((c: { slug: any; }) => Query.count(db, 'assets', { term: { 'slug.keyword': c.slug } }, {}));
      return Promise.all(all)
        .then((dbResults: any[]) =>
          collections.map((c: any, i: number) => ({
            slug: c.slug,
            updatedAt: c.updatedAt,
            addedAt: c.addedAt,
            totalSupply: clamp(1, 10000, c.stats.count),    // should have
            count: dbResults[i].count,                // has 
            originalSlug: dbResults[i].slug,
            shouldScrape: dbResults[i].count < clamp(1, 10000, c.stats.count)
          }))
            .filter((c: any) => { /* console.log(c.shouldScrape, c.count); */ return c.shouldScrape && c.count; })
            .reduce((a: any, b: any) => { console.log(a, b); return a + b.totalSupply - b.count; }, 0)
        )
        .catch(e => console.log(`[err], ${e}`))
    })

const run = async () => {
  let res = await main();
  console.log(res);
}

run();

export default main;
