'use strict';

const scraperHelper = require('../../lib/scraper.helpers');

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
    return scraperHelper.getWeb3({
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
  Scraper.getAbi = scraperHelper.getAbi;

  Scraper.remoteMethod('saveAbis', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveAbis = scraperHelper.saveAbis;

  Scraper.remoteMethod('saveSupply', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveSupply = scraperHelper.saveSupply;

  Scraper.remoteMethod('saveTokensUri', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveTokensUri = scraperHelper.saveTokensUri;

  Scraper.remoteMethod('saveCollections', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Scraper.saveCollections = scraperHelper.saveCollections;
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
