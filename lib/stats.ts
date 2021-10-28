import { curry } from 'ramda';
import { Asset } from '../models/asset';

export const statsByTraits = curry((traits, count) => {
  let scores = traits.reduce((acc: any, t: any) => {
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
  }, {
    statisticalRarity: 1,
    singleTraitRarity: 1,
    avgTraitRarity: 0,
    rarityScore: 0,
    traits: [],
  });

  if (scores.avgTraitRarity) {
    scores.avgTraitRarity /= traits.length;
  }

  return scores;
});

/**
 * Destructively sorts and ranks an array by `from` key, ranking duplicate values as equal. Writes results to `to` key.
 */
export const rank = <
  Val extends object & { [key in From]: number },
  From extends keyof Val,
  NewKey extends string
>(from: keyof Val, to: NewKey, vals: Val[]) => {
  vals.sort((a, b) => a[from] - b[from]);

  let lastRank = 1, lastVal: number = vals[0][from];

  vals.forEach(val => {
    console.log('rank', lastRank, 'from', lastVal, 'to', val[from], 'next?', lastVal !== val[from]);

    if (lastVal !== val[from]) {
      lastRank++;
    }
    Object.assign(val, { [to]: lastRank });
    lastVal = val[from];
  });

  return vals as (Val & { [key in NewKey]: number });
}

export async function collection(count: number, assets: Asset[]) {
  const collectionStats = assets.map(asset => Object.assign({ id: asset.tokenId }, statsByTraits(asset.traits, count)));

  ([
    ['statisticalRarity', 'statisticalRarityRank'],
    ['singleTraitRarity', 'singleTraitRarityRank'],
    ['avgTraitRarity', 'avgTraitRarityRank'],
    ['rarityScore', 'rarityScoreRank']
  ] as const)
    .forEach(([from, to]) => rank(from, to, collectionStats));

  return collectionStats;
}
