import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { nullable, object, string, Decoded, boolean, inList } from '@ailabs/ts-utils/dist/decoder';
import Result from '@ailabs/ts-utils/dist/result';

import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { toInt } from '../../models/util';
import { clamp, match, pipe } from 'ramda';

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
    slug: nullable(string, undefined),
    limit: nullable(pipe(toInt, Result.map(clamp(1, 300))), 10),
    offset: nullable(pipe(toInt, Result.map(clamp(0, 10000))), 0),
  }),
}

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {

  app.post('/api/favorite/toggle', passport.authenticate('jwt', { session: false }), respond(req =>
    params.toggle(req.query).map(({ slug, contractAddress, tokenId, value }) =>
      AssetLoader.toggleFavorite({ db, address: (req.user as any).publicAddress, slug, tokenId, value, contractAddress })
    ).defaultTo(error(400, 'Bad request'))
  ));

  app.get('/api/favorites', respond(req =>
    params.getFavorites(req.query).map(({ index, slug, limit, offset }) =>
      req.headers.authorization?.match(/^0x[a-f0-9]{40}$/g)
        ? AssetLoader.favorites(db, index, { limit, offset }, req.headers.authorization, slug)
        : error(401, 'unauthorized')
    ).defaultTo(error(400, 'Bad request'))
  ));

};

export const meta = {
  assets: '/api/favorites'
};