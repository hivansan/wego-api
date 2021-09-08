'use strict';
const axios = require('axios');
const app = require('../server');

module.exports = (app) => {
  const moment = require('moment');

  const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  app.get('/migrate', async (req, res) => {
    const { ContractAbi } = app.models;
    const contracts = await ContractAbi.find({
      where: { isJSON: true, abiMethod: null },
      fields: { id: true, abi: true, isJSON: true, abiMethod: true },
    });
    console.log('contracts', contracts.length);

    for (const contract of contracts) {
      const abiMethod = contract.abi.find(({ name }) =>
        ['tokenURI', 'uri'].includes(name)
      );
      if (abiMethod) {
        contract.updateAttributes(
          {
            abiMethod: abiMethod.name,
          },
          (err, updated) => {
            if (err) console.log('err --', err);
            if (updated) console.log('updated --', updated?.id);
          }
        );
      }
    }
    res.json({ hi: 'hi' });
  });
};
