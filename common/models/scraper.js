'use strict';

const contractHelpers = require('../../lib/contract.helpers');

module.exports = (Scraper) => {
  Scraper.remoteMethod('getTokenIdJSON', {
    accepts: [
      {
        arg: 'address',
        type: 'string',
        required: false,
      },
      {
        arg: 'tokenId',
        type: 'string',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.getTokenIdJSON = async (address, tokenId) => {
    return contractHelpers.getWeb3({
      address,
      methodParams: tokenId,
      method: 'tokenURI',
    });
  };

  Scraper.remoteMethod('getAbi', {
    accepts: [
      {
        arg: 'address',
        type: 'string',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  // this also saves the abi if it doesn't exist
  Scraper.getAbi = contractHelpers.getAbi;

  Scraper.remoteMethod('saveAbis', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveAbis = contractHelpers.saveAbis;

  Scraper.remoteMethod('saveSupply', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveSupply = contractHelpers.saveSupply;

  Scraper.remoteMethod('saveTokenUri', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveTokenUri = contractHelpers.saveTokenUri;
};

// const Web3 = require("web3")
// const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/YOUR_PROJECT_ID"))
// get the balance of an ethereum address
// web3.eth.getBalance("0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// })
