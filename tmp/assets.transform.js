const hits = require('/Users/ivanflores/Desktop/cryptopunks.json');

const sources = hits.hits.hits;
const assets = sources.map(({ _source }) => _source);
console.log(JSON.stringify(assets, null, 2));
