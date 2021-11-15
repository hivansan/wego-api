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
      floor_price: number,
    })
  }),
  animation_original_url: nullable(string),
  description: nullable(string),
  image_original_url: nullable(string),
  image_preview_url: nullable(string),
  token_metadata: nullable(string),
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

export type OpenSeaEvent = Decoded<typeof openSeaEvent>;
export const openSeaEvent = object('OpenSeaEvent', {
  asset: object('EventAsset', {
    id: number,
    token_id: string,
    num_sales: number,
    name: nullable(string),
    asset_contract: object('EventContract', {
      address: string
    }),
    collection: object('EventCollection', {
      name: string,
      slug: string,
    }),
    owner: nullable(object('EventAssetOwner', {
      name: nullable(string),
    }))
  }),
  created_date: toDate,
  auction_type: inList(['english', 'dutch', 'min-price', null] as const),
  event_type: inList([
    'created',
    'successful',
    'cancelled',
    'offer_entered',
    'bid_entered',
    'bid_withdrawn',
    'transfer',
    'approve'
  ] as const)
});

export const openSeaUser = object('OpenSeaUser', {
  address: string,
  profile_img_url: string,
  user: nullable(object('UserConfig', {
    username: nullable(string)
  }))
})