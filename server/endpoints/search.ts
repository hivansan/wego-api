import { clamp, pipe } from 'ramda';
import { isExact, toResult } from './util';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import { inList, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
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
  'name^6',
  'tokenId^6',
  // 'traits.trait_type^3',
  // 'traits.value^3',
  'description^2',
  'collection.description',
  'contractAddresses',
  'contractAddress'
];

const searchQuery = object('Search', {
  q: nullable(string, ''),
  page: nullable(toInt, 1),
  tab: nullable(inList(['collections', 'assets']), 'collections,assets'),
  /**
   * Default to 10 results, limit max result size to 50.
   */
  limit: nullable(pipe(toInt, Result.map(clamp(1, 50))), 10)
});

const queryError = Promise.resolve({ status: 400, body: { msg: 'Bad query' } });

export default ({ db, app }: { app: Express, db: ElasticSearch.Client }) => {

  const exactMatchFields = searchFields.map(s => s.replace(/\^\d+/, '').split('.'));

  app.get('/api/search', respond(req => (
    searchQuery(req.query).map(({ q, page, limit, tab: index }) =>
      Query.search(db, index, searchFields, q, { limit, offset: Math.max(limit * (page - 1), 0), sort: [{ 'stats.featuredCollection': { order: 'desc' } }] },)
        .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
          body: {
            meta: { q, took, timedOut, total: total.value },
            results: hits.map(pipe(toResult, isExact(exactMatchFields, (q || '').toLowerCase())))
          }
        }))
        .catch((e: unknown) => {
          console.error('[Bad query]', e);
          return queryError;
        })
    ).defaultTo(queryError)
  )));

};

export const meta = {
  search: '/api/search'
}
