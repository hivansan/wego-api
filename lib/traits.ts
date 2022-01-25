import { uniqBy } from 'ramda';


export async function loadTraits(assets: any[]) {
  const customAssets = assets.map(asset => {
    return {
      price: asset.currentPrice ?? 0,
      traits: asset.traits.map(trait => `${trait.trait_type}:${trait.value}`)
    }
  });
  const traits = uniqBy(({ trait_type, value }: any) => `${trait_type}:${value}`,
    assets
      .filter((a: any) => a.traits?.length)
      .flatMap((a: any) => a.traits))
    .map(trait => {
      return {
        ...trait,
        ...getFloorTopPrice(filterAssetsByTraits(customAssets, `${trait.trait_type}:${trait.value}`))
      }
    })
  return traits;
}

function getFloorTopPrice(assets) {
  const assetsPrices = assets.flatMap(assetFiltered => assetFiltered.price);
  return { floor_price: Math.min(...assetsPrices), top_price: Math.max(...assetsPrices) }
}
function filterAssetsByTraits(assets, value) {
  return assets.filter(asset => (asset.traits.indexOf(value) != -1 && asset.price != 0));
}

