'use strict';

import fs from 'fs';
import path from 'path';

import { Client } from '@elastic/elasticsearch';
import moment from 'moment';
import axios, { AxiosRequestConfig } from 'axios';

import * as QuerySQL from '../../lib/query.mysql';
import { URLSearchParams } from 'url';
import { curry, fromPairs, map, pick, pipe, prop, props, descend, sortBy, sortWith } from 'ramda';
const client = new Client({ node: 'http://localhost:9200', requestTimeout: 1000 * 60 * 60 });

const bail = (err) => {
  console.error(err);
  process.exit(1);
};

const slugName: string | undefined = process.argv.find((s) => s.startsWith('--slug='))?.replace('--slug=', '');
const exec: string | undefined = process.argv.find((s) => s.startsWith('--exec='))?.replace('--exec=', '');

const xForm = pipe(
  map(props(['trait_type', 'value'])),
  fromPairs as any
)

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
  rariScore:
    asset?.traits?.length && asset.collection?.stats?.total_supply
      ? asset.traits.reduce(
          (acc, t) =>
            acc + 1 / (t.trait_count / asset.collection.stats.total_supply),
          0
        )
      : null,
  tokenMetadata: asset.token_metadata,
  updatedAt: new Date(),
});


export const saveAssetsFromCollection = async (slug?: string) => {
  try {
    // const { Collection, Asset } = Scraper.app.models;
    const collection = await QuerySQL.findOne(`select * from Collection where slug is not null and slug = '${slug}' and updatedAt < '${moment().subtract(3, "days").format("YYYY-MM-DD HH:mm:ss")}' limit 1`)

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
        console.log('results?.data?.assets?.length',results?.data?.assets?.length);
        assets = [...assets, ...results?.data?.assets];
        // scraperHelpers.saveAssets(results.data.assets);
        page++;
      }
    }

    // console.log(JSON.stringify(assets.map(openseaAssetMapper)));
    // writeFilePromisse(`./data/${slug}.json`, 'JSON.stringify(assets.map(openseaAssetMapper))');
    fs.writeFile(`./data/${slug}.json`, JSON.stringify(assets.map(openseaAssetMapper)), (err) => {
      if (err) console.log(`[write file err] ${err}`);
    });
    QuerySQL.run(`update Collection set updatedAt = '${moment().format("YYYY-MM-DD HH:mm:ss")}' where slug = '${slug}'`)

    return {}
  } catch (error) {
    // throw error;
    return
  }
};

export const saveAssetsFromCollections = () =>
  QuerySQL.find(`select * from Collection where updatedAt < '${moment().subtract(3, "days").format("YYYY-MM-DD HH:mm:ss")}';`)
    // .then(map(Object))
    // .then(sortWith(descend(prop('totalSupply'))))
    .then(map(pick(['slug', 'totalSupply'])))
    .then(sortBy(prop('totalSupply')))
    .then(collections => collections.reverse())
    .then(async (collections: any) => {      
      for (const collection of collections) {
        console.log(`working on ${collection.slug} colle totalsupply: ${collection.totalSupply}`);
        await saveAssetsFromCollection(collection.slug)
      }
    })
    // for mass
    // .then(collections => Promise.all(collections.map(pipe(prop('slug'), saveAssetsFromCollection))))
    .catch(e => {
      console.error('[save assets from collections]', e);
    });


