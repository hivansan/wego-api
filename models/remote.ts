import { array, Decoded, nullable, number, object, string } from '@ailabs/ts-utils/dist/decoder';
import { match } from './util';
import Result from '@ailabs/ts-utils/dist/result';

export type Address = string;

export const openSea = object('OpenSeaNFT', {
  name: string,
  contractAddress: match<Address>(/^0x[a-f0-9]{40}$/),
  collection: object('OpenSeaCollection', {
    stats: object('Stats', {
      total_supply: number
    })
  }),
  description: string,
  image_original_url: string,
  image_preview_url: string,
  traits: nullable(array(Result.ok), [])
});

export const rarible = object('RaribleNFT', {
  owners: array(string)
});
