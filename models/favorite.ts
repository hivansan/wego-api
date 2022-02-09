import { Decoded, nullable, object, string } from '@ailabs/ts-utils/dist/decoder';

import { match, toDate } from './util';

export type Address = string;

export type Favorite = Decoded<typeof favorite>;

export const favorite = object('Favorite', {
  slug: string,
  contractAddress: nullable(match<Address>(/^0x[a-f0-9]{40}$/)),
  tokenId: nullable(string),
  user: match<Address>(/^0x[a-f0-9]{40}$/),
  createdAt: nullable(toDate),
});