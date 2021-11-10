/**
 * Example:
 * npx ts-node scraper/scrape10k+.ts --file=scraper/collections-above-10k.json
 * npx ts-node scraper/scrape10k+.ts --collection=hyperdragons
 */

import axios from 'axios';
import { URLSearchParams } from 'url';
import { openseaAssetMapper, load, sleep } from './scraper.utils';
import fs from 'fs';

const file: string = process.argv.find((s) => s.startsWith('--file='))?.replace('--file=', '') || '';
const collection: string | undefined = process.argv.find((s) => s.startsWith('--collection='))?.replace('--collection=', '');

function consecutiveArray(min: number, size: number): Array<Number> {
  return new Array(size).fill(0).map((_, ix) => ix + min);
}

class Collection {
  public count: number;
  public found: number;
  public maxId: number;
  public slug: string;
  private constructor(slug: string, stats: any) {
    this.slug = slug;
    this.count = stats.count;
    this.found = 0;
    this.maxId = 0;
  }
  public static async build(slug: string): Promise<Collection> {
    let res = await axios.get(`https://api.opensea.io/api/v1/collection/${slug}/stats`);
    return new Collection(slug, res.data.stats);
  }
  public async fetchPacket() {
    const ids: Iterable<[string, string]> = consecutiveArray(this.maxId, 20).map((id) => ['token_ids', String(id)]);
    let params = new URLSearchParams([['collection', this.slug], ...ids]);
    let res = await axios.get('https://api.opensea.io/api/v1/assets?', { params });
    this.maxId += 20;
    this.found += res.data.assets.length;
    return res.data.assets.map(openseaAssetMapper);
  }
  public async fetchAll() {
    let fetchAgain = true;
    while (fetchAgain) {
      let packet = await this.fetchPacket();
      load(packet, 'assets');
      console.log(`fetched: ${this.found}`);
      sleep(0.3);
      if (packet.length == 0) fetchAgain = false;
    }
  }
}

(async () => {
  if (collection) {
    let c = await Collection.build(collection);
    await c.fetchAll();
    return;
  }
  let collections: Array<string> = await new Promise((res, rej) =>
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) rej(err);
      let obj = JSON.parse(data);
      res(obj);
    })
  );
  for (const collection of collections) {
    try {
      let c = await Collection.build(collection);
      await c.fetchAll();
    } catch (e) {
      console.log(`couldn't fetch ${collection}`);
    }
  }
  // console.log(rawdata);
})();
