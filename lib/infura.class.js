'use strict';

const web3 = require('web3');
const { INFURA_PUBLICKEY, ADMIN_ADDRESS } = require('./constants');

const baseURL = 'https://mainnet.infura.io/v3/' + INFURA_PUBLICKEY;

class Infura {
  constructor() {}

  // { method, address, methodParams, abi }
  /**
   *
   * @param {Object} params
   * @param {String} params.method - method to be executed from contract .call()
   * @param {String} params.address - contract address
   * @param {Array} params.methodParams - method params to send
   * @param {Object} params.abi - abi of the contract
   * @returns
   */
  async get(params) {
    // console.log('params', params);
    // return params;
    try {
      const web3js = new web3(new web3.providers.HttpProvider(baseURL));

      const contract = new web3js.eth.Contract(params.abi, params.address);

      const contractCall =
        params.methodParams !== null
          ? contract.methods[params.method](params.methodParams)
          : contract.methods[params.method]();

      const res = await contractCall.call({
        from: ADMIN_ADDRESS,
      });

      return res;
    } catch (error) {
      console.log('error infura', error.message);
      throw error;
    }
  }
}

module.exports = Infura;
