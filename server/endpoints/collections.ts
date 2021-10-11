import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Decoded, inList, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { toResult } from './util';

import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Query from '../../lib/query';
import { Options } from '../../lib/query';

import { toInt } from '../../models/util';
import { clamp, pipe, objOf, always } from 'ramda';
import Result from '@ailabs/ts-utils/dist/result';

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

type CollectionQuery = Decoded<typeof params.listCollections>;

const searchQuery = object('Search', {
  q: nullable(string),
});

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {


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
      offset: (page - 1) * limit,
      sort: sort ? [{ [ sort ]: { order: sortOrder } }] : []
    })
      .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => ({
        body: {
          meta: { q, took, timedOut, total: total.value },
          results: hits.map(toResult)
        }
      }))
      .catch((e: { meta: { body: { error: any; }; }; }) => {
        console.error('Badness!', e?.meta?.body?.error ? JSON.stringify(e?.meta?.body?.error) : e?.meta?.body?.error);
        return error(404, 'Not found');
      })
  }));

  app.get('/api/collections/:slug', respond(req => {

    return params.getCollection(req.params).map(({ slug }) => (
      AssetLoader.collectionFromRemote(slug)
        .then(body => body === null ? error(404, 'Not found') : { body } as any)
        /**
         * @TODO save to local
         */
        .catch(e => {
          console.error('[Collection]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  }));

  app.get('/api/collections/:slug/traits', respond(req => {
    const { slug } = params.getCollection(req.params).defaultTo({  slug: ''});

    return Query.find(db, 'traits', { match : { slug } }, { limit: 100 })
      .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => ({
        body: {
          meta: { took, timedOut, total: total.value },
          results: hits.map(toResult).map(r => r.value)
        }
      }))
      .catch((e) => {
        console.error('Badness!', e?.meta?.body?.error ? JSON.stringify(e?.meta?.body?.error) : e?.meta?.body?.error);
        return error(404, 'Not found');
      })
  }));
};