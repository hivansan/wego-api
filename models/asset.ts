import { mergeLeft } from 'ramda';
import { array, Decoded, nullable, number, object, string } from '@ailabs/ts-utils/dist/decoder';
import { trait } from './trait';
import { match, toDate } from './util';

/**
 * This is a type alias. It type-checks as a string (although we can do fancy validation with decoders later),
 * but it lets us talk about data-modeling in a more expressive way within the context of a type definition.
 */
export type Address = string;

export type Asset = Decoded<typeof asset>;
export const asset = object('Asset', {
  name: string,
  contractAddress: match<Address>(/^0x[a-f0-9]{40}$/),
  tokenId: number,
  owners: array(string),
  owner: string,
  description: string,
  imageBig: string,
  animationUrl: string,
  imageSmall: string,
  traits: array(trait),
  rariScore: number,
  createdAt: toDate,
  updatedAt: toDate,
});

export const init = (val: Omit<Asset, 'createdAt' | 'updatedAt'>): Asset => mergeLeft(val, {
  createdAt: new Date(),
  updatedAt: new Date(),
});
