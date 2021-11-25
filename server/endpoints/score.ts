import { any, curry, find, map, mergeRight, nth, objOf, path, pick, pipe, prop, propEq, tap, ifElse } from 'ramda';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import { object, string } from '@ailabs/ts-utils/dist/decoder';
import { match } from '../../models/util';
import { debugStr, error, handleError, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Stats from '../../lib/stats';
import * as Asset from '../../models/asset';

import * as Query from '../../lib/query';
import { toResult } from './util';
import { countInDb } from '../../scraper/scraper.assets';
import { load } from '../../scraper/scraper.utils';
import * as Rank from '../../scraper/rank';

const params = {
  getAsset: object('AssetParams', {
    contractAddress: match(/0x[a-fA-F0-9]{40}/), // string,// match(/0x[a-fA-F0-9]{40}/),
    tokenId: string
  })
}

const traitReducer = (acc: Asset.Stats & { traits: any[] }, t: { traitStat: number }) => ({
  statisticalRarity: acc.statisticalRarity * t.traitStat,
  singleTraitRarity: Math.min(acc.singleTraitRarity, t.traitStat),
  avgTraitRarity: acc.avgTraitRarity + t.traitStat,
  rarityScore: acc.rarityScore + 1 / t.traitStat,
});

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  app.get(
    '/api/asset/:contractAddress/:tokenId/score',
    respond((req) => params.getAsset(req.params).map(({ contractAddress, tokenId }) => {
      return AssetLoader.getAsset(db, contractAddress.toLowerCase(), tokenId)
        .then((body) => (body === null ? Promise.reject(error(404, 'Asset not found')) : body))
        .then(({ body }) =>
          AssetLoader.getCollection(db, body.slug, true)
            // Query.findOne(db, 'collections', { term: { _id: body.slug } })
            .then((body) => body === null ? Promise.reject(error(404, 'Collection not found')) : ({ collection: body.body }))
            .then(({ collection }) =>
              countInDb([collection]).then((counts: any[]) => {
                // console.log('counts[0]', counts[0]);
                return { collection, ...counts[0] }
              })
            )
            // .then(tap((x) => console.log('x ---------', x)) as any)
            .then(({ collection }) => {
              console.log('[score collection]', collection);
              console.log('[score body]', body);

              if (body.statisticalRarityRank && body.traits?.length && !Stats.isUnrevealed(body)) { return { body: { ...body, collection } }; }
              if (body.unrevealed || Stats.isUnrevealed(body)) return Promise.reject({ status: 202, message: 'Asset has not being revealed.' });

              return countInDb([collection])
                .then(nth(0))
                .then(
                  ifElse(
                    ({ shouldScrape }) => shouldScrape,
                    (collection) => {
                      // console.log('collection on true', collection);
                      Query.update(db, 'collections', collection.slug, { requestedScore: true }, true);
                      return Promise.reject({ status: 202, message: 'Collection is being loaded.' })
                    },
                    () => Promise.resolve(null)
                  )
                )
                .then(() => Query.find(db, 'assets', { term: { 'slug.keyword': body.slug } }, { limit: 13000 }))
                .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
                  body: {
                    meta: { took, timedOut, total: total.value },
                    results: hits.map(toResult).map(prop('value'))
                  }
                }))
                .then(({ body }: any) => Stats.collection(body.collection?.stats?.count, body.results, collection?.traits)
                  .then(ranks => ({ assets: body.results, ranks }))
                )
                .then((body: { assets: any[]; ranks: any[]; }) =>
                  body.assets.map((asset: Asset.Asset) => ({
                    ...asset,
                    ...body.ranks.find(x => x.id === asset.tokenId),
                    unrevealed: Stats.isUnrevealed(asset),
                  }))
                )
                .then(tap((body) => load(body as any, 'assets', true)))
                // .then(tap(x => { console.log(' collection ', collection) }))
                .then(tap((assets) => Rank.updateCollectionWithRevealedStats(assets, collection.slug)))
                .then(find(propEq('id', tokenId)))
                .then((body: any) => ({ body: { ...body, collection } }))
            })
        ).catch(handleError('[/score error]'))
    })
      .defaultTo(error(400, 'Bad request'))
    )
  );
};
