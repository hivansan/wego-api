'use strict';
const axios = require('axios');

module.exports = (app) => {
  const moment = require('moment');

  const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  app.get('/search', async (req, res) => {
    await sleep(2);

    res.json({
      q: req.query,
      exactMatch: {
        type: 'nft', // collection
        address: '0x123..',
        image: '',
      },
      nfts: [
        {
          tokenId: 'tokenId',
          address: 'address',
          image: 'image',
          name: 'name',
        },
      ],
      collecetions: [
        {
          tokenId: 'tokenId',
          image: 'image',
          name: 'name',
        },
      ],
    });
  });
};
