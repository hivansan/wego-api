import { any, curry, find, map, mergeRight, objOf, pick, pipe, prop, propEq, tap } from 'ramda';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import { object, string } from '@ailabs/ts-utils/dist/decoder';
import { match } from '../../models/util';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Stats from '../../lib/stats';

import * as Query from '../../lib/query';
import { toResult } from './util';

type Stats = {
  statisticalRarity: number;
  singleTraitRarity: number;
  avgTraitRarity: number;
  rarityScore: number;
};

type Trait = {
  trait_type: string;
  value: string | number;
  trait_count: number;
}

type TraitStat = { traitStat: number, traitScore: number };

const params = {
  getAsset: object('AssetParams', {
    contractAddress: match(/0x[a-fA-F0-9]{40}/), // string,// match(/0x[a-fA-F0-9]{40}/),
    tokenId: string
  })
}


const addProps = <T extends object, U extends object>(fn: (obj: T) => U) => (obj: T) => mergeRight(obj, fn(obj));

const mapTraits = (total: number) => pipe<Trait & {}, Trait, Trait>(
  pick(['trait_type', 'value', 'trait_count']),
  addProps<Trait, TraitStat>(({ trait_count }) => ({
    traitStat: trait_count / total,
    traitScore: 1 / (trait_count / total),
  }))
);

const traitReducer = (acc: Stats & { traits: any[] }, t: { traitStat: number }) => ({
  statisticalRarity: acc.statisticalRarity * t.traitStat,
  singleTraitRarity: Math.min(acc.singleTraitRarity, t.traitStat),
  avgTraitRarity: acc.avgTraitRarity + t.traitStat,
  rarityScore: acc.rarityScore + 1 / t.traitStat,
});

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  app.get(
    '/api/asset/:contractAddress/:tokenId/score',
    respond((req) => params.getAsset(req.params).map(({ contractAddress, tokenId }) => {
      
      return Query.findOne(db, 'assets', { term: { _id: `${contractAddress.toLowerCase()}:${tokenId}` } })
        .then((body) => (body === null ? error(404, 'Not found') : ({ body: body._source } as any)))
        .then(({ body }) => {
          const count = body?.collection?.stats?.count || null;
          const mapped = body?.traits?.map(mapTraits(count)) || [];
          return Query.find(db, 'assets', { match: { slug: body.slug } }, { limit: 10000 })
            .then(
              ({body: { took, timed_out: timedOut, hits: { total, hits } } }) =>
              ({ body: { meta: { took, timedOut, total: total.value }, results: hits.map(toResult).map((r) => r.value), }, })
            )
            .then(({ body: assets }) => {
              return Stats.collection({ count: body.collection?.stats?.count } as any, assets.results)
                .then(find(propEq('id', tokenId)))
                .then((stats) => ({
                  body: mergeRight(body, {
                    count,
                    traits: mapped,
                    ...mapped.reduce(traitReducer, {
                      statisticalRarity: 1,
                      singleTraitRarity: 1,
                      avgTraitRarity: 0,
                      rarityScore: 0,
                      traits: [],
                    }),
                    ...pick(['statisticalRarityRank', 'singleTraitRarityRank', 'avgTraitRarityRank', 'srarityScoreRank'], stats || {}),
                  }),
                }));
            })
          })
        .catch((e) => {
          console.error('[/score error]', e);
          return error(503, 'Service error');
        })
    })
      .defaultTo(error(400, 'Bad request'))
    )
  );

};
