'use strict';
const axios = require('axios');
const { arrayFetch } = require('../../lib/fetchNParse');

module.exports = (Asset) => {
  Asset.stats = stats.asset;

  Asset.remoteMethod('stats', {
    http: {
      path: '/stats/:contractAddress/:tokenId',
      verb: 'get',
    },
    accepts: [
      { arg: 'contractAddress', type: 'string', required: true },
      { arg: 'tokenId', type: 'string', required: true },
    ],
    returns: { type: 'object', root: true },
  });

  Asset.remoteMethod('get', {
    http: {
      path: '/:contractAddress/:tokenId',
      verb: 'get',
    },
    accepts: [
      { arg: 'contractAddress', type: 'string', required: true },
      { arg: 'tokenId', type: 'string', required: true },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Asset.get = async (contractAddress, tokenId) => {
    // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/0xa7f767865fce8236f71adda56c60cf2e91dadc00:504/meta`,
    // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/0xa7f767865fce8236f71adda56c60cf2e91dadc00:504`,
    // `https://api.opensea.io/api/v1/asset/0xa7f767865fce8236f71adda56c60cf2e91dadc00/504/`,
    const urls = [
      // `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}/meta`,
      `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contractAddress}:${tokenId}`,
      `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/`,
    ];

    try {
      // [rariMeta, rariNft, openseaNft]
      let assetDB = await Asset.findOne({
        where: {
          contractAddress,
          tokenId,
        },
      });
      if (assetDB) return assetDB;

      const [rariNft, openseaNft] = await arrayFetch(urls);
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
      return asset;
    } catch (error) {
      throw error;
    }
  };

  Asset.remoteMethod('getAssetsFromCollection', {
    http: {
      verb: 'get',
    },
    accepts: [
      { arg: 'contractAddress', type: 'string', required: true },
      { arg: 'tokenId', type: 'string', required: false },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Asset.getAssetsFromCollection = async (contractAddress, tokenId) => {
    //   curl --request GET \
    //  --url 'https://api.opensea.io/api/v1/assets?token_ids=9974&asset_contract_address=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d&order_direction=desc&offset=0&limit=20'

    //  --url 'https://api.opensea.io/api/v1/assets?order_direction=desc&offset=0&limit=1&collection=infinites-ai'

    try {
      let page = 0;
      let assets = [];
      const params = {
        asset_contract_address: contractAddress,
        offset: 0,
        limit: 50,
      };

      if (tokenId) params.token_ids = tokenId;
      let queryParams = new URLSearchParams(params).toString();
      let url = `https://api.opensea.io/api/v1/assets?${queryParams}`;
      let results = await axios(url);
      assets = results?.data?.assets;
      delete params.token_ids;
      while (results.data?.assets?.length) {
        page++;
        params.offset = page * params.limit;
        queryParams = new URLSearchParams(params).toString();
        url = `https://api.opensea.io/api/v1/assets?${queryParams}`;
        results = await axios(url);
        console.log(
          'page, asset',
          page,
          contractAddress,
          results?.data?.assets?.length
        );
        if (results?.data?.assets?.length)
          assets = [...assets, results?.data?.assets];
      }
      return assets;
    } catch (error) {
      throw error;
    }
  };
};
