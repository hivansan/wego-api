import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Decoded, inList, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { toResult } from './util';

import { error, handleError, respond, ResponseVal } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Query from '../../lib/query';
import * as Asset from '../../models/asset';

import { toInt } from '../../models/util';
import { clamp, pipe, objOf, always, path, uniq, flatten, tap, equals, last, prop, concat, map, uniqBy, filter } from 'ramda';
import Result from '@ailabs/ts-utils/dist/result';
import * as Stats from '../../lib/stats';

import { COLLECTION_SORTS } from '../../lib/constants';

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

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  app.get('/api/collections', respond(req => {
    const searchFields = [
      'name^4',
      'contractAddresses^3',
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
    const sortBy = sort ? [{ [`stats.${sort}`]: { order: sortOrder } }] : [];
    sortBy.unshift({ [`stats.featuredCollection`]: { order: 'desc' } });

    return Query.search(db, 'collections', searchFields, q || '', {
      limit,
      offset: Math.max((page - 1) * limit, 0),
      sort: sortBy
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

  app.get('/api/collections/:slug/score', respond(req => {
    return params.getCollection(req.params).map(({ slug }) => {
      return Query.find(db, 'assets', { term: { 'slug.keyword': slug } }, { limit: 13000, offset: 0, from: 0 })
        .then(path(['body', 'hits', 'hits']))
        .then(map(pipe(toResult, prop('value'))) as unknown as (v: any) => Asset.Asset[])
        .then(assets => ({
          assets,
          collection: AssetLoader.getCollection(db, slug, true)
            .then((body) => body === null ? Promise.reject(error(404, 'Collection not found')) : ({ collection: body.body }))
        }))
        .then(({ assets }) => Stats.collection(assets.length, assets, {}))
        .then(objOf('body'))
        .catch(handleError(`[/collections/score error, slug: ${slug}]`));
    }).defaultTo(error(400, 'Bad request'));
  }));

  app.get('/api/collections/:slug/traits', respond(req => {
    return params.getCollection(req.params).map(({ slug }) => {
      return Query.find(db, 'assets', { term: { 'slug.keyword': slug } }, { limit: 13000, offset: 0, from: 0 })
        .then(path(['body', 'hits', 'hits']))
        .then(pipe<any, any, any, any, any>(
          filter((a: any) => a._source.traits?.length),
          map((a: any) => a._source.traits),
          flatten,
          uniqBy(({ trait_type, value }: any) => `${trait_type}:${value}`)
        ))
        .then(pipe(objOf('results'), objOf('body')))
        .catch(handleError(`[/traits error, slug: ${slug}]`));
    }).defaultTo(error(400, 'Bad request'));
  }));

  /**
   * Admin management URLs
   */

  app.post('/api/collections/:slug/delete', respond(({ params }) => (
    Promise.all([
      db.delete({ index: 'collections', id: params.slug }) as any,
      db.deleteByQuery({ index: 'assets', body: { query: { match: { 'slug.keyword': params.slug } } } })
    ]) as any
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

export const meta = {
  collections: '/api/collections'
};