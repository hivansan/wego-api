'use strict';
const axios = require('axios');
const { arrayFetch, fetchNParse } = require('../../lib/network');
const scraperHelpers = require('../../lib/scraper.helpers');

module.exports = function (Collection) {
  Collection.remoteMethod('get', {
    http: {
      path: '/:contractAddress',
      verb: 'get',
    },
    accepts: [{ arg: 'contractAddress', type: 'string', required: true }],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Collection.get = async function (contractAddress) {
    const params = {
      asset_contract_address: contractAddress,
      offset: 0,
      limit: 1,
    };

    let queryParams = new URLSearchParams(params).toString();
    let url = `https://api.opensea.io/api/v1/assets?${queryParams}`;
    console.log('url ', url);
    let { data } = await axios(url);

    try {
      const os = await fetchNParse(
        `http://api.opensea.io/api/v1/asset/${contractAddress}/${data.assets[0]?.token_id}/`
      );
      console.log('os ', os);
      const collection = await Collection.upsertWithWhere(
        { contractAddress },
        {
          slug: os.collection.slug,
          name: os.name,
          // wegoScore: '0',
          releaseDate: '',
          released: true,
          contractAddress,
          imgPortrait: os.collection.banner_image_url,
          imgMain: os.image_url,
          // featuredCollection: false,
          // featuredScore: '',
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
        }
      );
      return collection;
    } catch (e) {
      console.log(e);
      return {};
    }
  };
};
