/**
 * These should probably come from environment variables
 */
export const INFURA_PUBLICKEY = 'b111d8f387c847039541e29435e06cd2'; // DIGITAL HEDGE 'c5e5cb06445c43c2b0305c12450cc0b5'
export const ETHERSCAN_PUBLICKEY = 'DMYUZ4DSVG9J6C65PM2UZNMUPUKVSN5DZQ'; // DIGITAL HEDGE 'c5e5cb06445c43c2b0305c12450cc0b5'
export const ADMIN_ADDRESS = '0xEd27E5c6CFc27b0b244c1fB6f9AE076c3eb7C10B'; // DIGITAL HEDGE 'c5e5cb06445c43c2b0305c12450cc0b5'

export const COLLECTION_SORTS = [
  'floorPrice',
  'wegoScore',
  'totalSupply',
  'oneDayVolume',
  'oneDayChange',
  'oneDaySales',
  'oneDayAveragePrice',
  'sevenDayVolume',
  'sevenDayChange',
  'sevenDaySales',
  'sevenDayAveragePrice',
  'thirtyDayVolume',
  'thirtyDayChange',
  'thirtyDaySales',
  'thirtyDayAveragePrice',
  'totalVolume',
  'totalSales',
  'count',
  'numOwners',
  'averagePrice',
  'numReports',
  'marketCap',
  'id',
  'featuredCollection',
] as const;

export const MIN_TOTAL_VOLUME_COLLECTIONS_ETH = 50;
export const MAX_TOTAL_SUPPLY = 25000;

export const WEB3_PROVIDER = `https://mainnet.infura.io/v3/${INFURA_PUBLICKEY}`;