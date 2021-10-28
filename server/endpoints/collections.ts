import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Decoded, inList, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { toResult } from './util';

import { error, handleError, respond, ResponseVal } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Query from '../../lib/query';

import { toInt } from '../../models/util';
import { clamp, pipe, objOf, always, path, uniq, flatten, tap, equals, last, prop } from 'ramda';
import Result from '@ailabs/ts-utils/dist/result';

import { COLLECTION_SORTS } from '../../lib/constants';

import * as Stream from '@trivago/samsa';
import * as StreamOps from 'stream-json/filters/Pick';
import { streamValues } from 'stream-json/streamers/StreamValues';
import { Readable } from 'stream';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */
const params = {
  getCollection: object('CollectionParams', {
    slug: string,
  }),
  listCollections: object('CollectionsQuery', {
    page: nullable(toInt, 1),
    /**
     * Default to 10 results, limit max result size to 50.
     */
    limit: nullable(pipe(toInt, Result.map(clamp(1, 50))), 10),
    sort: pipe(
      nullable(inList(COLLECTION_SORTS), null),
      Result.mapError(always(null))
    ),
    sortOrder: nullable(inList(['asc', 'desc'] as const), 'desc'),
    q: nullable(string, null)
  })
};

type CollectionQuery = Decoded<typeof params.listCollections>;

const searchQuery = object('Search', {
  q: nullable(string),
});

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  const index = tap((collection: any) => (
    Query.createWithIndex(db, 'collections', collection, `${collection.slug}`)
  ));

  app.get('/api/collections', respond(req => {
    const searchFields = [
      'name^4',
      'contractAddress^3',
      'descriptionˆ2',
    ];
    const { page, limit, sort, q, sortOrder } = params.listCollections(req.query)
      .defaultTo({
        page: 1,
        limit: 10,
        sort: null,
        q: null,
        sortOrder: 'desc',
      });

    console.log(`[/api/collectionsparams] -`, page, limit, sort, q);

    // sort ? [{ [fromSort[sort]]: { order: 'desc' } }] : []
    return Query.search(db, 'collections', searchFields, q || '', {
      limit,
      offset: Math.max((page - 1) * limit, 0),
      sort: sort ? [{ [`stats.${sort}`]: { order: sortOrder } }] : []
    })
      .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
        body: {
          meta: { q, took, timedOut, total: total.value },
          results: hits.map(toResult)
        }
      }))
      .catch((e: { meta: { body: { error: any; }; }; }) => {
        console.error('[/collections] Query failed', e?.meta?.body?.error ? JSON.stringify(e?.meta?.body?.error) : e?.meta?.body?.error);
        return error(404, 'Not found');
      })
  }));

  app.get('/api/collections/:slug', respond(req =>
    params.getCollection(req.params).map(({ slug }) => (
      AssetLoader.getCollection(db, slug)
        .then(body => body === null ? error(404, 'Not found') : body as any)
        .catch(e => {
          console.error('[Collection]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  ));

  app.get('/api/collections/:slug/traits', respond(req => {
    return params.getCollection(req.params).map(({ slug }) => {
      return Promise.all([
        Query.find(db, 'assets', { match: { slug } }, { limit: 10000, asStream: true }).then(Query.stream),
        Query.find(db, 'assets', { match: { slug } }, { limit: 10000, offset: 10000, asStream: true }).then(Query.stream)
      ])
        .then<any>(Stream.merge as any)
        .then((stream: Readable) => stream.pipe(StreamOps.pick({ filter: pipe(last, equals('traits')) }))
          .pipe(streamValues())
          .pipe(Stream.flatMap(pipe(prop<any, any>('value'), Stream.from)))
        ).then(body => ({
          wrap: ['{ "result": [', '] }', ','] as const,
          body
        }) as ResponseVal)
        .catch(handleError(`[/traits error, slug: ${slug}]`));
    }).defaultTo(error(400, 'Bad request'));
  }));

  /**
   * Admin management URLs
   */

  app.post('/api/collections/:slug/hide', respond(req => (
    db.update({
      index: 'collections',
      id: req.params.slug,
      body: {
        doc: { hidden: true }
      }
    }) as any
  )));

  app.post('/api/collections/:slug/unfeature', respond(req => (
    db.update({
      index: 'collections',
      id: req.params.slug,
      body: {
        doc: { stats: { featuredCollection: false } }
      }
    }) as any
  )));

  app.post('/api/collections/:slug/feature', respond(req => (
    db.update({
      index: 'collections',
      id: req.params.slug,
      body: {
        doc: { stats: { featuredCollection: true } }
      }
    }) as any
  )));
};