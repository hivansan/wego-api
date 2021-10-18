import { always, anyPass, cond, converge, curry, equals, evolve, identity, is, map, mergeRight, pathSatisfies, pipe, reduce, toLower, trim } from 'ramda';

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
  ({ _score: score, _source: value, _index }) => ({
    meta: {
      score,
      index: _index,
    },
    value
  }),
  evolve({
    value: { description: pipe(toString, truncate(500, '...'), trim) }
  })
);

/**
 * Calculates an `isExact` value based on a case-insensitive match. Assumes `q` is lowercase.
 *
 * @TODO THIS DOES NOT WORK FOR TRAIT FIELDS (YET)
 */
export const isExact = curry(((fields: string[][], q: string, { meta, ...props }: any) => ({
  meta: {
    ...meta,
    isExact: !!(
      fields.length &&
      q &&
      fields.some(field => pathSatisfies(pipe(toString, toLower, equals(q)), field, props.value))
    )
  },
  ...props
})));

export const mapObject = curry((mapper, object) => {
  const keyMapper = (key) => ({
    [key]: cond([
      [is(Function), fn => fn(object)],
      [anyPass([is(String), is(Number), is(Boolean)]), identity],
      [always(true), converge(mapObject, [identity, always(object)])],
    ])(mapper[key]),
  });

  return pipe(Object.keys, map(keyMapper), reduce(mergeRight, {} as any))(mapper);
});
