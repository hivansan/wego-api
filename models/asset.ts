import { mergeLeft, pick, pipe } from 'ramda';
import { array, Decoded, nullable, number, object, string } from '@ailabs/ts-utils/dist/decoder';
import { trait } from './trait';
import { addProps, match, toDate } from './util';
import { Result } from '@ailabs/ts-utils';

export type Stats = {
  statisticalRarity: number;
  singleTraitRarity: number;
  avgTraitRarity: number;
  rarityScore: number;
};

export type Trait = {
  trait_type: string;
  value: string | number;
  trait_count: number;
}

export type TraitStat = { traitStat: number, traitScore: number };

/**
 * This is a type alias. It type-checks as a string (although we can do fancy validation with decoders later),
 * but it lets us talk about data-modeling in a more expressive way within the context of a type definition.
 */
export type Address = string;

export type Asset = Decoded<typeof asset>;
export const asset = object('Asset', {
  name: nullable(string),
  slug: string,
  contractAddress: match<Address>(/^0x[a-f0-9]{40}$/),
  tokenId: string,
  owners: nullable(array(string)),
  owner: nullable(Object),
  description: nullable(string),
  animationUrl: nullable(string),
  imageBig: nullable(string),
  imageSmall: nullable(string),
  traits: array(trait),
  rarityScore: nullable(number),
  createdAt: nullable(toDate),
  updatedAt: nullable(toDate),
  tokenMetadata: nullable(string),
  collection: nullable(Object),
  traitsCount: nullable(number),
  sellOrders: nullable(Result.ok),
  lastSale: nullable(Result.ok),
  lastSalePrice: nullable(number),
  lastSalePriceUSD: nullable(number),
  currentPrice: nullable(number),
  currentPriceUSD: nullable(number),
});

export const init = (val: Omit<Asset, 'createdAt' | 'updatedAt'>): Asset => mergeLeft(val, {
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const mapTraits = (total: number) => pipe<Trait & {}, Trait, Trait>(
  pick(['trait_type', 'value', 'trait_count']),
  addProps<Trait, TraitStat>(({ trait_count }) => ({
    traitStat: trait_count / total,
    traitScore: 1 / (trait_count / total),
  }))
);
