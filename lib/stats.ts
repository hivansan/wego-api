import { curry, path, prop } from "ramda";

import * as Network from './network';
import { URLSearchParams } from 'url';

export const statsByTraits = curry((traits, count) => {
  let scores = traits.reduce(
    (acc, t) => {
      const norm = t.trait_count / count;
      acc.traits.push({
        trait_type: t.trait_type,
        value: t.value,
        traitStat: norm,
        traitScore: 1 / norm,
      });
      return {
        statisticalRarity: acc.statisticalRarity * norm,
        singleTraitRarity: Math.min(acc.singleTraitRarity, norm),
        avgTraitRarity: acc.avgTraitRarity + norm,
        rarityScore: acc.rarityScore + 1 / norm,
        traits: acc.traits,
      };
    },
    {
      statisticalRarity: 1,
      singleTraitRarity: 1,
      avgTraitRarity: 0,
      rarityScore: 0,
      traits: [],
    }
  );

  if (scores.avgTraitRarity) {
    scores.avgTraitRarity /= traits.length;
  }

  return scores;
});

export async function collection(contract: string) {
  const url = 'https://api.opensea.io/api/v1/assets';
  const params = new URLSearchParams({ asset_contract_address: contract, limit: '1' });
  const id = await Network.fetchNParse(`${url}?${params}`).then(path(['assets', 0, 'token_id']));

  const asset: any = await Network.fetchNParse(`https://api.opensea.io/api/v1/asset/${contract}/${id}`);
  const count = asset?.collection?.stats?.count || 0;
  const limit = 50;

  const iterator: AsyncGenerator<any, any, any> = Network.paginated(
    result => !result || !result.length || result.length < limit + 1,
    page => {
      const params = new URLSearchParams({
        asset_contract_address: contract,
        offset: (page * limit).toString(),
        limit: limit.toString(),
      });
      return Network.fetchNParse<any>(`${url}?${params}`).then(prop('assets'));
    }
  );

  let collectionStats: any[] = [];

  for await (const nfts of iterator) {
    if (!nfts) {
      break;
    }
    nfts.forEach(nft => {
      collectionStats.push({
        ...statsByTraits(nft.traits, count),
        id: nft.token_id,
      });
    });
  }

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
    .forEach((nft, ix) => (nft.srarityScoreRank = ix + 1));

  return collectionStats;
}
