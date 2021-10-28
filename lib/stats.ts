import { curry, evolve } from 'ramda';
import { Asset } from '../models/asset';

export const rankFields = [
  ['statisticalRarity', 'statisticalRarityRank'],
  ['singleTraitRarity', 'singleTraitRarityRank'],
  ['avgTraitRarity', 'avgTraitRarityRank'],
  ['rarityScore', 'rarityScoreRank']
] as const;

type Trait = {
  trait_type: string;
  value: string | number;
  trait_count: number;
}

export type TraitStats = typeof initial;
export type StatMap = { [key: string]: TraitStats };

export const traitReducer = (count: number) => (acc: any, t: Trait): TraitStats => {
  const norm = t.trait_count / count;

  return {
    statisticalRarity: acc.statisticalRarity * norm,
    singleTraitRarity: Math.min(acc.singleTraitRarity, norm),
    avgTraitRarity: acc.avgTraitRarity + norm,
    rarityScore: acc.rarityScore + 1 / norm,
    traits: acc.traits.concat([{
      trait_type: t.trait_type,
      value: t.value,
      traitStat: norm,
      traitScore: 1 / norm,
    }]),
  };
};

const initial = {
  statisticalRarity: 1,
  singleTraitRarity: 1,
  avgTraitRarity: 0,
  rarityScore: 0,
  traits: ([] as Trait[]),
};

export const statsByTraits = (traits: Trait[], count: number): TraitStats => (
  evolve({
    avgTraitRarity: (val: number) => val / traits.length
  }, traits.reduce(traitReducer(count), initial))
);

/**
 * Destructively sorts and ranks an array by `from` key, ranking duplicate values as equal. Writes results to `to` key.
 * 
 * @HACK All the vals params are any because the constraint type signagure is wrong.
 */
export const rank = <
  Val extends object & { [key in From]: number },
  From extends keyof Val,
  NewKey extends string
>(from: keyof Val, to: NewKey, vals: Val[]) => {
  vals.sort((a, b) => a[from] - b[from]);

  let lastRank = 1, lastVal: number = vals[0][from];

  vals.forEach(val => {
    if (lastVal !== val[from]) {
      lastRank++;
    }
    Object.assign(val, { [to]: lastRank });
    lastVal = val[from];
  });

  return vals as (Val & { [key in NewKey]: number })[];
}

export const index = (count: number) => (asset: Asset) => Object.assign(
  { id: asset.tokenId as any },
  /**
   * @HACK The `Asset` type definition doesn't agree with what we actually store in the database—one should be fixed so we can remove
   * the `unknown`.
   */
  statsByTraits(asset.traits as unknown as Trait[], count)
);

export async function collection(count: number, assets: Asset[]) {
  const collectionStats = assets.map(index(count));
  rankFields.forEach(([from, to]) => rank(from, to, collectionStats as any));
  return collectionStats;
}
