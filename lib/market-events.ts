import * as AssetLoader from '../lib/asset-loader';
import { Readable } from 'stream';
import util from 'util';
import { OpenSeaEvent } from '../models/remote';
import { DecodeError } from '@ailabs/ts-utils/dist/decoder';

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

  static fromRaw(raw: OpenSeaEvent): MarketEvent {
    return {
      type: raw.event_type,
      time: raw.created_date,
      asset: {
        id: raw.asset.id,
        tokenId: raw.asset.token_id,
        numSales: raw.asset.num_sales,
        name: raw.asset.name || null,
      },
      collection: {
        name: raw.asset.collection.name,
        slug: raw.asset.collection.slug
      },
      auctionType: raw.auction_type,
    }
  }

  constructor(public config: Config) {
    this.stream = new Readable({ objectMode: true, read() { } });

    if (config.history > 0) {
      this.load({ limit: 200, after: Math.floor(Date.now() / 1000) - config.history });
    }

    if (config.autoStart) {
      this.start();
    }
  }

  private load(args: Partial<{ limit: number, before: number, after: number }>) {
    AssetLoader
      .events(args)
      .then(events => events.map(MarketEvents.fromRaw).forEach(this.push.bind(this)))
      .catch(e => {
        console.error(
          'Failed to load market events',
          e instanceof DecodeError ? e.toString() : util.inspect(e)
        )
      });
  }

  private push(e: MarketEvent) {
    this.lastTimestamp = Math.max(this.lastTimestamp, Math.floor(e.time.getTime() / 1000));
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
      this.load({ limit: 200, after: this.lastTimestamp });
    }, this.config.interval * 1000);
  }

  public stop() {
    if (this.clock) {
      clearTimeout(this.clock);
      this.clock = null;
    }
  }
}
