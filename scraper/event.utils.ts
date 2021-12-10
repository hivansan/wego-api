import { cleanEntries } from './scraper.utils';

//  "... permitted: 'created', 'successful', 'cancelled', 'offer_entered', 'bid_entered', 'bid_withdrawn', 'transfer', 'approve', 'custom', 'payout'"
// this one will not work: payout

export const eventTypes = {
  /**
   * Takes a create event and update it in elastic search.
   * @param event create event from opensea
   */
  created(event: any, asset: any) {
    asset.topBid = event.auction_type === 'dutch' ? event.starting_price : 0;
    return asset;
  },

  /**
   * Takes a succesfull event and updates it's properties
   * @param event succesfull event
   * @param asset the asset whose properties will be updated
   */
  successful(event: any, asset: any) {
    //TODO: decimals
    const salePrice = event.total_price / 10 ** 18;
    asset.lastSalePrice = String(salePrice);
    asset.lastSalePriceUSD = asset.lastSalePrice * event.payment_token?.usd_price;
    asset.topBid = null;
    if (event.payment_token) {
      asset.currentPrice = event.total_price / 10 ** event.payment_token.decimals;
      asset.currentPriceUSD = asset.currentPrice * event.payment_token.usd_price;
    }

    asset.lastSale = {
      asset: event.asset && {
        token_id: event.asset.token_id,
        decimals: event.payment_token?.decimals ?? 0,
      },
      asset_bundle: event.asset_bundle,
      event_type: event.event_type,
      event_timestamp: event.created_date,
      auction_type: event.auction_type,
      total_price: event.total_price,
      payment_token: event.payment_token,
    };

    return cleanEntries(asset, (v: any) => v == v); // checking if there is any NaN instances
  },

  /**
   * Takes a cancelled event and updates it's properties
   * @param event the cancelled event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  cancelled(event: any, asset: any) {
    // asset.topBid = null;
    return asset;
  },

  /**
   * Takes a offer_entered event and updates it's properties
   * @param event the offer_entered event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  offer_entered(event: any, asset: any) {
    asset.topBid = bigMax(event.bid_amount, asset.topBid).toString();
    return asset;
  },

  /**
   * Takes a bid_entered event and updates it's properties
   * @param event the bid_entered event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  bid_entered(event: any, asset: any) {
    asset.topBid = bigMax(event.bid_amount, asset.topBid).toString();
    return asset;
  },

  /**
   * Takes a bid_withdrawn event and updates it's properties
   * @param event the bid_withdrawn event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  bid_withdrawn(event: any, asset: any) {
    return asset;
  },

  /**
   * Takes a transfer event and updates it's properties
   * @param event the transfer event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  transfer(event: any, asset: any) {
    //changed owner
    asset.owner = event.asset.owner;
    return asset;
  },

  /**
   * Takes a approve event and updates it's properties
   * @param event the approve event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  approve(event: any, asset: any) {
    return asset;
  },

  /**
   * Takes a custom event and updates it's properties
   * @param event the custom event
   * @param asset the asset whose properties will be updated
   * @returns {any}
   */
  custom(event: any, asset: any) {
    return asset;
  },

  /**
   * Gets the handler of a event given the type
   * @param key the name of the event
   * @returns a handler async funtion to handle said event
   */
  getHandler(key: string) {
    return this[key];
  },
};

function bigMax(...nums: (string | number)[]) {
  return nums
    .filter((x: any) => !!x)
    .map(BigInt)
    .reduce((max, val) => (max > val ? max : val), BigInt(0));
}