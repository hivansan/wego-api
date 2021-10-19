import { Express } from 'express';
import * as ElasticSearch from '@elastic/elasticsearch';
import { array, nullable, object, string, inList, oneOf, dict, parse, number } from '@ailabs/ts-utils/dist/decoder';
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
const params = {

  getAsset: object('AssetParams', {
    contractAddress: string,
    tokenId: string,
  }),

  getAssets: object('AssetsParams', {
    slug: nullable(string, undefined),
    limit: nullable(pipe(toInt, Result.map(clamp(1, 20))), 10),
    offset: nullable(pipe(toInt, Result.map(clamp(0, 10000))), 0),
    sortBy: pipe(
      nullable(inList(['tokenId', 'sale_date', 'sale_count', 'sale_price', 'current_escrow_price' /* 'rarityScore', */] as const), null),
      Result.mapError(always(null))
    ),
    sortDirection: nullable(inList(['asc', 'desc'] as const), 'desc'),
    q: nullable(string, null),
    traits: nullable<{ [key: string]: string | number | (string | number)[] }>(pipe(
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

  const index = tap((asset: Asset) => (
    Query.createWithIndex(db, 'assets', asset, `${asset.contractAddress}:${asset.tokenId}`)
  ));

  /**
   * this should always look first directly into Opensea and upsert it to our db.
   */
  app.get('/api/asset/:contractAddress/:tokenId', respond(req =>
    params.getAsset(req.params).map(({ contractAddress, tokenId }) => (
      AssetLoader.assetFromRemote(contractAddress, tokenId)
        .then(body => body === null ? error(404, 'Not found') : { body: index(body) } as any)
        .catch(e => {
          console.error('[Get Asset]', e);
          return error(503, 'Service error');
        })
      // AssetLoader.fromDb(db, contractAddress, tokenId, {} /** @TODO traits */)

      /**
       * @TODO Call AssetLoader.assetFromRemote() if it is null.
       */
      //   .then(body => ({ body }))
      //   .catch(e => {
      //     console.error('[Get Asset]', e);
      //     return error(503, 'Service error');
      //   })
    )).defaultTo(error(400, 'Bad request'))
  ));

  /**
   * this should only be used in the collection details for infinite scroll of the assets - not for a search
   */
  app.get('/api/assets', respond(req => {
    return params
      .getAssets(req.query)
      .map(({ slug, limit, offset, sortBy, sortDirection, q, traits }) => (
        Object.keys(traits).length
          ? AssetLoader.fromDb(db, slug, undefined, traits, offset)
            // .then(body => {
            //   console.log(body);
            //   return body;
            // })
            .then((body) => (body === null ? error(404, 'Not found') : (body as any)))
            .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => ({
              body: {
                meta: { took, timedOut, total: total.value },
                results: hits.map(toResult).map(r => r.value)
              }
            }))
            .catch((e) => {
              console.error('[Get Assets]', e);
              return error(503, e.message + ': ' + JSON.stringify(e.meta));
            })
          : AssetLoader.assetsFromRemote(slug, limit, offset, sortBy, sortDirection, q)
            .then((body) => (body === null ? error(404, 'Not found') : ({ body } as any)))
            .then(({ body }) => {
              if (body.length) {
                const docs = body.flatMap((doc: { asset_contract: { address: any; }; token_id: any; }) => [{ index: { _index: 'assets', _type: '_doc', _id: `${doc.asset_contract.address}:${doc.token_id}` } }, doc]);
                db.bulk({ refresh: true, body: docs }); //.then(console.log.bind(console, 'saved'));
              }
              return { body };
            })
            .catch((e) => {
              console.error('[Assets]', e);
              return error(503, 'Service error');
            })
      ))
      .fold(
        err => error(400, 'Bad request', { error: err.toString().replace('Decode Error: ', '') }),
        identity
      )
  }));
};
