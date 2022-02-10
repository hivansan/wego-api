'use strict';

import axios from 'axios';
import { filter, flatten, map, path, pipe, prop, props, splitEvery, tap } from 'ramda';
import * as Query from './query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import dotenv from 'dotenv';
import { load } from '../scraper/scraper.utils';


dotenv.config();
const baseURL = 'https://api.twitter.com/2';
const bearer_token = process.env.TWITTER_BEARER_TOKEN;

const main = async () =>
  Query.find(db, 'collections', {
    'bool': {
      'must': [
        { 'exists': { 'field': 'twitter' } },
        // { 'match': { 'twitter.keyword': '@Worldreservebtc' } }
      ]
    }
  },
    { limit: 5000, source: ['slug', 'twitter', 'stats'] })
    .then(pipe<any, any, any, any>(
      path(['body', 'hits', 'hits']),
      map(pipe(toResult, prop('value'))) as unknown as (v: any) => any[],
      (collections) => {
        if (!collections?.length) return;
        return Promise.all(splitEvery(100, collections).map(chunk => {
          const usernames = chunk.map((collection: any) => collection.twitter.replace(/[^[A-Za-z0-9_]{1,15}/g, '')).join(',');

          return axios.get(
            baseURL + `/users/by?usernames=${usernames}&user.fields=public_metrics`,
            { headers: { Authorization: `Bearer ${bearer_token}` } }
          )
            .then(prop('data'))
            .then(props(['data', 'errors']))
            .then(flatten)
            .then(filter((user: any) => !!user))
            // .then(tap(x => console.log('x -------', x)))
            .then(map((twitterObj: any) => {
              const c = collections.find((c: { twitter: string; }) => c.twitter.replace(/[^[A-Za-z0-9_]{1,15}/g, '').toLowerCase() === ((twitterObj.username || twitterObj.value).toLowerCase()));
              return {
                ...c,
                stats: { ...c.stats, twitter_users: twitterObj.public_metrics?.followers_count || 0 }
              }
            }))
            .catch(e => {
              console.log(`[error axios twitter]`, e);
            });
        }))
      }))
    .then(flatten)
    .then(tap(collections => load(collections, 'collections', 'upsert')))

if (require.main === module) main();
