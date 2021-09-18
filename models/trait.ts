import { Decoded, nullable, number, object, string } from '@ailabs/ts-utils/dist/decoder';

/**
 * This is a decoder. It is a higher-order function into which we can pass a generic JS value and get
 * back a value that is guaranteed to be type-safe. The value is wrapped in a `Result` object, which
 * models the fact that decoding operations can succeed or fail. You can read more about decoders and
 * how to use them here: https://github.com/ai-labs-team/ts-utils#result
 */
export const trait = object('Trait', {
  traitType: string,
  value: string,
  displayType: nullable(string),
  maxValue: nullable(string),
  traitCount: number,
  order: nullable(string)
});

/**
 * Through the magic of TypeScript's [`typeof`](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
 * and [`infer`](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) operators, we can actually
 * _derive_ a type definition from a decoder function. This lets us avoid the redundancy and potential conflict of
 * manually writing out a separate type definition.
 */
export type Trait = Decoded<typeof trait>;
