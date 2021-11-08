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
import * as AssetLoader from '../lib/asset-loader';

const slug: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const limitCollections: number = Number(process.argv.find((s) => s.startsWith('--limitCollections='))?.replace('--limitCollections=', '') || 20);

const collectionData = (slug?: string) =>
  Query.find(db, 'collections',
    slug
      ? { term: { 'slug.keyword': slug } }
      : {
        "bool": {
          "must_not": {
            "exists": {
              "field": "ranked"
            }
          },
          "must": {
            "exists": {
              "field": "slug"
            }
          }
        }
      },
    {
      limit: limitCollections,
      sort: [
        {
          "updatedAt": {
            "order": "desc",
            "missing": "_last"
          }
        }
      ]
    },
  )
    .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
      ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any }) => r.value) } }))

const main = (slug?: string) => {
  collectionData(slug)
    // .then(tap((x: any) => console.log('x ==========', JSON.stringify(x.body.results, null, 3))) as any)
    // .then(tap(x => console.log('x ==========', x)) as any)
    .then(({ body }: any) => body.results.filter((c: { slug: string }) => c.slug?.length))
    .then(countInDb as any)
    .then(filter((c: any) => !c.shouldScrape /* && !c.ranked */) as any)
    // .then(filter((c: any) => c.totalSupply > 0 && (c.totalSupply - c.count) <= 0 /* && !c.ranked */) as any)
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
          // .then(tap((body) => console.log(body)))
          .then(tap((body) => load(body as any, 'assets', true)))
          /** @TODO if there are assets without traits, dont mark as ranked - but only if asset is unrevealed */
          .then(() => Query.update(db, 'collections', collection.slug, { ranked: true }, true).catch((e) => console.log(`[err update collection]: ${collection.slug} ${e}`)))
      }
    })
}

main(slug);