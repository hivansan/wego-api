import { array, boolean, Decoded, inList, nullable, number, object, string } from '@ailabs/ts-utils/dist/decoder';
import { match, toDate } from './util';
import Result from '@ailabs/ts-utils/dist/result';

export type Address = string;

export const openSeaAsset = object('OpenSeaNFT', {
  name: nullable(string),
  // contractAddress: string,// match<Address>(/^0x[a-f0-9]{40}$/),
  collection: object('OpenSeaCollection', {
    slug: string,
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
      floor_price: nullable(number),
    })
  }),
  animation_original_url: nullable(string),
  description: nullable(string),
  image_original_url: nullable(string),
  image_preview_url: nullable(string),
  token_metadata: nullable(string),
  owner: Result.ok,
  traits: nullable(array(Result.ok), []),
  sell_orders: nullable(Result.ok, []),
  orders: nullable(Result.ok, []),
  last_sale: nullable(Result.ok),
});

export const rarible = object('RaribleNFT', {
  owners: nullable(array(string))
});

const assetContract = object('AssetContract', {
  address: string,
  asset_contract_type: string,
  created_date: string,
  name: string,
  nft_version: string,
  opensea_version: nullable(string, null),
  owner: nullable(number),
  schema_name: string,
  symbol: string,
  total_supply: nullable(string, null),
  description: string,
  external_link: string,
  image_url: string,
  default_to_fiat: nullable(boolean),
  dev_buyer_fee_basis_points: nullable(number),
  dev_seller_fee_basis_points: nullable(number),
  only_proxied_transfers: nullable(boolean),
  opensea_buyer_fee_basis_points: nullable(number),
  opensea_seller_fee_basis_points: nullable(number),
  buyer_fee_basis_points: nullable(number),
  seller_fee_basis_points: nullable(number),
  payout_address: string,
});



export const openSeaCollection = object('OpenSeaCollection', {
  collection: object('Collection', {
    slug: string,
    name: string,
    created_date: string,
    banner_image_url: nullable(string),
    image_url: nullable(string),
    large_image_url: nullable(string),
    twitter_username: nullable(string),
    discord_url: nullable(string),
    instagram_username: nullable(string),
    telegram_url: nullable(string),
    external_url: nullable(string),
    primary_asset_contracts: nullable(Result.ok),
    traits: nullable(Result.ok),
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
      floor_price: nullable(number),
    })
  })
});

export type OpenSeaEvent = Decoded<typeof openSeaEvent>;
export const openSeaEvent = object('OpenSeaEvent', {
  asset: object('EventAsset', {
    id: number,
    token_id: string,
    num_sales: number,
    token_metadata: nullable(string),
    top_bid: nullable(number),
    name: nullable(string),
    asset_contract: object('EventContract', {
      address: string,
      schema_name: string,
      created_date: string,
    }),
    collection: object('EventCollection', {
      name: string,
      slug: string,
    }),
    owner: nullable(object('openSeaUser', {
      address: string,
      profile_img_url: string,
      user: nullable(object('UserConfig', {
        username: nullable(string)
      }))
    }))
  }),
  created_date: Result.ok,// toDate,
  auction_type: nullable(inList(['english', 'dutch', 'min-price', null] as const)),
  total_price: nullable(string),
  bid_amount: nullable(string),
  payment_token: nullable(object('openSeaPaymentToken', {
    id: number,
    symbol: string,
    address: string,
    image_url: string,
    name: string,
    decimals: number,
    eth_price: string,
    usd_price: string,
  })),
  // winner_account: nullable(object('openSeaUser', {
  //   address: string,
  //   profile_img_url: string,
  //   user: nullable(object('UserConfig', {
  //     username: nullable(string)
  //   }))
  // })),
  listing_time: nullable(toDate),
  duration: nullable(string),
  starting_price: nullable(string),
  event_type: inList([
    'created',
    'successful',
    'cancelled',
    'offer_entered',
    'bid_entered',
    'bid_withdrawn',
    'transfer',
    'approve',
    'custom',
  ] as const)
});

export const openSeaUser = object('OpenSeaUser', {
  address: string,
  profile_img_url: string,
  user: nullable(object('UserConfig', {
    username: nullable(string)
  }))
})