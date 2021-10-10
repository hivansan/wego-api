import { array, boolean, Decoded, nullable, number, object, string } from '@ailabs/ts-utils/dist/decoder';
import { match } from './util';
import Result from '@ailabs/ts-utils/dist/result';

export type Address = string;

export const openSea = object('OpenSeaNFT', {
  name: string,
  // contractAddress: string,// match<Address>(/^0x[a-f0-9]{40}$/),
  collection: object('OpenSeaCollection', {
    stats: object('Stats', {
      total_supply: number,
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
      count: number,
      num_owners: number,
      average_price: number,
      num_reports: number,
      market_cap: number,
      floor_price: number,
    })
  }),
  animation_original_url: nullable(string),
  description: nullable(string),
  image_original_url: string,
  image_preview_url: string,
  token_metadata: string,
  traits: nullable(array(Result.ok), []),
  
  // id: nullable(number),
  // token_id: nullable(string),
  // num_sales: nullable(number),
  // background_color: nullable(Object),
  // image_url: nullable(string),

  // image_thumbnail_url: nullable(string),

  // animation_url: nullable(Object),


  // external_link: nullable(Object),
  // asset_contract: nullable(Object),
  // permalink: nullable(string),

  // decimals: nullable(number),

  // owner: nullable(Object),
  // sell_orders: nullable(Object),
  // creator: nullable(Object),

  // last_sale: nullable(Object),
  // top_bid: nullable(Object),
  // listing_date: nullable(Object),
  // is_presale: nullable(boolean),
  // transfer_fee_payment_token: nullable(Object),
  // transfer_fee: nullable(Object),
  
});

export const rarible = object('RaribleNFT', {
  owners: array(string)
});

export const openSeaCollection = object('OpenSeaCollection', {
  collection: object('Collection', {
    slug: string,
    name: string,
    created_date: string,
    banner_image_url: string,
    image_url: string,
    large_image_url: string,
    twitter_username: nullable(string),
    discord_url: nullable(string),
    instagram_username: nullable(string),
    telegram_url: nullable(string),
    external_url: nullable(string),
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