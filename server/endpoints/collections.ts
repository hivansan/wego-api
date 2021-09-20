import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import axios from 'axios';
import { object, string } from '@ailabs/ts-utils/dist/decoder';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */
const params = {
  getAsset: object('CollectionParams', {
    contractAddress: string,
    tokenId: toInt
  })
};

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  app.get('/api/assets/:contractAddress/:tokenId', respond<any>(req => {

    return params.getAsset(req.params).map(({ contractAddress, tokenId }) => (
      AssetLoader.fromCollection(contractAddress, tokenId)
        .then(body => ({ body }))
        .catch(e => {
          console.error('[From Collection]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  }));
};