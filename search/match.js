const { toResult } = require('./util');
const { pick } = require('ramda');

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' });

/**
 * List of fields to find similar assets by. Just search by traits for now.
 */
const matchFields = ['traits.trait_type', 'traits.value'];

module.exports = () => (
  async (req, res) => {
    const { query: { limit }, params: { id, contract } } = req;

    client.search({
      index: 'assets',
      from: 0,
      size: 1,
      body: {
        query: {
          constant_score: {
            filter: {
              bool: {
                must: [
                  { term: { id: parseInt(id, 10) } },
                  { term: { 'asset_contract.address': contract } }
                ]
              }
            }
          }
        }
      }
    })
      .then(({ body: { hits: { hits: toMatch } } }) => {
        if (!toMatch.length) {
          throw new Error('Asset search returned empty');
        }
        return client.search({
          index: 'assets',
          from: 0,
          size: Math.min(parseInt(limit, 10) || 10, 50),
          body: {
            query: {
              more_like_this: {
                fields: matchFields,
                like: [pick(['_id', '_index'], toMatch[0])]
              }
            }
          }
        });
      })
      .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }) => res.json({
        meta: { took, timedOut, total: total.value },
        results: hits.map(toResult)
      }))
      .catch(e => {
        console.error('[Asset Match]', e);
        res.status(404).json({ msg: 'Asset not found' })
      });
  }
);
