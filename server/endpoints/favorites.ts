import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { nullable, object, string, Decoded, boolean, inList } from '@ailabs/ts-utils/dist/decoder';
import Result from '@ailabs/ts-utils/dist/result';

import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';
import { match, pipe } from 'ramda';

import { toResult } from './util';
import passport from 'passport';
import { Address, favorite } from '../../models/favorite';

const params = {
  // toggle: favorite,
  toggle: object('AssetParams', {
    slug: string,
    tokenId: nullable(string, undefined),
    contractAddress: nullable(string, undefined),
    value: nullable<Decoded<typeof boolean>>(pipe<any, any>(
      Result.attempt(JSON.parse),
    ), false),
  }),
  getFavorites: object('AssetParams', {
    index: nullable(inList(['assets', 'collections']), 'assets'),
  }),
}

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  app.post('/api/favorite/toggle', passport.authenticate('jwt', { session: false }), respond(req =>
    params.toggle(req.query).map(({ slug, contractAddress, tokenId, value }) =>
      AssetLoader.toggleFavorite({ db, address: (req.user as any).publicAddress, slug, tokenId, value, contractAddress })
    ).defaultTo(error(400, 'Bad request'))
  ));

  app.get('/api/favorites', passport.authenticate('jwt', { session: false }), respond(req =>
    params.getFavorites(req.query).map(({ index }) =>
      AssetLoader.favorites(db, index, (req.user as any).publicAddress)
    ).defaultTo(error(400, 'Bad request'))
  ));

};

export const meta = {
  assets: '/api/favorites'
};