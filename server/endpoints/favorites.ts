import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { array, nullable, object, string, inList, oneOf, dict, parse, number, Decoded, boolean } from '@ailabs/ts-utils/dist/decoder';
import Result from '@ailabs/ts-utils/dist/result';

import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';
import { clamp, pipe, always, identity, tap } from 'ramda';

import { toResult } from './util';
import passport from 'passport';

const params = {
  getAsset: object('AssetParams', {
    slug: string,
    tokenId: nullable(string, undefined),
  }),
};

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  /**
   * dummy endpoint to check auth and to initialize favorites file
   */
  app.post('/api/favorite/dummy', passport.authenticate('jwt', { session: false }), respond(req =>
    params.getAsset(req.query).map(({ slug, tokenId }) => {
      console.log('[req.user]', req.user);

      return error(205, 'holu')

    }).defaultTo(error(400, 'Bad request'))
  ));


};

export const meta = {
  assets: '/api/favorites'
};