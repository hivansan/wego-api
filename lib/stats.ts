import { curry } from "ramda";
import { CollectionStats } from "../models/collection";
import { Asset } from "../models/asset";

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

export async function collection(collection: CollectionStats, assets: Asset[]) {
  const collectionStats = assets.map(asset => Object.assign(
    { id: asset.tokenId },
    statsByTraits(asset.traits, collection.count)
  ));

  collectionStats
    .sort((a, b) => a.statisticalRarity - b.statisticalRarity)
    .forEach((nft, ix) => (nft.statisticalRarityRank = ix + 1));

  collectionStats
    .sort((a, b) => a.singleTraitRarity - b.singleTraitRarity)
    .forEach((nft, ix) => (nft.singleTraitRarityRank = ix + 1));

  collectionStats
    .sort((a, b) => a.avgTraitRarity - b.avgTraitRarity)
    .forEach((nft, ix) => (nft.avgTraitRarityRank = ix + 1));

  collectionStats
    .sort((a, b) => b.rarityScore - a.rarityScore)
    .forEach((nft, ix) => (nft.rarityScoreRank = ix + 1));

  return collectionStats;
}
