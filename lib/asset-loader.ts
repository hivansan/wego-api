import * as ElasticSearch from '@elastic/elasticsearch';
import axios from 'axios';
import * as Network from './network';
import { Address } from '../models/asset';
import * as Query from './query';

export async function fromDb(db: ElasticSearch.Client, contract: Address, tokenId: number) {
  return Query.findOne(db, 'assets', {
    filter: {
      bool: {
        must: [
          { term: { id: tokenId } },
          { term: { 'contract.address': contract } }
        ]
      }
    }
  });
}

export async function fromRemote(contractAddress, tokenId) {
  // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/0xa7f767865fce8236f71adda56c60cf2e91dadc00:504/meta`,
  // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/0xa7f767865fce8236f71adda56c60cf2e91dadc00:504`,
  // `https://api.opensea.io/api/v1/asset/0xa7f767865fce8236f71adda56c60cf2e91dadc00/504/`,

  const urls = [
    // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}/meta`,
    `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}`,
    `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/`,
  ];

  try {
    const [rariNft, openseaNft] = await Network.arrayFetch(urls);
    const asset = await Asset.create({
      tokenId,
      name: openseaNft.name,
      contractAddress,
      owners: rariNft.owners,
      description: openseaNft.description, //  rariMeta.description,
      imageBig: openseaNft.image_original_url, // rariMeta.image.url.BIG,
      imageSmall: openseaNft.image_preview_url, // rariMeta.image.url.PREVIEW,
      traits: openseaNft.traits,
      //rariscore: https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c
      rariScore:
        openseaNft?.traits?.length &&
          openseaNft.collection?.stats?.total_supply
          ? openseaNft.traits.reduce(
            (acc, t) =>
              acc +
              1 /
              (t.trait_count / openseaNft.collection.stats.total_supply),
            0
          )
          : null,
    });

    // @TODO Save

    return asset;
  } catch (error) {
    throw error;
  }
};

/**
 * curl --request GET \
 * --url 'https://api.opensea.io/api/v1/assets?token_ids=9974&asset_contract_address=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d&order_direction=desc&offset=0&limit=20'
 *
 * --url 'https://api.opensea.io/api/v1/assets?order_direction=desc&offset=0&limit=1&collection=infinites-ai'
 * 
 * @TODO This needs a decoder so we validate we're getting the right data
 */
export async function fromCollection(contractAddress: Address, tokenId?: string) {
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
