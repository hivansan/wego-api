import * as ElasticSearch from '@elastic/elasticsearch';
import axios from 'axios';
import * as Network from './network';
import * as Asset from '../models/asset';
import * as Collection from '../models/collection';
import * as Remote from '../models/remote';
import * as Query from './query';
import Result from '@ailabs/ts-utils/dist/result';

import { URLSearchParams } from 'url';

export async function fromDb(db: ElasticSearch.Client, contract: Asset.Address, tokenId: string, traits?: { [key: string]: string[] }) {
  /**
   * @TODO Map traits to ES query
   */
  const traitQuery: any[] = Object.entries(traits || []).map(([type, values]) => []);

  return Query.findOne(db, 'assets', {
    filter: {
      bool: {
        must: traitQuery.concat([
          { term: { tokenId: tokenId } },
          { term: { 'contract.address': contract } }
        ])
      }
    }
  });
}

export async function fromRemote(contractAddress, tokenId) {
  // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/0xa7f767865fce8236f71adda56c60cf2e91dadc00:504/meta`,
  // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/0xa7f767865fce8236f71adda56c60cf2e91dadc00:504`,
  // `https://api.opensea.io/api/v1/asset/0xa7f767865fce8236f71adda56c60cf2e91dadc00/504/`,

  const [rariNft, openseaNft] = await Network.arrayFetch([
    // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}/meta`,
    `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}`,
    `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/`,
  ]);

  const asset: Result<any, Asset.Asset> = Remote.openSea(openseaNft).chain(openSea => Remote.rarible(rariNft).map(rari => Asset.init({
    name: openSea.name,
    tokenId,
    contractAddress,
    owners: rari.owners,
    owner: null,
    description: openSea.description, //  rariMeta.description
    imageBig: openSea.image_original_url, // rariMeta.image.url.BIG,
    imageSmall: openSea.image_preview_url, // rariMeta.image.url.PREVIEW,
    animationUrl: openSea.animation_original_url,
    //rariscore: https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c
    tokenMetadata: openSea.token_metadata,
    rariScore: !openSea.traits.length || !openSea.collection.stats.total_supply
      ? null
      : openSea.traits.reduce(
        (acc, t) =>
          acc +
          1 /
          (t.trait_count / openSea.collection.stats.total_supply),
        0
      ),
    traits: openSea.traits,
  })));

  return asset;
  return Query

};

/**
 * curl --request GET \
 * --url 'https://api.opensea.io/api/v1/assets?token_ids=9974&asset_contract_address=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d&order_direction=desc&offset=0&limit=20'
 *
 * --url 'https://api.opensea.io/api/v1/assets?order_direction=desc&offset=0&limit=1&collection=infinites-ai'
 * 
 * @TODO This needs a decoder so we validate we're getting the right data
 */
export async function fromCollection(contractAddress: Asset.Address, tokenId?: number) {
  try {
    const limit = 50;
    let assets: any[] = [];

    const iterator = Network.paginated(
      result => !!(result as any).data?.assets?.length,
      page => {
        const params = Object.assign(tokenId && page === 0 ? { token_ids: tokenId } : {}, {
          asset_contract_address: contractAddress,
          offset: page * limit,
          limit,
        });
        const query = new URLSearchParams(params as any).toString();
        return axios(`https://api.opensea.io/api/v1/assets?${query}`)
      }
    );

    for await (const newAssets of iterator) {
      assets = assets.concat(newAssets);
    }

    return assets;

  } catch (error) {
    throw error;
  }
}

export async function collectionFromRemote(slug: string): Promise<Collection.Collection & { stats: Collection.CollectionStats } | null> {
  const params: any = {
    collection: slug,
    offset: 0,
    limit: 1,
  };
  const queryParams = new URLSearchParams(params).toString();
  const url = `https://api.opensea.io/api/v1/assets?${queryParams}`;
  
  
  const { data } = await axios(url);
  const [asset] = data.assets;

  const contractAddress = asset.asset_contract?.address;
  if (!asset || !asset.token_id || !contractAddress) {
    return null;
  }

  try {
    const assetUrl = `http://api.opensea.io/api/v1/asset/${contractAddress}/${asset.token_id}/`;
    const os = await Network.fetchNParse(assetUrl)
      .then(Remote.openSeaCollection)
      .then(Result.toPromise);

    const collection: Collection.Collection = {
      contractAddress,
      slug: os.collection.slug,
      name: os.collection.name,
      releaseDate: os.collection.created_date,
      released: true,
      imgPortrait: os.collection.banner_image_url,
      imgMain: os.collection.image_url,
      imgLarge: os.collection.large_image_url,
      twitter: os.collection.twitter_username,
      discord: os.collection.discord_url,
      instagram: os.collection.instagram_username,
      telegram: os.collection.telegram_url,
      website: os.collection.external_url,
    };

    const stats: Collection.CollectionStats = {
      contractAddress,
      slug,
      wegoScore: 0,
      featuredCollection: false,
      featuredScore: 0,
      
      oneDayVolume: os.collection.stats.one_day_volume,
      oneDayChange: os.collection.stats.one_day_change,
      oneDaySales: os.collection.stats.one_day_sales,
      oneDayAveragePrice: os.collection.stats.one_day_average_price,
      sevenDayVolume: os.collection.stats.seven_day_volume,
      sevenDayChange: os.collection.stats.seven_day_change,
      sevenDaySales: os.collection.stats.seven_day_sales,
      sevenDayAveragePrice: os.collection.stats.seven_day_average_price,
      thirtyDayVolume: os.collection.stats.thirty_day_volume,
      thirtyDayChange: os.collection.stats.thirty_day_change,
      thirtyDaySales: os.collection.stats.thirty_day_sales,
      thirtyDayAveragePrice: os.collection.stats.thirty_day_average_price,
      totalVolume: os.collection.stats.total_volume,
      totalSales: os.collection.stats.total_sales,
      totalSupply: os.collection.stats.total_supply,
      count: os.collection.stats.count,
      numOwners: os.collection.stats.num_owners,
      averagePrice: os.collection.stats.average_price,
      numReports: os.collection.stats.num_reports,
      marketCap: os.collection.stats.market_cap,
      floorPrice: os.collection.stats.floor_price,
    };
    return Object.assign(collection, { stats });
  } catch (e) {
    console.log('err--', JSON.stringify(e));
    return null;
  }
}
