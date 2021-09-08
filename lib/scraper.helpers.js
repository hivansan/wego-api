'use strict';

const axios = require('axios');
const Etherscan = require('./etherscan.class');
const app = require('../server/server');
const scrapeUtils = require('../utils/scrape.utils');
const _ = require('lodash');
const Infura = require('./infura.class');
const ERC721ABI = require('./ERC721ABI');

const isJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const sleep = (s) => {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
};

const isBase64 = (str) => str.includes('base64,');
const isPlain = (str) => str.includes('plain;');
const isDataJson = (str) => str.includes('json;');

const getUriType = (uri) => {
  if (uri && typeof uri === 'object') return 'is object'; // Buffer.from(uri.split('base64,')[1], 'base64').toString('utf-8');
  if (uri && isBase64(uri)) return 'is json'; // Buffer.from(uri.split('base64,')[1], 'base64').toString('utf-8');
  if (uri && isPlain(uri)) return 'is plain';
  if (uri && isDataJson(uri)) return 'is json';
  return uri;
};

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
    scrapeUtils.postItems(difference, 'getAbi');

    return difference;
  } catch (error) {
    console.log('error', error);
  }
};

const saveTokensUri = async () => {
  const { ContractAbi, Scraper } = app.models;
  // return { address };
  try {
    const contracts = await ContractAbi.find({
      // where: { address: '0xa2b48a0420df2ccbfc9be29551b2fe829eb2476e' },
      where: { tokenUri: null, isJSON: true },
      // limit: 100,
      // fields: { address: true, tokenUri: true },
    });

    const addresses = contracts.map(Object).map(({ address }) => address);

    console.log('addresses.length', addresses.length);

    for (const address of addresses) {
      await sleep(0.5);
      Scraper.getTokenIdJSON(address, 0)
        .then((uri) => {
          console.log('uri --', address, uri, typeof uri);
          uri = getUriType(uri);

          console.log('uri -', uri);
          ContractAbi.upsertWithWhere(
            { address },
            { tokenUri: uri },
            (err, updated) => {
              if (err) {
                console.log('err', err);
                ContractAbi.upsertWithWhere(
                  { address },
                  { tokenUri: 'tokenUri but error' }
                );
              }
              if (updated) console.log('updated', updated.id);
            }
          );
        })
        .catch((err) => {
          console.log('gettokenidjson err', address, err);
          ContractAbi.upsertWithWhere(
            { address },
            { tokenUri: err?.message ? err.message : 'error existing token' }
          );
        });
    }
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

// { method, address, methodParams, saveParam }
const getWeb3 = async (params) => {
  // console.log('hola', params);

  const { ContractAbi } = app.models;
  const infura = new Infura();
  try {
    const contractAbi = await ContractAbi.findOne({
      where: {
        address: params.address,
        isJSON: true,
        // totalSupply: { gt: 0 },
      },
    });
    // if (!ERC721ABI[params.method]) return {}
    if (!contractAbi && !ERC721ABI.find(({ name }) => params.method === name))
      return;
    const abi = contractAbi ? contractAbi.abi : ERC721ABI;
    // console.log('hola', abi);
    if (!abi.find(({ name }) => params.method === name)) return {};

    // console.log('hola');
    return infura.get({
      method: params.method,
      address: params.address,
      methodParams: params.methodParams,
      abi,
    });
  } catch (error) {
    console.log('getweb3 err', error, params);
    throw error;
  }
};

const saveCollections = async () => {
  const { Collection } = app.models;

  const limit = 50000;
  let offset = 300;
  try {
    for (let i = 6500; i < limit; i += offset) {
      let baseUrl = `https://api.opensea.io/api/v1/collections?offset=${i}&limit=300`;
      await sleep(5);
      const { data } = await axios.get(baseUrl);
      console.log(data);
      for (const collection of data.collections) {
        console.log('collection.slug', collection.slug);
        Collection.upsertWithWhere(
          { slug: collection.slug },
          { osData: collection, slug: collection.slug },
          (err, col) => {
            if (err) console.log('err', err);
            if (col) console.log('col', col.id);
          }
        );
      }
    }
  } catch (error) {
    console.log('error', error);
  }
};

module.exports = {
  getAbi,
  saveAbis,
  saveSupply,
  getWeb3,
  saveTokensUri,
  saveCollections,
};
