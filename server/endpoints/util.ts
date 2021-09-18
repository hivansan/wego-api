import { curry, evolve, pipe, trim } from 'ramda';

export const toString = s => s + "";

export const truncate = curry((length: number, suffix: string, val: string) => (
  (!val || val.length <= length)
    ? val
    : val.slice(0, length) + suffix
));

/**
 * Map an individual ElasticSearch hit to a search result response.
 */
export const toResult = pipe(
  ({ _score: score, _source: value }) => ({
    meta: { score },
    value
  }),
  evolve({
    value: { description: pipe(toString, truncate(500, '...'), trim) }
  })
);
