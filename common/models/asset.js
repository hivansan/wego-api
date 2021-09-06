'use strict';
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

  Asset.remoteMethod('search', {
    http: {
      verb: 'get',
    },
    accepts: [
      {
        arg: 'q',
        type: 'string',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  }

  Asset.search = async (q) => {
    console.log('hola');

    await sleep(2);
    return {
      q,
      exactMatch: {
        type: 'nft', // collection
        address: '0x123..',
        image: '',
      },
      nfts: [
        {
          tokenId: 'tokenId',
          address: 'address',
          image: 'image',
          name: 'name',
        },
      ],
      collecetions: [
        {
          tokenId: 'tokenId',
          image: 'image',
          name: 'name',
        },
      ],
    };
  };
};
