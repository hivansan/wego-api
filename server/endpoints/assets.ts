import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { array, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';

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
    traits: nullable(array(string))
  })
};

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  /**
   * this should always look first directly into Opensea and upsert it to our db.
   */
  app.get('/api/asset/:contractAddress/:tokenId', respond(req => {

    return params.getAsset(req.params).map(({ contractAddress, tokenId, traits }) => (
      AssetLoader.fromRemote(contractAddress, tokenId)
        .then(body => ({ body }))
        
        .catch(e => {
          console.error('[Get Asset]', e);
          return error(503, 'Service error');
        })
      // AssetLoader.fromDb(db, contractAddress, tokenId, {} /** @TODO traits */)

      //   /**
      //    * @TODO Call AssetLoader.fromRemote() if it is null.
      //    */
      //   .then(body => ({ body }))
      //   .catch(e => {
      //     console.error('[Get Asset]', e);
      //     return error(503, 'Service error');
      //   })
    )).defaultTo(error(400, 'Bad request'))
  }));
};
