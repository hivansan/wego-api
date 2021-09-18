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
  // description: "total minted items"
  totalSupply: string, // number?
  featuredCollection: boolean,
  featuredScore: number,
  // description: "max of items that can be minted"
  maxSupply: string,
  volumeTraded: string,

  /**
   * Maybe these should be numbers though?
   */
  floorPrice: string,
  maxPrice: string,
  wegoScore: string,

  owners: array(string),
});
