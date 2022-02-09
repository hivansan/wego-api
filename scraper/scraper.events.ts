// import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import axios from 'axios';
import queryString from 'query-string';
// import { filter } from 'ramda';
import { sleep } from '../server/util';
import { openseaAssetMapper, cleanEntries, load } from './scraper.utils';

// import response from '../tmp/asset.events.json';
// const promiseRetry = require('promise-retry');

import dotenv from 'dotenv';
import { eventTypes } from './event.utils';
import { OPENSEA_API } from '../lib/constants';
const BASE_URL = OPENSEA_API;
dotenv.config();

const limit: number = Number(process.argv.find((s) => s.startsWith('--limit='))?.replace('--limit=', '') || 300);
const tokenId: string | undefined = process.argv.find((s) => s.startsWith('--tokenId='))?.replace('--tokenId=', '');
const contractAddress: string | undefined = process.argv.find((s) => s.startsWith('--contractAddress='))?.replace('--contractAddress=', '');
const slug: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const eventType: string | undefined = process.argv.find((s) => s.startsWith('--eventType='))?.replace('--eventType=', '');

async function getEvents(step = 0) {
  if (step > 33) throw new Error('step must be less than or equal to 33');
  const params: {
    offset: number;
    limit: number;
    collection_slug?: string;
    asset_contract_address?: string;
    event_type?: string;
    token_id?: string
  } = { offset: step * limit, limit, };

  if (slug) params.collection_slug = slug;
  if (contractAddress) params.asset_contract_address = contractAddress;
  if (eventType) params.event_type = eventType;
  if (tokenId) params.token_id = tokenId;
  console.log('params', params);
  const url = `${BASE_URL}/events?${queryString.stringify(params)}`;
  try {
    const { data } = await axios.get(url, {
      headers: { Accept: 'application/json', 'X-API-KEY': process.env.OPENSEA_API_KEY },
    });
    return data;
  } catch (error) {
    console.log(`[url error] ${url}`);
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
          const assets = getAssetsFromEvents(events.asset_events).map(({ traitsCount, ...rest }) => rest);
          // console.log(JSON.stringify(assets, null, 2));
          load(assets, 'assets', 'upsert');
        } else {
          step = 33;
        }
      })
      .catch(e => console.log(`[event scraper error] ${e}`));
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