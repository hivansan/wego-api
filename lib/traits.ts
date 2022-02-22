import { flatten, map, pipe, uniq, uniqBy } from 'ramda';

export async function loadTraits(assets: any[]) {
  const customAssets = assets.map(asset => ({
    price: asset.currentPrice ?? 0,
    traits: asset.traits.map((trait: { trait_type: any; value: any; }) => `${trait.trait_type}:${trait.value}`)
  }));

  const traits = uniqBy(
    ({ trait_type, value }: any) => `${trait_type}:${value}`,
    assets
      .filter((a: any) => a.traits?.length)
      .flatMap((a: any) => a.traits))
    .map(trait => ({
      ...trait,
      ...getFloorTopPrice(filterAssetsByTraits(customAssets, `${trait.trait_type}:${trait.value}`))
    }))
  return traits;
}

function getFloorTopPrice(assets: any[]) {
  const assetsPrices = assets.flatMap(assetFiltered => assetFiltered.price);
  return { floor_price: Math.min(...assetsPrices), top_price: Math.max(...assetsPrices) }
}
function filterAssetsByTraits(assets: any[], value: string) {
  return assets.filter(asset => (asset.traits.indexOf(value) != -1 && asset.price != 0));
}

export const getTraitPrices = (assets: any[]) => {
  const typeValWithPrice = pipe<any, any, any, any, any, any>(
    map((a: any) => a.traits),
    flatten,
    map(({ trait_type, value }: any) => `${trait_type}:${value}`),
    uniq,
    map((val) => {
      const pricesForTrait = assets.filter((a: any) => a.traits.some((t: any) => `${t.trait_type}:${t.value}` === val && a.currentPrice > 0)).map(t => t.currentPrice);
      return {
        key: val,
        floor_price: pricesForTrait.length ? Math.min(...pricesForTrait) : null,
        top_price: pricesForTrait.length ? Math.max(...pricesForTrait) : null,
      }
    })
  )(assets);

  return assets.map(a => ({ ...a, traits: a.traits.map((t: any) => ({ ...t, ...typeValWithPrice.find((k: any) => k.key === `${t.trait_type}:${t.value}`) })) }))
}
