/**
 * Example:
 * npx ts-node scraper/scrape10k+.ts --file=scraper/collections-above-10k.json
 * npx ts-node scraper/scrape10k+.ts --collection=hyperdragons
 */

import axios from 'axios';
import queryString from 'query-string';

import { openseaAssetMapper, load, sleep } from './scraper.utils';
import fs from 'fs';
import * as AssetLoader from '../lib/asset-loader';
import { db } from '../bootstrap';
import { tap } from 'ramda';
import { saveAssetsFromUrl } from './scraper.assets';

const file: string = process.argv.find((s) => s.startsWith('--file='))?.replace('--file=', '') || '';
const collection: string = process.argv.find((s) => s.startsWith('--collection='))?.replace('--collection=', '') || '';

const MAX_IDS = 20;

const baseUrl = 'https://api.opensea.io/api/v1';

const getUrl = ({ contractAddress, firstId }: { contractAddress: string, firstId: number }) => {
  console.log(' first id ', firstId);
  const ids = new Array(MAX_IDS).fill(0).map((_, ix) => ix + firstId);
  const params = {
    asset_contract_address: contractAddress,
    token_ids: ids,
  }
  return `${baseUrl}/assets?${queryString.stringify(params)}`
}

AssetLoader.getCollection(db, collection)
  .then(async ({ body: collectionData }) => {
    for (const contractAddress of collectionData.contractAddresses) {
      let fetchAgain = true;
      let found = 0;
      while (fetchAgain) {
        try {
          console.log(`fetching with contractAddress ${contractAddress}`);
          const url = getUrl({ contractAddress, firstId: found + 1 })
          const assets: any = await saveAssetsFromUrl({ url, i: 0, factor: .3, slug: collection, collectionData })
          found += assets?.length;
          sleep(0.4);

          if (!assets?.length) fetchAgain = false;
        } catch (error) {
          console.log('error', error);
        }
      }
    }
  })
