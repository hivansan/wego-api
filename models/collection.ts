import { Result } from '@ailabs/ts-utils';
import { Decoded, array, number, object, string, boolean, Decoder, nullable } from '@ailabs/ts-utils/dist/decoder';
import { date, match } from './util';

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
  releaseDate: nullable(string),                     // Date?
  released: nullable(boolean),
  // contractAddress : match<Address>(/^0x[a-f0-9]{40}$/),
  imgPortrait: nullable(url),
  imgLarge: nullable(url),
  imgMain: nullable(url),
  twitter: nullable(string),
  discord: nullable(string),
  instagram: nullable(string),
  telegram: nullable(string),
  website: nullable(string),
  primaryAssetConctracts: nullable(array(string)),
  contractAddresses: nullable(array(string)),
  traits: nullable(array(Result.ok), []),
  // updatedAt: date,
});

/**
 * Stats about the collection that are subject to change
 */
export type CollectionStats = Decoded<typeof collectionStats>;
export const collectionStats = object('CollectionStats', {
  slug: string,
  // contractAddress: match<Address>(/^0x[a-f0-9]{40}$/),
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
  totalSupply: number, // total minted items
  count: number, // max of items that can be minted
  numOwners: number,
  averagePrice: number,
  numReports: number,
  marketCap: number,
  floorPrice: nullable(number),

  /**
   * What's the difference between this and total volume?
   * R: this is the same
   */
  // volumeTraded: number,
  // maxSupply: number,
  // maxPrice: number,
});
