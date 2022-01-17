function capitalize(value) {
  return value.split(" ").map(traitValue => traitValue.charAt(0).toUpperCase() + traitValue.slice(1)).join(" ");
}

function filterByTraitValue(assets, value) {
  const assetFilter = assets.filter(asset => asset.traits.indexOf(value) != -1).flatMap(asset => asset.price);
  return { min: Math.min(...assetFilter), max: Math.max(...assetFilter) }
}

export async function traits(assets: any[], collection: Promise<any>) {
  const assetsCustom = assets.map(asset => {
    return {
      token: asset.tokenId,
      price: asset.currentPrice ? asset.currentPrice : asset.lastSalePrice ? asset.lastSalePrice : 0,
      traits: asset.traits.map(trait => trait.value)
    }
  });
  const collectionTraits = await collection.then(collectionTrait => collectionTrait.body.traits);
  const traits = Object.keys(collectionTraits).flatMap((traitType) => {
    const traits = Object.entries(collectionTraits[traitType]).map(((trait: any) => { return { traitValue: trait[0], traitCount: trait[1] } }));
    return traits.map(trait => {
      const prices: any = filterByTraitValue(assetsCustom, capitalize(trait.traitValue));
      return {
        trait_type: traitType,
        value: capitalize(trait.traitValue),
        display_type: null,
        max_value: null,
        trait_count: trait.traitCount,
        order: null,
        floor_price: prices.min,
        top_price: prices.max
      }
    });
  });
  return traits;
}
