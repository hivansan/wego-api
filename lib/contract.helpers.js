'use strict';

const Etherscan = require('./etherscan.class');
const app = require('../server/server');
const scrapeUtils = require('../utils/scrape.utils');
const _ = require('lodash');

function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
const getAbi = async (address) => {
  const { Contract, ContractAbi } = app.models;
  console.log('address', address);
  // return { address };
  try {
    const abiDB = await ContractAbi.findOne({ where: { address } });
    // console.log('found abiDB id', abiDB?.id);
    if (abiDB) return abiDB;

    const es = new Etherscan();
    const responseAbi = await es.getAbi(address);

    const isValidJSON = isJSON(responseAbi.result);
    const abi = isValidJSON
      ? JSON.parse(responseAbi.result)
      : responseAbi.result;

    ContractAbi.create({
      address,
      abi,
      isJSON: isValidJSON,
    });
    return isValidJSON ? { address, abi } : {};

    // return response;
  } catch (error) {
    console.log('error', error);
  }
};

const saveAbis = async () => {
  const { ContractAbi } = app.models;
  // return { address };
  try {
    const contracts = await ContractAbi.find({ fields: { address: true } });
    const addresses = contracts.map(Object).map(({ address }) => address);
    const nftAddresses = require('../data/nft-addresses');

    const difference = _.difference(nftAddresses, addresses);
    console.log('difference', difference.length);
    scrapeUtils.postItems(difference);

    return difference;
  } catch (error) {
    console.log('error', error);
  }
};

const saveSupply = async () => {
  const { ContractAbi } = app.models;
  // return { address };
  try {
    const contracts = await ContractAbi.find({
      where: {
        totalSupply: null,
      },
      fields: { address: true },
    });
    const addresses = contracts.map(Object).map(({ address }) => address);

    const es = new Etherscan();

    for (const address of addresses) {
      await sleep(0.3);
      es.getTotalSupply(address).then((totalSupply) => {
        console.log('totalSupply', totalSupply);
        console.log('address', address);
        if (+totalSupply >= 0) {
          ContractAbi.findOne({ where: { address } }, (err, contract) => {
            // console.log('err', err);
            if (contract) {
              console.log('contract.id', contract.id);
              contract.updateAttributes({
                totalSupply:
                  +totalSupply < 18446744073709551615 ? totalSupply : -1,
              });
            }
          });
        }
      });
    }

    return { ok: true };
  } catch (error) {
    console.log('error', error);
  }
};

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

module.exports = { getAbi, saveAbis, saveSupply };
