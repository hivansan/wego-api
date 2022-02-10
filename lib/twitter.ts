'use strict';

import axios from 'axios';
import { flatten, map, path, pipe, prop, splitEvery, tap } from 'ramda';
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
        // { 'match': { 'twitter.keyword': '_sangokushi' } }
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
            .then((result: any) => result.data.data)
            .then(map((data: any) => {
              const c = collections.find(c => c.twitter.toLowerCase() == data.username.toLowerCase());
              return {
                ...c,
                stats: { ...c.stats, twitter_users: data.public_metrics.followers_count }
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
