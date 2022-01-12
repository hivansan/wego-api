import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { array, nullable, object, string, inList, oneOf, dict, parse, number, Decoded } from '@ailabs/ts-utils/dist/decoder';
import Result from '@ailabs/ts-utils/dist/result';

import { error, respond } from '../util';
import * as AssetLoader from '../../lib/asset-loader';
import { match, toInt } from '../../models/util';
import { clamp, pipe, always, identity, tap } from 'ramda';
import * as Query from '../../lib/query';
import { toResult } from './util';
import { Asset } from '../../models/asset';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */

const range = object('Range', { lte: number, gte: number });

const params = {

  getAsset: object('AssetParams', {
    contractAddress: string,
    tokenId: string,
  }),

  getAssets: object('AssetsParams', {
    slug: nullable(string, undefined),
    limit: nullable(pipe(toInt, Result.map(clamp(1, 20))), 10),
    offset: nullable(pipe(toInt, Result.map(clamp(0, 10000))), 0),
    priceRange: nullable<Decoded<typeof range>>(pipe(
      string,
      parse(pipe<any, any, any, any, any>(
        Result.attempt(JSON.parse),
        parse(range),
        /** These two are sort of a lame hack to handle failures gracefully */
        Result.defaultTo({}),
        Result.ok
      ))
    ), {} as any),
    rankRange: nullable<Decoded<typeof range>>(pipe(
      string,
      parse(pipe<any, any, any, any, any>(
        Result.attempt(JSON.parse),
        parse(range),
        /** These two are sort of a lame hack to handle failures gracefully */
        Result.defaultTo({}),
        Result.ok
      ))
    ), {} as any),
    sortBy: pipe(
      nullable(inList([
        // 'tokenId',
        // 'sale_date',
        // 'sale_price',
        // 'current_escrow_price',
        'numSales',
        'rarityScoreRank',
        'rarityScore',
        'traitsCount',
        'currentPrice',
        'currentPriceUSD',
        'lastSalePrice',
        'lastSalePriceUSD',
      ] as const), null),
      Result.mapError(always(null))
    ),
    sortDirection: nullable(inList(['asc', 'desc'] as const), 'desc'),
    q: nullable(string, null),
    traits: nullable<{ [key: string]: string | number | (string | number)[] }>(
      pipe(
        string,
        parse(pipe<any, any, any, any, any>(
          Result.attempt(JSON.parse),
          parse(dict(oneOf<string | number | (string | number)[]>([
            string,
            number,
            array(string),
            array(number)
          ]))),
          /** These two are sort of a lame hack to handle failures gracefully */
          Result.defaultTo({}),
          Result.ok
        ))
      ), {}),
  }),
};

export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  /**
   * this should always look first directly into Opensea and upsert it to our db.
   */
  app.get('/api/asset/:contractAddress/:tokenId', respond(req =>
    params.getAsset(req.params).map(({ contractAddress, tokenId }) =>
      AssetLoader.getAsset(db, contractAddress, tokenId).then(body => body)
        .then(body => body === null ? error(404, 'Not found') : body as any)
        .catch(e => {
          console.error('[get asset]', e);
          return error(503, 'Service error');
        })
    ).defaultTo(error(400, 'Bad request'))
  ));

  app.get('/api/assets', respond(req =>
    params
      .getAssets(req.query)
      .map(({ slug, limit, offset, sortBy, sortDirection, q, traits, priceRange, rankRange }) => {
        return AssetLoader.fromDb(db, { offset, limit, sort: sortBy ? [{ [sortBy]: { order: sortDirection, unmapped_type: 'long' } }] : [] }, slug, undefined, traits, priceRange, rankRange as any)
          .then((body) => (body === null ? error(404, 'Not found') : (body as any)))
          .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) => ({
            body: {
              meta: { took, timedOut, total: total.value },
              results: hits.map(toResult).map((r: any) => r.value)
              // .map((a: any) => ({
              //   currentPrice: a.currentPrice,
              //   currentPriceUSD: a.currentPriceUSD,
              //   rarityScore: a.rarityScore,
              //   rarityScoreRank: a.rarityScoreRank,
              //   tokenId: a.tokenId,
              //   lastSalePrice: a.lastSalePrice,
              //   lastSalePriceUSD: a.lastSalePriceUSD,
              //   traitsCount: a.traitsCount,
              // })),
            },
          }))
          .catch((e) => {
            console.error('[Get Assets]', e);
            return error(503, e.message + ': ' + JSON.stringify(e.meta));
          });
      })
      .fold((err) => error(400, 'Bad request', { error: err.toString().replace('Decode Error: ', '') }), identity)
  ));
};

export const meta = {
  assets: '/api/assets'
};