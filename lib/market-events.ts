import * as AssetLoader from '../lib/asset-loader';
import { Readable } from 'stream';
import util from 'util';
import { OpenSeaEvent } from '../models/remote';
import { DecodeError } from '@ailabs/ts-utils/dist/decoder';
import { eventTypes } from '../scraper/event.utils';
import { cleanEntries, load, openseaAssetMapper } from '../scraper/scraper.utils';
import moment from 'moment';
import { filter, flatten, forEach, map, objOf, path, pick, pipe, prop, tap, uniq, uniqBy } from 'ramda';
import * as Query from './query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';


export type Config = {
  /**
   * How many seconds of history to load
   */
  history: number;

  /**
   * Interval (in seconds) to check for new events
   */
  interval: number;

  /**
   * time window (in seconds) to perform each call
   */
  timeWidow: number;

  autoStart: boolean;
}

export type MarketEvent = {
  type: OpenSeaEvent['event_type'];
  time: Date;
  asset: {
    id: number;
    tokenId: string;
    numSales: number;
    name: string | null;
  },
  collection: {
    name: string;
    slug: string;
  };
  auctionType: OpenSeaEvent['auction_type'];
}

export class MarketEvents {

  public stream: Readable;

  protected clock: NodeJS.Timer | null = null;

  protected lastTimestamp: number = 0;

  constructor(public config: Config) {
    this.stream = new Readable({ objectMode: true, read() { } });

    if (config.history > 0) {
      this.load({ limit: 300, after: moment().unix() - config.history - config.timeWidow, before: moment().unix() - config.history });
    }

    if (config.autoStart) {
      this.start();
    }
  }

  public start() {
    if (this.clock) {
      return;
    }
    this.clock = setInterval(() => {
      console.log('[market events lastTimestamp]', this.lastTimestamp);
      if (!this.lastTimestamp) {
        return;
      }
      this.load({ limit: 300, after: this.lastTimestamp, before: this.lastTimestamp + this.config.timeWidow });
    }, this.config.interval * 1000);
  }

  public stop() {
    if (this.clock) {
      clearTimeout(this.clock);
      this.clock = null;
    }
  }

  static fromRaw(event: OpenSeaEvent): MarketEvent {
    const handler = eventTypes.getHandler(event.event_type);
    return {
      type: event.event_type,
      time: event.created_date,
      /** @TODO maybe move traitsFlat to set it null somewhere else less hacky */
      asset: handler(event, cleanEntries({ ...openseaAssetMapper(event.asset), traitsFlat: null })),
      collection: {
        name: event.asset.collection.name,
        slug: event.asset.collection.slug
      },
      auctionType: event.auction_type,
    }
  }

  private load(args: Partial<{ limit: number, before: number, after: number }>) {
    AssetLoader
      .events(args)
      .then(events => events.map(MarketEvents.fromRaw))
      // .then(tap(e => console.log('e -----------', e.length)))
      .then(tap(events => {
        load(
          uniqBy(e => `${e.type}${e.asset.tokenId}${e.collection.slug}`, events).map(e => e.asset),
          'assets',
          'upsert'
        )
      }))
      .then(tap(
        pipe<any, any, any, any, any, any>(
          filter(({ type }) => type === 'created'),
          map(prop('asset')),
          map(pick(['tokenId', 'contractAddress', 'slug', 'currentPriceUSD', 'currentPrice'])),
          uniqBy(({ tokenId, contractAddress }) => `${contractAddress}:${tokenId}`),
          async (eventAssets) => {
            if (!eventAssets?.length) return;
            const ids = eventAssets.map(({ tokenId, contractAddress }) => `${contractAddress}:${tokenId}`)

            // [update traits] - pull db assets for given ids comming from market events. pair that with the price and filter the ones with traits.
            const assets = await Query.find(db, 'assets', { terms: { _id: ids } }, { limit: ids.length, source: ['traits', 'deleted', '_id', 'tokenId', 'slug', 'contractAddress'] })
              .then(
                ({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) => hits.map(toResult)
                  .map((r: any) => r.value)
                  .filter(a => a.traits?.length && !a.deleted)
                  .map(a => ({
                    ...a,
                    ...(eventAssets.find(({ tokenId, contractAddress }) => `${contractAddress}${tokenId}` === `${a.contractAddress}${a.tokenId}`) || {})
                  }))
              )

            // [update traits] - filter assets in which price breaks floor or top. and get its traits
            const traitsToUpdate = pipe<any, any, any, any, any, any>(
              filter((asset: any) =>
                asset.traits.filter((t: { floor_price: number; }) => !t.floor_price || t.floor_price > asset.currentPrice).length ||
                asset.traits.filter((t: { top_price: number; }) => !t.top_price || t.top_price < asset.currentPrice).length
              ),
              map((asset: any) => ({
                traits: asset.traits.map(t => ({
                  ...t,
                  slug: asset.slug,
                  floor_price: t.floor_price > asset.currentPrice ? asset.currentPrice : t.floor_price,
                  top_price: t.top_price < asset.currentPrice ? asset.currentPrice : t.top_price,
                })),
              })),
              map((a: any) => a.traits),
              flatten,
              uniqBy(({ trait_type, value }: any) => `${trait_type}:${value}`),
            )(assets);

            // console.log('traitsToUpdate', JSON.stringify(traitsToUpdate, null, 2));
            load(traitsToUpdate, 'traits', 'upsert')

          }
        )
      ))
      .then(forEach(this.push.bind(this)))
      .catch(e => {
        console.error(
          'Failed to load market events',
          e instanceof DecodeError ? e.toString() : util.inspect(e)
        )
      });
  }

  private push(e: MarketEvent) {
    this.lastTimestamp = Math.max(this.lastTimestamp, moment(e.time).unix());
    this.stream.push(e);
  }


}
