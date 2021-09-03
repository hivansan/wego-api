'use strict';
const axios = require('axios');
const nftAddresses = require('../data/nft-addresses');
const qs = require('qs');

const getItem = (html) => '0x' + html.substr(0, 40);

const pages = 162;

const getList = async (page) => {
  console.log('page', `${page}/${pages}`);
  let url = `https://etherscan.io/tokens-nft?ps=100`;
  if (page) url += `&p=${page}`;
  let res = await axios.get(url);
  let html = res.data;

  let strings = html.split('/token/0x');
  strings.shift();
  // return console.log(strings);
  let items = [];
  for (const str of strings) items.push(getItem(str));
  // items = [...new Set(items)];
  // console.log(items);
  return items;
};

const getAllItems = async () => {
  const arr = [...Array(pages).keys()];
  let items = [];
  for (const i of arr) {
    items = [...items, ...(await getList(i + 1))];
  }
  items = [...new Set(items)];

  console.log(JSON.stringify(items));
  // console.log(items);
};

module.exports.postItems = async (adresses) => {
  const items = adresses ? adresses : nftAddresses;
  for (const address of items) {
    const data = qs.stringify({ address });
    const config = {
      method: 'post',
      url: 'http://localhost:3000/api/Scrapers/getAbi',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      data,
    };
    try {
      await sleep(0.2);
      const res = axios(config);
      // console.log('res', res?.data);
    } catch (error) {
      console.log(error);
    }
  }
};

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

// getAllItems()
