import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { array, nullable, object, string, inList } from '@ailabs/ts-utils/dist/decoder';
import Result from '@ailabs/ts-utils/dist/result';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';
import { clamp, pipe, objOf, always } from 'ramda';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */
const params = {
  getAsset: object('AssetParams', {
    contractAddress: string,
    tokenId: string,
    /**
     * @TODO (Nate) Figure out mapping structure from querystring to object
     */
    traits: nullable(array(string)),
  }),
  getAssets: object('AssetsParams', {
    slug: string,
    limit: nullable(pipe(toInt, Result.map(clamp(1, 20))), 10),
    offset: nullable(pipe(toInt, Result.map(clamp(1, 10000))), 0),
    sortBy: pipe(
      nullable(inList(['tokenId', 'sale_date', 'sale_count', 'sale_price', 'current_escrow_price' /* 'rarityScore', */] as const), null),
      Result.mapError(always(null))
    ),
    sortDirection: nullable(inList(['asc', 'desc'] as const), 'desc'),
    q: nullable(string, null),
  }),
};

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  /**
   * this should always look first directly into Opensea and upsert it to our db.
   */
  app.get('/api/asset/:contractAddress/:tokenId', respond(req => {

    return params.getAsset(req.params).map(({ contractAddress, tokenId, traits }) => (
      AssetLoader.assetFromRemote(contractAddress, tokenId)
        .then(body => ({ body }))
        
        .catch(e => {
          console.error('[Get Asset]', e);
          return error(503, 'Service error');
        })
      // AssetLoader.fromDb(db, contractAddress, tokenId, {} /** @TODO traits */)

      //   /**
      //    * @TODO Call AssetLoader.assetFromRemote() if it is null.
      //    */
      //   .then(body => ({ body }))
      //   .catch(e => {
      //     console.error('[Get Asset]', e);
      //     return error(503, 'Service error');
      //   })
    )).defaultTo(error(400, 'Bad request'))
  }));
  
  app.get('/api/assets', respond(req => {

    return params.getAssets(req.query).map(({ slug, limit, offset, sortBy, sortDirection, q }) => (
      AssetLoader.assetsFromRemote(slug, limit, offset, sortBy, sortDirection, q)
        .then(body => body === null ? error(404, 'Not found') : { body } as any)
        .catch(e => {
          console.error('[Collection]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  }));
};
