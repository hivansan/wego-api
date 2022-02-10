import { Result } from '@ailabs/ts-utils';
import { Decoded, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';

import { toDate } from './util';

export type Address = string;

export type Historical = Decoded<typeof historical>;

export const historical = object('Historical', {
  index: string,
  id: string,
  slug: string,
  date: toDate,
  start: toDate, // possible
  end: nullable(toDate), // possible
  data: Result.ok,
});