/**
 * Utility functions to decode / parse values into specific types.
 */

import { Result } from '@ailabs/ts-utils';
import { curry, mergeRight, pipe, prop, tap } from 'ramda';
import { parse, string } from '@ailabs/ts-utils/dist/decoder';
import { Trait } from './asset';

export const date = (val: string): Result<Error, Date> => (
  isNaN(Date.parse(val))
    ? Result.err(new Error('[Valid date]'))
    : Result.ok(new Date(val))
);

export const toInt: (val: any) => Result<Error, number> = pipe(
  string,
  Result.map(v => parseInt(v, 10))
);

export const toDate: (val: any) => Result<Error, Date> = pipe(
  string,
  parse<Error, string, Date>(date)
);

export const match = <T extends string>(pattern: RegExp) => pipe(
  string,
  parse<Error, string, T>((val: string) => (
    pattern.test(val)
      ? Result.ok(val)
      : Result.err(new Error('Value does not match pattern'))
  ) as Result<Error, T>)
);

export const buildObject = <T extends object, K extends keyof T, R, Val extends object>(
  mappers: { [Key in K]: (val: Val) => R }
) => (obj: Val): { [Key in K]: R } => (
  (Object.keys(mappers) as K[])
    .map(key => ({ [key]: mappers[key](obj) }))
    .reduce(mergeRight, {}) as { [Key in K]: R }
);

export const addProps = <T extends object, U extends object>(fn: (obj: T) => U) => (obj: T) => mergeRight(obj, fn(obj));

export const maybe = curry(<Val, New>(fn: (val: Val) => New, val: Val | null): New | null => (
  val === undefined || val === null ? null : fn(val)
));

export const orElse = curry(<Val, New>(fn: () => New, val: Val): Val | New => (
  val === undefined || val === null ? fn() : val
));

export const flattenTraits = (traits: Trait[]) => traits.map((t: Trait) => `${t.trait_type}:${t.value}`);