import { clamp, pipe, objOf, always, path, uniq, flatten, tap, equals, last, prop, concat, map, uniqBy, filter, any, has } from 'ramda';


export async function test(assets: any[]) {
  const customAssets = assets.map(asset => {
    return {
      price: asset.currentPrice ?? 0,
      traits: asset.traits.map(trait => trait.value)
    }
  });
  const traits = uniqBy(({ trait_type, value }: any) => `${trait_type}:${value}`,
    assets
      .filter((a: any) => a.traits?.length)
      .flatMap((a: any) => a.traits))
    .map(trait => {
      return {
        ...trait,
        ...filterByTraitValue(customAssets, trait.value)
      }
    })
  return traits;
}

function filterByTraitValue(customAssets, value) {
  const assetFilter = customAssets.filter(asset => (asset.traits.indexOf(value) != -1 && asset.price != 0)).flatMap(assetFiltered => assetFiltered.price);
  return { floor_price: Math.min(...assetFilter), top_price: Math.max(...assetFilter) }
}

