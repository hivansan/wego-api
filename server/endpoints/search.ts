import { clamp, pipe } from 'ramda';
import { toResult } from './util';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import { nullable, object, parse, string } from '@ailabs/ts-utils/dist/decoder';
import { toInt } from '../../models/util';
import Result from '@ailabs/ts-utils/dist/result';
import { respond } from '../util';
import * as Query from '../../lib/query';

/**
 * The list of fields within the asset data structure to search. The `^n` notation defines
 * the relative weight of each field withih the search. Here, `name` is given 3x importance, and
 * trait keys & values are given 4x importance, while collection description is given no weighting.
 *
 * This relates to how results are scored in search rankings, not necessarily whether results
 * show up in the search.
 */
const searchFields = [
  'name^3',
  'traits.trait_type^4',
  'traits.value^4',
  'description^2',
  'collection.description'
];

const searchQuery = object('Search', {
  q: nullable(string),
  page: nullable(toInt, 1),
  /**
   * Default to 10 results, limit max result size to 50.
   */
  limit: nullable(pipe(string, toInt, Result.map(clamp(1, 50))), 10)
});

const queryError = Promise.resolve({ status: 400, body: { msg: 'Bad query' } });

export default ({ db, app }: { app: Express, db: ElasticSearch.Client }) => {

  app.get('/api/search', respond<any>(req => (
    searchQuery(req.query).map(({ q, page, limit }) => {
      const query = !q ? {} : {
        multi_match: { query: q, fuzziness: 6, fields: searchFields }
      };
      return Query.find(db, 'assets', query, { limit, offset: limit * (page - 1) })
        .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => ({
          body: {
            meta: { q, took, timedOut, total: total.value },
            results: hits.map(toResult)
          }
        })).catch(e => {
          console.error('[Bad query]', e);
          return queryError;
        });
    }).defaultTo(queryError)
  )));

};

