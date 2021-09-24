import { curry } from 'ramda';
import * as ElasticSearch from '@elastic/elasticsearch';

export type Options = {
  limit?: number,
  offset?: number,
  sort?: { [key: string]: { order: 'asc' | 'desc' } }[]
};

export const find = curry((
  db: ElasticSearch.Client,
  index: string,
  query: any,
  { limit, offset, sort }: Options
): Promise<any> => (
  db.search({ index: index, from: offset || 0, size: limit, body: { query }, sort: sort || ([] as any[]) })
));

export const findOne = curry((db: ElasticSearch.Client, index: string, query: any) => (
  find(db, index, query, { limit: 1 }).then(({ body: { hits: { hits: toMatch } } }) => (
    !toMatch.length ? null : toMatch[0]
  ))
));

/**
 * Special-case wrapper for text search queries
 */
export const search = curry((
  db: ElasticSearch.Client,
  index: string,
  fields: string[],
  query: string | null,
  opts: Options
) => (
  find(db, index, !query ? {} : { multi_match: { query, fuzziness: 6, fields } }, opts)
));

/**
 * Insert a single doc or an array of docs into the database.
 */
export const create = curry(<Doc>(db: ElasticSearch.Client, index: string, doc: Doc | Doc[]) => (
  Array.isArray(doc)
    ? db.bulk({ refresh: true, body: doc.flatMap(doc => [{ index: { _index: index } }, doc]) })
    : db.index({ refresh: true, index, body: doc, })
));

/**
 * Update a single document by specifying an ID, or multiple documents by specifying a query. The
 * update (`doc`) is a partial document.
 */
export const update = curry(<Doc>(
  db: ElasticSearch.Client,
  index: string,
  idOrQuery: string | { [key: string]: any },
  doc: Doc
) => (
  typeof idOrQuery === 'string'
    ? db.update({ refresh: true, index, id: idOrQuery, body: { doc } })
    : db.updateByQuery({ refresh: true, index, body: { query: idOrQuery, doc } })
));


// Make exists and upsert functions
