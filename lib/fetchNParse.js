const fetch = require('node-fetch');

async function fetchNParse(url) {
  return fetch(url).then((res) => res.json());
}

async function arrayFetch(urls) {
  return Promise.all(urls.map(fetchNParse));
}

module.exports.arrayFetch = arrayFetch;
module.exports.fetchNParse = fetchNParse;
