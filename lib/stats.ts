import { difference, curry, evolve, flip, identity, prop, pick, uniq, uniqBy } from 'ramda';
import { Asset } from '../models/asset';

export const rankFields = [
  ['statisticalRarity', 'statisticalRarityRank', false],
  ['singleTraitRarity', 'singleTraitRarityRank', false],
  ['avgTraitRarity', 'avgTraitRarityRank', false],
  ['rarityScore', 'rarityScoreRank', true]
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

  return norm === 0 ? acc : {
    statisticalRarity: acc.statisticalRarity * norm,
    singleTraitRarity: Math.min(acc.singleTraitRarity, norm),
    avgTraitRarity: acc.avgTraitRarity + norm,
    rarityScore: acc.rarityScore + 1 / (norm || 1),
    traits: acc.traits.concat([{
      trait_type: t.trait_type,
      value: t.value,
      traitStat: norm,
      traitScore: +((1 / norm).toFixed(8)),
      trait_count: t.trait_count,
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
  Val extends object & { [key in From]: number } & { id: string | number },
  From extends keyof Val,
  NewKey extends string
>(from: keyof Val, to: NewKey, shouldFlip: boolean, vals: Val[]) => {

  const sortFn = (a: Val, b: Val) => {
    const diff = a[from] - b[from];
    const [idA, idB] = [parseInt(a.id.toString(), 10), parseInt(b.id.toString(), 10)];
    return diff !== 0
      ? diff
      : (shouldFlip ? idB - idA : idA - idB)
  }

  vals.sort((shouldFlip ? flip : identity)(sortFn));

  let lastRank = 1, totalOfRank = 1, lastVal: number = vals[0][from];

  vals.forEach(val => {
    if (lastVal !== val[from]) {
      lastRank = totalOfRank;
    }
    totalOfRank++;
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

export const isUnrevealed = (a: Asset): boolean => (a.description?.toLowerCase().includes('unrevealed') || a.name?.toLowerCase().includes('unrevealed')) || !a.traits?.length || a.traits.some(t => t.value === '???')

export async function collection(count: number, assets: Asset[], collectionTraits: object) {
  // console.log('collectionTraits --', collectionTraits);

  const collectionTraitKeys = Object.keys(collectionTraits);
  const allTraits = collectionTraitKeys.map(key => ({
    trait_type: `${key}`,
    trait_count: assets.filter((a: any) => !a.traits.find((t: any) => t.trait_type === key && t.value)).length,
    value: null
  }));

  for (const asset of assets) {
    const assetTraitKeys = asset.traits
      .filter((t: any) => t.value && t.trait_type !== 'traitCount')
      .map(prop('trait_type') as any);

    asset.traitsCount = assetTraitKeys.length;
    const diff = difference(collectionTraitKeys, assetTraitKeys);
    const extraTraits = [
      ...diff.map((t: any) => allTraits.find((m) => m.trait_type === t)),
      {
        trait_type: 'traitCount',
        trait_count: (assets).filter((a: Asset) => a.traitsCount === assetTraitKeys.length).length,
        value: assetTraitKeys.length
      }];
    asset.traits = uniqBy(prop('trait_type'))([...extraTraits, ...asset.traits] as any) as any;
  }

  const collectionStats = assets.map(index(count));
  rankFields.forEach(([from, to, shouldFlip]) => rank(from, to, shouldFlip, collectionStats as any));
  return collectionStats;
}
