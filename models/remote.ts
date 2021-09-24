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
  animation_original_url: string,
  description: string,
  image_original_url: string,
  image_preview_url: string,
  traits: nullable(array(Result.ok), [])
});

export const rarible = object('RaribleNFT', {
  owners: array(string)
});

export const openSeaCollectionStats = object('OpenSeaCollection', {
  name: string,
  image_url: string,
  collection: object('Collection', {
    slug: string,
    banner_image_url: string,
    stats: object('Stats', {
      one_day_volume: number,
      one_day_change: number,
      one_day_sales: number,
      one_day_average_price: number,
      seven_day_volume: number,
      seven_day_change: number,
      seven_day_sales: number,
      seven_day_average_price: number,
      thirty_day_volume: number,
      thirty_day_change: number,
      thirty_day_sales: number,
      thirty_day_average_price: number,
      total_volume: number,
      total_sales: number,
      total_supply: number,
      count: number,
      num_owners: number,
      average_price: number,
      num_reports: number,
      market_cap: number,
      floor_price: number,
    })
  })
});