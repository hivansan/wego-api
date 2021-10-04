import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import { object, string } from '@ailabs/ts-utils/dist/decoder';
import { match } from '../../models/util';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';

const params = {
  getAsset: object('AssetParams', {
    contractAddress: match(/0x[a-fA-F0-9]{40}/), // string,// match(/0x[a-fA-F0-9]{40}/),
    tokenId: string
  })
}

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  app.get('/api/asset/:contractAddress/:tokenId/score', respond((req) =>
    params.getAsset(req.params).map(({ contractAddress, tokenId }) =>
      AssetLoader.assetFromRemote(contractAddress, tokenId)
        .then((body) => (body === null ? error(404, 'Not found') : (body as any)))
        .then((body) => ({ traits: body.traits, count: body.collection.stats.count }))
        .then(({ traits, count }) =>
          traits.map((t) => ({
            trait_type: t.trait_type,
            value: t.value,
            traitStat: t.trait_count / count,
            traitScore: 1 / (t.trait_count / count),
            trait_count: t.trait_count,
          }))
        )
        .then((body) =>
          body.reduce(
            (acc: { statisticalRarity: number; singleTraitRarity: number; avgTraitRarity: any; rarityScore: number }, t: { traitStat: number }) => ({
              statisticalRarity: acc.statisticalRarity * t.traitStat,
              singleTraitRarity: Math.min(acc.singleTraitRarity, t.traitStat),
              avgTraitRarity: acc.avgTraitRarity + t.traitStat,
              rarityScore: acc.rarityScore + 1 / t.traitStat,
              traits: body,
            }),
            { statisticalRarity: 1, singleTraitRarity: 1, avgTraitRarity: 0, rarityScore: 0, traits: [] }
          )
        )
        .then((body) => {
          console.log(body);
          return body;
        })
        .then((body) => ({ body }))
        .catch((e) => {
          console.error('[Get Asset]', e);
          return error(503, 'Service error');
        })
    )
    .defaultTo(error(400, 'Bad request')))
  );

};
