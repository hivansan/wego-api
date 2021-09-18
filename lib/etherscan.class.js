'use strict';

import axios from 'axios';
import { ETHERSCAN_PUBLICKEY } from './constants';

const baseURL = 'https://api.etherscan.io/api';

class Etherscan {
  constructor() {
    this.axios = axios.create({
      baseURL: baseURL + '?apikey=' + ETHERSCAN_PUBLICKEY,
      headers: {
        accept: 'application/json, text/plain, */*',
      },
    });
  }

  async getAbi(address) {
    const params = {
      address,
      module: 'contract',
      action: 'getabi',
    };
    // console.log('params', params);
    // console.log('fn', this.axios.get('', params));

    try {
      const query = new URLSearchParams(params).toString();

      let res = await this.axios.get('&' + query);
      console.log('res', res?.data);
      return res.data;
    } catch (error) {
      console.log('error ethscan', error);
      throw error;
    }
  }

  async getTotalSupply(address) {
    // https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d&apikey=DMYUZ4DSVG9J6C65PM2UZNMUPUKVSN5DZQ
    const params = {
      contractaddress: address,
      module: 'stats',
      action: 'tokensupply',
    };
    // console.log('params', params);
    // console.log('fn', this.axios.get('', params));

    try {
      const query = new URLSearchParams(params).toString();

      let res = await this.axios.get('&' + query);
      console.log('res', res?.data);
      return res.data?.result;
    } catch (error) {
      console.log('error ethscan', error);
      throw error;
    }
  }
}

module.exports = Etherscan;
