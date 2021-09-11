const { toResult } = require('./util');

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' });

/**
 * The list of fields within the asset data structure to search. The `^n` notation defines
 * the relative weight of each field withih the search. Here, `name` is given 3x importance, and
 * trait keys & values are given 4x importance, while collection description is given no weighting.
 *
 * This relates to how results are scored in search rankings, not necessarily whether results
 * show up in the search.
 */
const searchFields = [
  'name^3',
  'traits.trait_type^4',
  'traits.value^4',
  'description^2',
  'collection.description'
];

module.exports = () => async (req, res) => {
  const { q, limit } = req.query;

  const query = !q ? {} : {
    body: {
      query: {
        multi_match: {
          query: q,
          fuzziness: 6,
          fields: searchFields
        }
      }
    }
  };

  client.search({
    index: 'assets',
    from: 0,
    /**
     * Default to 10 results, limit max result size to 50.
     */
    size: Math.min(parseInt(limit, 10) || 10, 50),
    ...query
  })
    .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => {
      res.json({
        meta: { q, took, timedOut, total: total.value },
        results: hits.map(toResult)
      });
    })
    .catch(e => {
      console.error('[Bad Query]', q, e);
      res.status(400).json({ msg: 'Bad query' });
    });
};
