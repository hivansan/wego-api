import { toResult } from './util';
import { clamp, pick, pipe } from 'ramda';

import * as Query from '../../lib/query';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import { nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { match, toInt } from '../../models/util';
import { respond } from '../util';
import Result from '@ailabs/ts-utils/dist/result';

/**
 * List of fields to find similar assets by. Just search by traits for now.
 */
const matchFields = ['traits.trait_type', 'traits.value'];

const matchParams = object('MatchParams', {
  query: object('Query', { limit: nullable(pipe(string, toInt, Result.map(clamp(1, 50))), 10) }),
  params: object('Params', {
    contract: match(/^0x[a-f0-9]{40}$/),
    id: toInt
  })
});

const queryError = Promise.resolve({ status: 404, body: { msg: 'Asset not found' } });

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => (
  app.get('/api/match/:contract/:id', respond<any>(req => (
    matchParams(req).map(({ query: { limit }, params: { id, contract } }) => {
      return Query.findOne(db, 'assets', {
        filter: {
          bool: {
            must: [
              { term: { id } },
              { term: { 'asset_contract.address': contract } }
            ]
          }
        }
      }).then<any, any>(toMatch => (
        Query.find(db, 'assets', {
          more_like_this: {
            fields: matchFields,
            like: [pick(['_id', '_index'], toMatch)]
          }
        }, { limit })
      )).then<any, any>(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => ({
        body: {
          meta: { took, timedOut, total: total.value },
          results: hits.map(toResult)
        }
      })).catch(e => {
        console.error('[Asset Match]', e);
        return queryError;
      });
    }).defaultTo(queryError)
  )))
);