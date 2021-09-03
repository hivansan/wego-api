'use strict';

const axios = require('axios');
const web3 = require('web3');
const { INFURA_PUBLICKEY } = require('./constants');
const Erc721Abi = require('./ERC721ABI');

const baseURL = 'https://mainnet.infura.io/v3/' + INFURA_PUBLICKEY;

class Infura {
  constructor() {}

  // {
  //   method, address, methodParams, abi
  // }
  async get({ params }) {
    try {
      const web3js = new web3(
        new web3.providers.HttpProvider(
          'https://mainnet.infura.io/v3/b111d8f387c847039541e29435e06cd2' //c5e5cb06445c43c2b0305c12450cc0b5'
        )
      );

      const contract = new web3js.eth.Contract(contractABI, contractAddress);

      const contractCall = params.methodParams
        ? contract.methods[params.method](params.methodParams)
        : contract.methods[params.method]();

      const res = await contractCall.call({
        from: AdminAddress,
      });

      return res;
    } catch (error) {
      console.log('error infura', error);
      throw error;
    }
  }
}

module.exports = Infura;
