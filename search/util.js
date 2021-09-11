const { curry, evolve, pipe, trim } = require('ramda');

const toString = s => s + "";

const truncate = curry((length, suffix, val) => (
  (!val || val.length <= length)
    ? val
    : val.slice(0, length) + suffix
));

/**
 * Map an individual ElasticSearch hit to a search result response.
 */
const toResult = pipe(
  ({ _score: score, _source: value }) => ({
    meta: { score },
    value
  }),
  evolve({
    value: { description: pipe(toString, truncate(500, '...'), trim) }
  })
);

module.exports = { toString, truncate, toResult };
