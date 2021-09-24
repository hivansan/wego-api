import { Result } from '@ailabs/ts-utils';
import { Decoded, array, number, object, string, boolean, Decoder } from '@ailabs/ts-utils/dist/decoder';
import { match } from './util';

import "reflect-metadata";

const descriptionKey = Symbol.for('description');

function description<Val>(val: Decoder<Val>, desc: string): Decoder<Val> {
  console.log('DESCRIBE')
  return val;
}

/**
 * Do something fancier here to validate URLs
 */
const url = string;

export type Address = string;

export type Collection = Decoded<typeof collection>;
export const collection = object('Collection', {
  slug: string,
  name: string,
  releaseDate: string, // Date?
  released: boolean,
  contractAddress: match<Address>(/^0x[a-f0-9]{40}$/),
  imgPortrait: url,
  imgMain: url,
  // description: "opensea data"
  osData: Result.ok // <-- this is an escape hatch... basically lets any value through
});

/**
 * Stats about the collection that are subject to change
 */
export type CollectionStats = Decoded<typeof collectionStats>;
export const collectionStats = object('Collection', {
  // Collection contract address, used as a unique ID
  contractAddress: match<Address>(/^0x[a-f0-9]{40}$/),
  featuredCollection: boolean,
  featuredScore: number,

  wegoScore: number,

  oneDayVolume: number,
  oneDayChange: number,
  oneDaySales: number,
  oneDayAveragePrice: number,
  sevenDayVolume: number,
  sevenDayChange: number,
  sevenDaySales: number,
  sevenDayAveragePrice: number,
  thirtyDayVolume: number,
  thirtyDayChange: number,
  thirtyDaySales: number,
  thirtyDayAveragePrice: number,
  totalVolume: number,
  totalSales: number,
  // description: "total minted items"
  totalSupply: number,
  // description: "max of items that can be minted"
  maxSupply: number,
  count: number,
  numOwners: number,
  averagePrice: number,
  numReports: number,
  marketCap: number,

  /**
   * What's the difference between this and total volume?
   */
  volumeTraded: number,
  maxPrice: number,
  floorPrice: number,
});
