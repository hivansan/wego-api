import { curry } from 'ramda';
import * as ElasticSearch from '@elastic/elasticsearch';

export const find = curry((
  db: ElasticSearch.Client,
  index: string,
  query: any,
  { limit, offset }: { limit?: number, offset?: number } = {}
): Promise<any> => (
  db.search({ index: index, from: offset || 0, size: limit, body: { query } })
));

export const findOne = curry((db: ElasticSearch.Client, index: string, query: any) => (
  find(db, index, query, { limit: 1 }).then(({ body: { hits: { hits: toMatch } } }) => (
    !toMatch.length ? null : toMatch[0]
  ))
))

