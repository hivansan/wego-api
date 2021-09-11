'use strict';
const { arrayFetch } = require('../../lib/fetchNParse');

module.exports = (Indexed) => {
  Indexed.remoteMethod('get', {
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

  Indexed.get = async (contract, id) => {
    const urls = [
      `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contract}:${id}/meta`,
      `http://api.rarible.com/protocol/v0.1/ethereum/nft/items/${contract}:${id}`,
      `https://api.opensea.io/api/v1/asset/${contract}/${id}/`,
    ];

    try {
      const [rariMeta, rariNft, openseaNft] = await arrayFetch(urls);
      const indexed = await Indexed.create({
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
      return indexed;
    } catch (error) {
      throw error;
    }
  };
};
