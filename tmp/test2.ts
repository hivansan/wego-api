#!/usr/bin/env node
/**
 * ES_CLIENT=https://localhost:9200 NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/ts-node ./scraper/test2.ts
 */
import axios from 'axios';


import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import { clamp, filter, map, pick, sort, tap } from 'ramda';
import * as AssetLoader from '../lib/asset-loader';
import * as scraper from '../scraper/scraper.assets';
import { error } from '../server/util';


const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const collections = [
  "sorare",
  "ethermon",
  "axie",
  "marblecards",
  "crypto-stamp-edition-1",
  "enjin",
  "decentraland",
  "crypt-oink",
  "player-tokens",
  "flowers",
  "candydigital",
  "contract-servant",
  "gods-unchained-collectibles",
  "f1-delta-time",
  "hyperdragons",
  "nftboxes",
  "polychainmonsters",
  "superrare",
  "lostpoets",
  // "crypto-cannabinoid-genesis-series",
  "alpacacity",
  "avastar",
  "colonists",
  "adam-bomb-squad",
  "cryptoflowers-v3",
  "cryptotrunks",
  "ether-legends",
  "meebits",
  "word",
  "acclimatedmooncats",
  "cryptospells",
  "kingfrogs",
  "ethernity-master",
  "mutant-ape-yacht-club",
  "war-riders",
  "biblenft",
  "waifusion",
  "hashmasks",
  "impact-theory-founders-key",
  "hashflow-official",
  "roguesocietybot",
  "blootdoggsofficial",
  "cryptobeasties",
  "save-the-martians",
  "luckymaneki",
  "cyberkongz-vx",
  "thedreamers",
  "xy-coordinates",
  "thegoobers",
  "spacepoggers",
  "etherealswtf",
  "afrodroids-by-owo",
  "arabian-camels",
  "nft-dungeon-core",
  "monsterbuds",
  "gamecats",
  "habbo-avatars",
  "manekigang",
  "cryptodozer",
  "lootprints",
  "bastard-gan-punks-v2",
  "pymons",
  "wicked-hound-bone-club",
  "cryptofoxes-v2",
  "boonjiproject",
  "superlativesecretsociety",
  "the-moon-boyz",
  "blockchainbikers",
  "wooshiworld",
  "thewickedcraniums",
  "dragonereum",
  "ludwigs-lasting-legends",
  "stoner-cats-official",
  "cryptorastas-collection",
  "billionaireclubnft",
  "og-crystals",
  "lazy-lions-bungalows",
  "veefriends",
  "galaxy-fight-club",
  "animetas",
  "nftsiblings",
  "lazy-lions",
  "doobits",
  "missuniverseph",
  "supershibaclub",
  // "littledemonsclub",
  "frogsindisguise",
  "fuckintrolls",
  // "millionpoundape",
  "lonelyalienspaceclub",
  "supducks"
]

const apiUrl = 'http://localhost:3000/api'
const main = async () => {


  Promise.all(collections.map(c => AssetLoader.getCollection(db, c).then(({ body }) => body)))
    .then(scraper.countInDb)
    // .then(body )
    .then(filter((c: any) => (c.stats?.count - c.count) > 0 && (c.stats?.count - c.count) < 50 /* && c.slug == 'cryptofoxes-v2' */) as any)
    // .then(filter((c: any) => (c.stats?.count - c.count) > 0 && (c.stats?.count - c.count) < 50 /* && c.slug == 'cryptofoxes-v2' */) as any)
    // .then(filter((c: any) => (c.stats?.count > 12000)) as any)
    .then(map(pick(['slug', 'stats', 'count', 'ranked']) as any) as any)
    .then(tap(data => console.log(data)) as any)
    .then(collections => {
      for (const collection of collections) {
        // AssetLoader.fromDb(db, { limit: collection.stats.count, sort: [] }, collection.slug)
        //   .then((body) => (body === null ? error(404, 'Not found') : (body as any)))
        //   .then(({ body: { took, timed_out: timedOut, hits: { total, hits }, }, }) => ({
        //     body: hits.map(toResult).map((r: any) => r.value).map(pick(['tokenId'])).map((c: { tokenId: any; }) => +c.tokenId),
        //   }))

        //   .then(({ body }) => body.sort((a: number, b: number) => (a - b)))
        //   .then((tokenIds) => {

        //     for (let i = 0; i < tokenIds.length; i++) {
        //       const tokenId = tokenIds[i];
        //       if ((tokenIds[i + 1] - tokenId) > 2) console.log(tokenId)

        //     }
        //   })
      }
    })


}

const run = async () => {
  let res = await main();
  console.log(res);
}

run();

export default main;
