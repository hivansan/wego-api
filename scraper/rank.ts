/**
 * rank and save collections
 */
import * as Query from '../lib/query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import { countInDb } from './scraper.assets';
import { filter, prop, tap } from 'ramda';
import * as Stats from '../lib/stats';
import { sleep } from '../server/util';
import { load } from './scraper.utils';

const main = () => {
  Query.find(db, 'collections', { match_all: {} }, { limit: 5000 })
    .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
      ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any }) => r.value) } }))
    .then(({ body }) => body.results.filter((c: { slug: string | any[] }) => c.slug?.length))
    .then(countInDb as any)
    .then((x) => x.filter((c: any) => c.totalSupply > 0 && (c.totalSupply - c.count) <= 0 && !c.ranked))
    .then(async (collections) => {
      // collections.length = 1;
      for (const collection of collections) {
        console.log('ranking collection.slug', collection.slug);
        Query.find(db, 'assets', { term: { 'slug.keyword': collection.slug } }, { limit: 10000 })
          .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
            body: {
              meta: { took, timedOut, total: total.value },
              results: hits.map(toResult).map(prop('value'))
            }
          }))
          .then(({ body }) => Stats.collection(collection.count, body.results).then(ranks => ({ assets: body.results, ranks })))
          .then((body) => body.assets.map((asset: any) => ({ ...asset, ...body.ranks.find(x => x.id === asset.tokenId) })))
          .then(tap((body) => load(body as any, 'assets', true)))
          /** @TODO if there are assets without traits, dont mark as ranked - but only if asset is unrevealed */
          .then(() => Query.update(db, 'collections', collection.slug, { ranked: true }, true).catch((e) => console.log(`[err update collection]: ${collection.slug} ${e}`)))
      }
    })
}

main()