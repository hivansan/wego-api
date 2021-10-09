#!/usr/bin/env node
'use strict';

/**
 * Example usage:
 * `./node_modules/.bin/ts-node ./common/models/scraper.ts --exec=saveAssetsFromCollections --bots=6`
 */

import fs from 'fs';
import path from 'path';

import { Client } from '@elastic/elasticsearch';
import moment from 'moment';
import axios, { AxiosRequestConfig } from 'axios';
import torAxios from 'tor-axios';

import * as QuerySQL from '../../lib/query.mysql';
import { URLSearchParams } from 'url';
import { curry, fromPairs, map, pick, pipe, toString, prop, props, descend, sortBy, sortWith, tap, flatten, dropRepeats, forEachObjIndexed, forEach, ifElse, has, always, split } from 'ramda';
import { sleep } from '../../server/util';
const client = new Client({ node: 'http://localhost:9200', requestTimeout: 1000 * 60 * 60 });

const ports = [9050, 9052, 9053, 9054];

const bail = (err) => {
  console.error(err);
  process.exit(1);
};

const slugName: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');
const bots: any = process.argv.find((s) => s.startsWith('--bots='))?.replace('--bots=', '');
const errsToFile: any = process.argv.find((s) => s.startsWith('--errsToFile='))?.replace('--errsToFile=', '') || './data/errors-to.txt';
const errsFromFile: any = process.argv.find((s) => s.startsWith('--errsFromFile='))?.replace('--errsFromFile=', '') || './data/errors-from.txt';

const xForm = pipe(map(props(['trait_type', 'value'])), fromPairs as any);

const DAYS_WINDOW = 5;

const openseaAssetMapper = (asset: any) => ({
  tokenId: asset.token_id,
  contractAddress: asset.asset_contract.address,
  slug: asset.collection.slug,
  name: asset.name,
  owners: asset.owners,
  owner: asset.owner,
  description: asset.description, //  rariMeta.description,
  imageBig: asset.image_original_url, // rariMeta.image.url.BIG,
  imageSmall: asset.image_preview_url, // rariMeta.image.url.PREVIEW,
  animationUrl: asset.animation_url,
  traits: asset.traits,
  traitMap: xForm(asset.traits),
  //rariscore: https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c
  rariScore: asset?.traits?.length && asset.collection?.stats?.total_supply ? asset.traits.reduce((acc, t) => acc + 1 / (t.trait_count / asset.collection.stats.total_supply), 0) : null,
  tokenMetadata: asset.token_metadata,
  updatedAt: new Date(),
});

/**
 * maybe not used anymore
 */
export const saveAssetsFromCollection = async (slug?: string) => {
  try {
    // const { Collection, Asset } = Scraper.app.models;
    const collection = await QuerySQL.findOne(`select * from Collection where slug is not null and slug = '${slug}' and updatedAt < '${moment().subtract(DAYS_WINDOW, 'days').format('YYYY-MM-DD HH:mm:ss')}' limit 1`);

    const today = moment();
    const updatedDate = moment(collection.updatedAt);
    const shouldUpdate = !collection.updatedAt || today.diff(updatedDate, 'days') > 3;
    // assetsCount != null &&
    // collection.totalSupply &&
    // assetsCount < collection.totalSupply;

    console.log(`slug: ${slug} assetsCount: completed: ${!shouldUpdate}`);
    if (!shouldUpdate) {
      return;
    }

    let page = 0;
    let assets: Array<any> = [];
    const params: any = {
      collection: slug,
      offset: 0,
      limit: 50,
    };

    let queryParams: URLSearchParams, url: any;
    let results = { data: { assets: [1] } };
    while (results.data?.assets?.length && page < 201) {
      params.offset = page * params.limit;
      queryParams = new URLSearchParams(params); //.toString();
      url = `https://api.opensea.io/api/v1/assets?${queryParams}`;
      console.log(`page: ${page} slug: ${slug} offset: ${params.offset} results?.data?.assets.length: ${results?.data?.assets.length}`);
      console.log(`page: ${url}`);
      results = await axios(url);

      if (results?.data?.assets?.length) {
        console.log('results?.data?.assets?.length', results?.data?.assets?.length);
        assets = [...assets, ...results?.data?.assets];
        // scraperHelpers.saveAssets(results.data.assets);
        page++;
      }
    }

    fs.writeFile(`./data/${slug}.json`, JSON.stringify(assets.map(openseaAssetMapper)), (err) => {
      if (err) console.log(`[write file err] ${err}`);
    });
    QuerySQL.run(`update Collection set updatedAt = '${moment().format('YYYY-MM-DD HH:mm:ss')}' where slug = '${slug}'`);

    // return {}
  } catch (error) {
    // throw error;
    return;
  }
};

export const saveAssetsFromLinks = async (links: string[], i?: number): Promise<void> => {
  const tor = torAxios.torSetup({
    ip: 'localhost',
    port: i !== undefined ? ports[i] : 9050,
    controlPort: '9051',
    controlPassword: 't00r',
  });

  for (const url of links) {
    const prom = i !== undefined ? tor.get(url) : axios(url);
    await sleep(0.35);
    prom
      .then(({ data }) => ({
        assets: data.assets,
        slug: (url as any).split('&').find((s: string) => s.startsWith('collection=')).split('=')[1],
        offset: (url as any).split('&').find((s: string) => s.startsWith('offset=')).split('=')[1],
      }))
      // .then(tap((x) => console.log(x)))
      .then((body) => ({ ...body, filteredBySlug: links.filter((s) => s.includes(`collection=${body.slug}`)) }))
      .then(tap(({ assets, slug, offset }) => console.log(url, assets?.length, `-- ${i}`)))
      .then(({ assets, slug, offset, filteredBySlug }) => {
        if (assets?.length) {
          fs.writeFile(`./data/chunks/${slug}:${offset}.json`, JSON.stringify(assets.map(openseaAssetMapper)), (err) => {
            if (err) console.log(`[write file err] ${err}`);
          });

          const isLastUrlOfCollection = links.indexOf(url) == filteredBySlug.length - 1;
          console.log(`[${slug}]`, isLastUrlOfCollection, filteredBySlug.length - 1);

          if (isLastUrlOfCollection || 1 || assets.length < 50) {
            QuerySQL.run(`update Collection set updatedAt = '${moment().format('YYYY-MM-DD HH:mm:ss')}' where slug = '${slug}'`);
          }
        } else {
          QuerySQL.run(`update Collection set updatedAt = '${moment().format('YYYY-MM-DD HH:mm:ss')}' where slug = '${slug}'`);
        }
      })
      .catch((e) => {
        tor.torNewSession();
        console.log(`[err] ${e} ${url}`);
        fs.appendFile(errsToFile, `${url}\n`, (err) => {
          if (err) console.log(`[save 504 file error]`, err);
        });
      });
  }
};

const getLinks = (c: { totalSupply: number; slug: any }): string[] => [...Array(Math.ceil(c.totalSupply / 50)).keys()].map((i) => `https://api.opensea.io/api/v1/assets?limit=50&offset=${i * 50}&collection=${c.slug}`);

const topSupply = map((c) => ({ ...Object(c), totalSupply: Object(c).totalSupply > 10000 ? 10000 : Object(c).totalSupply }));
const toLinks = map((c): string[] => [...getLinks(Object(c))]);

const getSplices = (links: string[]): string[][] => {
  const len = Math.ceil(links.length / +bots);
  return [...Array(+bots).keys()].map((c, i) => links.splice(0, len));
};

const saveChunkFiles = (links: string[][]) => {
  for (const [index, value] of links.entries()) {
    fs.writeFile(`./data/links-chunks/${index}.json`, JSON.stringify(value), (err) => {
      if (err) console.log(`[write file err] ${err}`);
    });
  }
  return links;
};

const sort = sortBy(prop('totalSupply') as any);
const transformData = pipe(
  map(pick(['slug', 'totalSupply'])),
  sort,
  map(Object),
  topSupply,
  toLinks,
  flatten,
  dropRepeats,
  tap((x) => console.log(x)),
  getSplices
);

const distributeBots = (arrOfLinks: string[][]) => {
  for (const [i, links] of arrOfLinks.entries()) saveAssetsFromLinks(links, i);
};

export const saveAssetsFromCollections = () =>
  QuerySQL.find(`select * from Collection where updatedAt < '${moment().subtract(DAYS_WINDOW, 'days').format('YYYY-MM-DD HH:mm:ss')}';`)
    // .then(sortWith(descend(prop('totalSupply'))))
    .then(transformData)
    // .then(saveChunkFiles)
    // .then(tap((x) => console.log(x)))
    // .then(forEach(saveAssetsFromLinks))
    .then(distributeBots)
    .catch((e) => {
      console.error('[save assets from collections]', e);
    });

const readFilePromise = (path) =>
  new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) resolve(err);
      resolve(data);
    });
  });

const fromFile = () =>
  readFilePromise(errsFromFile)
    .then(toString)
    .then(split('\\n'))
    .then(getSplices)
    .then(distributeBots)
    .catch((e) => console.log(`[err] ${e}`));

if (exec) eval(`${exec}()`);
