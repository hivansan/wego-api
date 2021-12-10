import * as AssetLoader from '../lib/asset-loader';
import { Readable } from 'stream';
import util from 'util';
import { OpenSeaEvent } from '../models/remote';
import { DecodeError } from '@ailabs/ts-utils/dist/decoder';
import { eventTypes } from '../scraper/event.utils';
import { cleanEntries, load, openseaAssetMapper } from '../scraper/scraper.utils';
import moment from 'moment';
import { forEach, map, path, tap } from 'ramda';

export type Config = {
  /**
   * How many seconds of history to load
   */
  history: number;

  /**
   * Interval (in seconds) to check for new events
   */
  interval: number;

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

  static fromRaw(event: OpenSeaEvent): MarketEvent {
    const handler = eventTypes.getHandler(event.event_type);
    return {
      type: event.event_type,
      time: event.created_date,
      asset: handler(event, cleanEntries(openseaAssetMapper(event.asset))),
      collection: {
        name: event.asset.collection.name,
        slug: event.asset.collection.slug
      },
      auctionType: event.auction_type,
    }
  }

  constructor(public config: Config) {
    this.stream = new Readable({ objectMode: true, read() { } });

    if (config.history > 0) {
      this.load({ limit: 300, after: moment().unix() - config.history });
    }

    if (config.autoStart) {
      this.start();
    }
  }

  private load(args: Partial<{ limit: number, before: number, after: number }>) {
    AssetLoader
      .events(args)
      .then(events => events.map(MarketEvents.fromRaw))
      .then(tap(events => { load(events.map(e => e.asset), 'assets', 'upsert') }))
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

  public start() {
    if (this.clock) {
      return;
    }
    this.clock = setInterval(() => {
      if (!this.lastTimestamp) {
        return;
      }
      this.load({ limit: 300, after: this.lastTimestamp });
    }, this.config.interval * 1000);
  }

  public stop() {
    if (this.clock) {
      clearTimeout(this.clock);
      this.clock = null;
    }
  }
}
