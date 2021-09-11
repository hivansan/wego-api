'use strict';
const axios = require('axios');
const search = require('../../search');
const match = require('../../search/match');

module.exports = (app) => {
  const moment = require('moment');

  const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  app.get('/api/search', search());
  app.get('/api/match/:contract/:id', match());
};
