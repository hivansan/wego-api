const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

function statsByTraits(traits, count) {
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
  if (scores.avgTraitRarity) scores.avgTraitRarity /= traits.length;

  return scores;
}

async function asset(contract, id) {
  const asset = await fetch(
    `https://api.opensea.io/api/v1/asset/${contract}/${id}`
  ).then((res) => res.json());
  const count = asset.collection.stats.count;
  return statsByTraits(asset.traits, count);
}

module.exports.asset = asset;

async function collection(contract) {
  const url = 'https://api.opensea.io/api/v1/assets?';
  const id = await fetch(
    url +
      new URLSearchParams({
        asset_contract_address: contract,
        limit: 1,
      })
  )
    .then((res) => res.json())
    .then((assets) => assets.assets[0].token_id);
  const asset = await fetch(
    `https://api.opensea.io/api/v1/asset/${contract}/${id}`
  ).then((res) => res.json());
  const count = asset.collection.stats.count;

  async function* assets() {
    let offset = 0;
    while (offset < count) {
      assets = await fetch(
        url +
          new URLSearchParams({
            asset_contract_address: contract,
            offset,
            limit: 50,
          })
      ).then((res) => res.json());
      yield* assets.assets;
      offset += 50;
    }
  }

  const collectionStats = [];

  for await (let nft of assets())
    collectionStats.push({
      ...statsByTraits(nft.traits, count),
      id: nft.token_id,
    });
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

module.exports.collection = collection;
