'use strict';
const axios = require('axios');
const { arrayFetch } = require('../../lib/fetchNParse');

module.exports = (Asset) => {
  Asset.remoteMethod('get', {
    http: {
      path: '/:contract/:id',
      verb: 'get',
    },
    accepts: [
      { arg: 'contract', type: 'string', required: true },
      { arg: 'id', type: 'string', required: true },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Asset.get = async (contract, id) => {
    const urls = [
      `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contract}:${id}/meta`,
      `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contract}:${id}`,
      `https://api.opensea.io/api/v1/asset/${contract}/${id}/`,
    ];

    try {
      const [rariMeta, rariNft, openseaNft] = await arrayFetch(urls);
      const asset = await Asset.create({
        contract,
        tokenId: id,
        //TODO: add supply
        name: rariMeta.name,
        contract,
        tokenId: id,
        owners: rariNft.owners,
        description: rariMeta.description,
        imageBig: rariMeta.image.url.BIG,
        imageSmall: rariMeta.image.url.PREVIEW,
        properties: openseaNft.traits,
        //rariscore: https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c
        rariScore: openseaNft.traits.reduce(
          (acc, t) =>
            acc +
            1 / (t.trait_count / openseaNft.collection.stats.total_supply),
          0
        ),
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
