import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { inList, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import * as Query from '../../lib/query';

import { toInt } from '../../models/util';
import { clamp, pipe } from 'ramda';
import Result from '@ailabs/ts-utils/dist/result';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */
const params = {
  getCollection: object('CollectionParams', {
    contractAddress: string,
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
    /**
     * @TODO Map results, figure out sort
     */
    Query.find(db, 'collection_stats', {}, { limit, page })

    return { body: {} };
  }));

  app.get('/api/collections/:contractAddress', respond(req => {

    return params.getCollection(req.params).map(({ contractAddress }) => (
      AssetLoader.collection(contractAddress)
        .then(body => body === null ? error(404, 'Not found') : { body } as any)
        .catch(e => {
          console.error('[Collection]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  }));
};