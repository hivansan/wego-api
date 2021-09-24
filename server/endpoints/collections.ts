import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { Decoded, inList, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Query from '../../lib/query';

import { toInt } from '../../models/util';
import { clamp, pipe, objOf } from 'ramda';
import Result from '@ailabs/ts-utils/dist/result';

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
    sort: nullable(inList(['volume', 'avgPrice', 'numOwners'] as const), null),
  })
};

type CollectionQuery = Decoded<typeof params.listCollections>;

const searchQuery = object('Search', {
  q: nullable(string),
});

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  /**
   * @TODO I don't think I understood this one
   */
  // app.get('/api/assets/:contractAddress/:tokenId', respond(req => {

  //   return params.getAsset(req.params).map(({ contractAddress, tokenId }) => (
  //     AssetLoader.fromCollection(contractAddress, tokenId)
  //       .then(body => ({ body }))
  //       .catch(e => {
  //         console.error('[From Collection]', e);
  //         return error(503, 'Service error');
  //       })
  //   )).defaultTo(error(400, 'Bad request'))
  // }));

  app.get('/api/collections', respond(req => {
    const { page, limit, sort } = params.listCollections(req.query).defaultTo({ page: 1, limit: 10, sort: null });
    const fromSort = {
      'volume': 'thirtyDayVolume',
      'avgPrice': 'thirtyDayAveragePrice',
      'numOwners': 'numOwners',
    };
    return Query.find(db, 'collection_stats', {}, {
      limit,
      page,
      sort: sort ? [{ [fromSort[sort]]: { order: 'desc' } }] : []
    }).then(objOf('body'))
      .catch((e) => {
        console.error('Badness!', e);
        return error(404, 'Not found');
      })
  }));

  app.get('/api/collections/:slug', respond(req => {

    return params.getCollection(req.params).map(({ slug }) => (
      AssetLoader.collection(slug)
        .then(body => body === null ? error(404, 'Not found') : { body } as any)
        .catch(e => {
          console.error('[Collection]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  }));
};