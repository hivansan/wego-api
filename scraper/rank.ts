/**
 * rank and save collections
 */
import * as Query from '../lib/query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import { countInDb } from './scraper.assets';
import { filter, map, pick, prop, tap, complement } from 'ramda';
import * as Stats from '../lib/stats';
import { sleep } from '../server/util';
import { load } from './scraper.utils';
import * as AssetLoader from '../lib/asset-loader';
import { Asset } from '../models/asset';

const execrank: string | undefined = process.argv.find((s) => s.startsWith('--execrank='))?.replace('--execrank=', '');
const slug: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const limitCollections: number = Number(process.argv.find((s) => s.startsWith('--limitCollections='))?.replace('--limitCollections=', '') || 20);

const collectionData = (slug?: string) =>
  Query.find(db, 'collections',
    slug
      ? { term: { 'slug.keyword': slug } }
      : {
        'bool': {
          'must_not': [
            { 'match': { 'ranked': true } },
            // { 'match': { 'unrevealed': true } }
          ],
          'must': [{
            'range': {
              'stats.totalSupply': {
                'lte': 13000,
                // 'gt': 10000,
              }
            }
          },
          {
            'exists': {
              'field': 'slug'
            }
          }]
        }
      },
    {
      limit: limitCollections,
      sort: [
        {
          'lastScrapedAt': {
            'order': 'desc',
            'missing': '_last'
          }
        }
      ]
    },
  )
    .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) =>
      ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r: { value: any }) => r.value) } }))

export const updateCollectionWithRevealedStats = (assets: any, slug: string) => {
  const unrevealed = assets.filter(Stats.isUnrevealed);
  const revealed = assets.filter(complement(Stats.isUnrevealed));
  console.log(`count: ${assets.length}, unrevealed ${unrevealed.length} revealed ${revealed.length}`);
  const ranked: boolean = !!((assets.length - revealed.length) / assets.length < .0025);
  const updateFields = {
    revealedAssets: revealed.length,
    unrevealedAssets: unrevealed.length,
    revealedPercentage: (assets.length - unrevealed.length) / assets.length,
    ranked,
    lastRankedAt: new Date(),
  }

  console.log('[updateFields]', updateFields);

  return Query.update(db, 'collections', slug, updateFields, true)
    .catch((e) => console.log(`[err update collection]: ${slug} ${e}`));
}

const run = () => {
  collectionData(slug)
    // .then(tap((x: any) => console.log('x ==========', JSON.stringify(x.body.results, null, 3))) as any)
    // .then(tap(x => console.log('x ==========', x)) as any)
    .then(({ body }: any) => body.results.filter((c: { slug: string }) => c.slug?.length))
    .then(countInDb as any)
    // .then(tap(x => console.log('x count in db ----------', x)) as any)
    .then(filter((c: any) => !c.shouldScrape /* && !c.ranked */) as any)
    // .then(filter((c: any) => c.totalSupply > 0 && (c.totalSupply - c.count) <= 0 /* && !c.ranked */) as any)
    .then(map(pick(['slug', 'count', 'traits']) as any) as any)
    .then(tap(x => console.log('x filtered ----------', x)) as any)
    .then(async (collections) => {
      // collections.length = 1;
      for (const collection of collections) {
        console.log('ranking collection.slug', collection.slug);
        Query.find(db, 'assets', { term: { 'slug.keyword': collection.slug } }, {
          limit: 13000,
          source: ['tokenId', 'updatedAt', 'traits', 'traitsCount',]
        })
          .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
            body: {
              meta: { took, timedOut, total: total.value },
              results: hits.map(toResult).map(prop('value'))
            }
          }))
          .then(({ body }) => Stats.collection(collection.count, body.results, collection.traits).then(ranks => ({ assets: body.results, ranks })))
          // .then(tap(x => console.log('x ==========', x)) as any)
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
            console.log('[error ranker]', e);
            // Query.update(db, 'collections', collection.slug, { unrevealed: true, updatedAt: new Date() }, true)
            //   .catch((e) => console.log(`[err update collection]: ${collection.slug} ${e}`))
          })

      }
    })
  // .catch(e => console.log('e =========', e))
}

if (execrank) eval(`${execrank}()`);