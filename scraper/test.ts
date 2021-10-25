#!/usr/bin/env node

import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';


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
      const all = collections.map((c: { slug: any; }) => Query.count(db, 'assets', { match: { slug: c.slug } }, {}));
      return Promise.all(all)
        .then((results: any[]) =>
          collections.map((c: any, i: number) => ({
            slug        : c.slug,
            updatedAt   : c.updatedAt,
            shouldHave  : c.stats.count,
            totalSupply : c.stats.count,
            has         : results[i].count,
            originalSlug: results[i].slug
          }))
        )
        .catch(e => console.log(`[err], ${e}`))
    })


const run = async () => {
  let res = await main();
  console.log(res);
  
}

run()

export default main;
