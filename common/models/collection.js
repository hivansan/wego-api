'use strict';
const { arrayFetch, fetchNParse } = require('../../lib/fetchNParse');

module.exports = function (Collection) {
  Collection.remoteMethod('get', {
    http: {
      path: '/:contract',
      verb: 'get',
    },
    accepts: [{ arg: 'contract', type: 'string', required: true }],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Collection.get = async function (contract) {
    try {
      const { collection: openseaCollection } = await fetchNParse(
        `http://api.opensea.io/api/v1/asset/${contract}/1/`
      );
      const collection = await Collection.create({
        slug: openseaCollection.slug,
        floorPrice: openseaCollection.stats.floor_price,
        maxPrice: openseaCollection.stats.marketCap,
        owners: openseaCollection.stats.num_owners,
        name: openseaCollection.name,
        wegoScore: '0',
        volumeTraded: openseaCollection.stats.total_volume,
        maxSupply: openseaCollection.stats.total_supply, // Supposing total supply and max supply is the same thing
        releaseDate: '',
        released: true,
        contractAddress: contract,
        imgPortrait: openseaCollection.banner_image_url,
        imgMain: openseaCollection.image_url,
        featuredCollection: false,
        featuredScore: '',
      });
      return collection;
    } catch (e) {
      console.log(e);
      return {};
    }
  };
};
