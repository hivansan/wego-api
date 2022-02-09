import { curry, equals, groupBy, identity, last, map, mergeDeepRight, pipe, prop, uniq } from 'ramda';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Readable } from 'stream';
import { parser } from 'stream-json';

export type Options = {
  filter?: { [key: string]: any },
  limit?: number,
  offset?: number,
  sort?: { [key: string]: { order: 'asc' | 'desc', unmapped_type?: string, missing?: string } }[] | string[]
  asStream?: boolean;
  source?: string[]
};

export const stream = ({ body }: { body: Readable }) => body.setEncoding('utf8').pipe(parser());

export const find = curry((
  db: ElasticSearch.Client,
  index: string,
  query: any,
  { limit, offset, sort, asStream, source }: Options
): Promise<any> => {

  console.log('query:', JSON.stringify(query, null, 2));
  console.log(`Query Opts: limit: ${limit} offset: ${offset} sort: ${JSON.stringify(sort, null, 2)} asStream: ${asStream} source: ${source}`);

  return db.search({
    index: index ? index : ['assets', 'collections'],
    from: offset || 0,
    size: limit,
    // sort: sort || ([] as any[]),
    body: {
      ...(query && Object.keys(query).length ? { query } : {}),
      sort,
      _source: source
    },
  }, { asStream })
});

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
  { filter, ...opts }: Options
) => {
  // console.log(filter);

  const queryObj = mergeDeepRight(!query ? {} : { multi_match: { query, fuzziness: 6, fields } }, filter || {});
  const q = {
    bool: {
      must_not: [{
        match: { deleted: true }
      }]
    }
  };
  if (Object.keys(queryObj).length) q.bool['must'] = queryObj;

  return find(db, index, q, opts);

});


/**
 * Special search for assets by collection slug and token id
 */
 export const searchBySlugToken = curry((
  db: ElasticSearch.Client,
  index: string,
  slug: string,
  tokenId: string,
  { filter, ...opts }: Options
) => {

  const q = {
    bool: {
      must_not: [{
        match: { deleted: true }
      }],
      must: [
        {match: {slug}},
        {match: {'tokenId.keyword': tokenId }}
      ],
      filter
    }
  };


  return find(db, index, q, opts);

});

// Example:
// const actualQuery = mergeDeepRight(search(['fields'], 'Fluffy'), byTraits('cats-collection', { Fur: 'Red' }));
export const byTraits = curry((slug: string, traits?: { [key: string]: string | number | (string | number)[] }) => ({
  bool: {
    must: [
      slug ? { term: { 'slug.keyword': slug } } : null,
      ...(Object.entries(traits || {}).map(([type, value]) => {
        return Array.isArray(value)
          ? {
            bool: {
              must: [
                { match: { 'traits.trait_type.keyword': type } }
              ],
              should: value.map(val => ({ match: { 'traits.value.keyword': val } })),
              minimum_should_match: 1
            }
          } : {
            bool: {
              must: [
                { match: { 'traits.trait_type.keyword': type } },
                { match: { 'traits.value.keyword': value } }
              ]
            }
          }
      }))
    ]
  }
}));

/**
 * Insert a single doc or an array of docs into the database.
 */
export const create = curry(<Doc>(db: ElasticSearch.Client, index: string, doc: Doc | Doc[]) => (
  Array.isArray(doc)
    ? db.bulk({ refresh: true, body: doc.flatMap(doc => [{ index: { _index: index } }, doc]) })
    : db.index({ refresh: true, index, body: doc, })
));

/**
 * Insert a single doc or an array of docs into the database.
 */
export const createWithIndex = curry(<Doc>(db: ElasticSearch.Client, index: string, doc: Doc, id: string) => (
  db.index({ refresh: true, index, body: doc, id })
));

/**
 * Update a single document by specifying an ID, or multiple documents by specifying a query. The
 * update (`doc`) is a partial document.
 */
export const update = curry(<Doc>(
  db: ElasticSearch.Client,
  index: string,
  id: string, // | { [key: string]: any },
  doc: Doc,
  docAsUpsert: boolean,
) => (
  db.update({ refresh: true, index, id, body: { doc, ...(docAsUpsert ? { doc_as_upsert: true } : {}) } })
));

export const updateByQuery = curry(<Doc>(
  db: ElasticSearch.Client,
  index: string,
  query: object,
  script: object,
  refresh: boolean,
) => (
  db.updateByQuery({ refresh, index, body: { query, script } })
));

export type CountOptions = {
  q?: string,
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all',
  min_score?: number,
};

export const count = curry((
  db: ElasticSearch.Client,
  index: string,
  query: { [key: string]: any },
  opts: CountOptions
): Promise<{ count: number }> => (
  db.count({ index, body: { query }, ...opts }).then(prop('body')) as Promise<{ count: number }>
));

export const deleteByQuery = (db: ElasticSearch.Client, index: string, query: any) =>
  db.deleteByQuery({ index, body: { query } })