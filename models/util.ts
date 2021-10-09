/**
 * Utility functions to decode / parse values into specific types.
 */

import { Result } from '@ailabs/ts-utils';
import { pipe, tap } from 'ramda';
import { parse, string } from '@ailabs/ts-utils/dist/decoder';

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
