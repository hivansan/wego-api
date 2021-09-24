import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { object, string } from '@ailabs/ts-utils/dist/decoder';
import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */
const params = {
  getAsset: object('AssetParams', {
    slug: string,
    tokenId: string
  })
};

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  app.get('/api/assets/:slug/:tokenId', respond(req => {

    return params.getAsset(req.params).map(({ slug, tokenId }) => (
      AssetLoader.fromDb(db, slug, tokenId)
        /**
         * @TODO Call AssetLoader.fromRemote() if it is null.
         */
        .then(body => ({ body }))
        .catch(e => {
          console.error('[Get Asset]', e);
          return error(503, 'Service error');
        })
    )).defaultTo(error(400, 'Bad request'))
  }));
};
