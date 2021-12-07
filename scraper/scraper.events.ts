// import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import axios from 'axios';
import queryString from 'query-string';
// import { filter } from 'ramda';
import { sleep } from '../server/util';
import { openseaAssetMapper, cleanEntries, load } from './scraper.utils';

// import response from '../tmp/asset.events.json';
// const promiseRetry = require('promise-retry');

const dotenv = require('dotenv');
const BASE_URL = 'https://api.opensea.io/api/v1';
dotenv.config();

//  "... permitted: 'created', 'successful', 'cancelled', 'offer_entered', 'bid_entered', 'bid_withdrawn', 'transfer', 'approve', 'custom', 'payout'"
// this one will not work: payout

const limit: number = Number(process.argv.find((s) => s.startsWith('--limit='))?.replace('--limit=', '') || 300);
const tokenId: number = Number(process.argv.find((s) => s.startsWith('--tokenId='))?.replace('--tokenId=', ''));
const contractAddress: string | undefined = process.argv.find((s) => s.startsWith('--contractAddress='))?.replace('--contractAddress=', '');
const slug: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const eventType: string | undefined = process.argv.find((s) => s.startsWith('--eventType='))?.replace('--eventType=', '');

function bigMax(...nums: (string | number)[]) {
  return nums
    .filter((x: any) => !!x)
    .map(BigInt)
    .reduce((max, val) => (max > val ? max : val), BigInt(0));
}

const eventTypes = {
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
    let salePrice = event.total_price / 10 ** 18;
    asset.lastSalePrice = String(salePrice);
    asset.lastSalePriceUSD = asset.lastSalePrice * event.payment_token?.usd_price;
    asset.topBid = null;
    asset.lastSale = {
      asset: event.asset && {
        token_id: event.asset.token_id,
        decimals: event.asset.decimals,
      },
      asset_bundle: event.asset_bundle,
      event_type: event.event_type,
      event_timestamp: event.transaction.timestamp,
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

async function getEvents(step = 0) {
  if (step > 33) throw new Error('step must be less than or equal to 33');
  try {
    const params: { offset: number; limit: number, collection_slug?: string, asset_contract_address?: string, event_type?: string } = { offset: step * limit, limit, };
    if (slug) params.collection_slug = slug;
    if (contractAddress) params.asset_contract_address = contractAddress;
    if (eventType) params.event_type = eventType;
    console.log('params', params);

    const { data } = await axios.get(`${BASE_URL}/events?${queryString.stringify(params)}`, {
      headers: { Accept: 'application/json', 'X-API-KEY': process.env.OPENSEA_API_KEY },
    });
    return data;
  } catch (error) {
    throw error;
  }
}

const filters = [(asset: any) => asset.permalink.indexOf('/matic/') < 0, (asset: any) => asset.asset_contract.schema_name === 'ERC721'];
const checkFilter = (asset: any) => filters.reduce((acc, filter) => filter(asset) && acc, true);

const getAssetsFromEvents = (events: any) =>
  events.flatMap((event: any) => {
    const handler = eventTypes.getHandler(event.event_type);
    if (event.asset_bundle?.assets?.length) return event.asset_bundle.assets.filter(checkFilter).map(openseaAssetMapper);
    if (!checkFilter(event.asset)) return [];
    return handler(event, cleanEntries(openseaAssetMapper(event.asset)));
  });

/* UNCOMMENT IN PRODUCTION */
(async () => {
  let step = 0;
  do {
    getEvents(step)
      .then((events: any) => {
        step++;
        if (events.asset_events.length) {
          const assets = getAssetsFromEvents(events.asset_events);
          console.log(JSON.stringify(assets, null, 2));
          // return load(assets, 'assets', 'upsert');
        }
        return;
      });
    await sleep(1);
  } while (step < 33);
})();

// for testing a file
// (async () => {
//   const assets = getAssetsFromEvents(response.asset_events)
//     .map(({ traitsCount, ...rest }) => rest);
//   console.log('assets', assets);
//   return load(assets, 'assets', 'upsert'); // UNCOMMENT IN PRODUCTION
// })();