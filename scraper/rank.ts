/**
 * rank and save collections
 */
import * as Query from '../lib/query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import { countInDb } from './scraper.assets';
import { filter, map, pick, prop, tap } from 'ramda';
import * as Stats from '../lib/stats';
import { sleep } from '../server/util';
import { load } from './scraper.utils';
import * as AssetLoader from '../lib/asset-loader';
import { Asset } from '../models/asset';

const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const slug: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const limitCollections: number = Number(process.argv.find((s) => s.startsWith('--limitCollections='))?.replace('--limitCollections=', '') || 20);

const collectionData = (slug?: string) =>
  Query.find(db, 'collections',
    slug
      ? { term: { 'slug.keyword': slug } }
      : {
        "bool": {
          "must_not": {
            "match": {
              // "slug.keyword": "{{collection}}"
              "ranked": true
              // "ranked": true
            }
            // "exists": {
            //   "field": "ranked"
            // }
          },
          "must": [{
            "range": {
              "stats.totalSupply": {
                "lte": 13000,
                // "gt": 10000,
              }
            }
          },
          {
            "exists": {
              "field": "slug"
            }
          }]
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

export const updateCollectionWithRevealedStats = (assets: any, slug: string) => {
  const unrevealed = assets.filter((a: Asset) => Stats.isUnrevealed(a));
  const revealed = assets.filter((a: Asset) => a.traits?.length || a.traits.some(t => t.value !== '???'));
  console.log(`count: ${assets.length}, unrevealed ${unrevealed.length} revealed ${revealed.length}`);
  const ranked: boolean = !!(assets.length - revealed);
  const updateFields = {
    revealedAssets: revealed.length,
    unrevealedAssets: unrevealed.length,
    ranked,
    updatedAt: new Date(),
  }

  return Query.update(db, 'collections', slug, updateFields, true)
    .catch((e) => console.log(`[err update collection]: ${slug} ${e}`));
}

const main = () => {
  collectionData(slug)
    // .then(tap((x: any) => console.log('x ==========', JSON.stringify(x.body.results, null, 3))) as any)
    // .then(tap(x => console.log('x ==========', x)) as any)
    .then(({ body }: any) => body.results.filter((c: { slug: string }) => c.slug?.length))
    .then(countInDb as any)
    // .then(tap(x => console.log('x count in db ----------', x)) as any)
    .then(filter((c: any) => !c.shouldScrape /* && !c.ranked */) as any)
    // .then(filter((c: any) => c.totalSupply > 0 && (c.totalSupply - c.count) <= 0 /* && !c.ranked */) as any)
    .then(map(pick(['slug', 'count']) as any) as any)
    // .then(tap(x => console.log('x filtered ----------', x)) as any)
    .then(async (collections) => {
      // collections.length = 1;
      for (const collection of collections) {
        // console.log('ranking collection.slug', collection.slug);
        Query.find(db, 'assets', { term: { 'slug.keyword': collection.slug } }, { limit: 80000 })
          .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
            body: {
              meta: { took, timedOut, total: total.value },
              results: hits.map(toResult).map(prop('value'))
            }
          }))
          .then(({ body }) => Stats.collection(collection.count, body.results).then(ranks => ({ assets: body.results, ranks })))
          .then((body) =>
            body.assets.map((asset: Asset) => ({
              ...asset,
              ...body.ranks.find(x => x.id === asset.tokenId),
              unrevealed: Stats.isUnrevealed(asset),
            }))
          )
          .then(tap((body) => load(body as any, 'assets', true)))
          /** @TODO if there are assets without traits, dont mark as ranked - but only if asset is unrevealed */
          .then(assets => updateCollectionWithRevealedStats(assets, collection.slug))
          .catch(e => {
            // console.log('e =========', e);
            // Query.update(db, 'collections', collection.slug, { unrevealed: true, updatedAt: new Date() }, true)
            //   .catch((e) => console.log(`[err update collection]: ${collection.slug} ${e}`))
          })

      }
    })
  // .catch(e => console.log('e =========', e))
}

if (exec) eval(`${exec}()`);