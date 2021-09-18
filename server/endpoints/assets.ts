import * as Express from 'express';
import axios from 'axios';
import { arrayFetch } from '../../lib/network';
import { object, string } from '@ailabs/ts-utils/dist/decoder';

/**
 * These are 'decoders', higher-order functions that can be composed together to 'decode' plain
 * JS values into typed values.
 */
const params = {
  getAsset: object('AssetParams', {
    contractAddress: string,
    tokenId: string
  })
}

export default (app: Express.Application) => {
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
