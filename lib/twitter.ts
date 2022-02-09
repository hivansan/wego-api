'use strict';

import axios from 'axios';
import { flatten, map, path, pipe, prop, splitEvery } from 'ramda';
import * as Query from './query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import dotenv from 'dotenv';

dotenv.config();
const baseURL = 'https://api.twitter.com/2';
const bearer_token = process.env.TWITTER_BEARER_TOKEN;

export default class TwitterUtils {

  private config = {
    headers: { Authorization: `Bearer ${bearer_token}` }
  };

  async getFollowersByUsernames() {
    const collections = await Query.find(db, 'collections', {
      'bool': {
        'must': [
          { 'exists': { 'field': 'twitter' } }
        ]
      }
    },
      { limit: 15000, source: ['slug', 'twitter'] })
      .then(pipe<any, any, any, any>(
        path(['body', 'hits', 'hits']),
        map(pipe(toResult, prop('value'))) as unknown as (v: any) => any[],
        async (collections) => {
          if (!collections?.length) return;
          return await Promise.all(splitEvery(100, collections).map(async chunk => {
            const usernames = chunk.map((collection: any) => collection.twitter).join(',');
            return await axios.get(
              baseURL + `/users/by?usernames=${usernames}&user.fields=public_metrics`,
              this.config
            )
              .then(result => result.data.data)
              .then(map((data: any) => {
                return {
                  ...collections.find(c => c.twitter.toLowerCase() == data.username.toLowerCase()),
                  twitter_users: data.public_metrics.followers_count
                }
              }))
              .catch(e => {
                console.log(e);
              });
          }))
        }))
      .then(flatten)
    return collections
  }
}

const main = async () => {
  const twitter = new TwitterUtils();
  console.log(await twitter.getFollowersByUsernames());
};
if (require.main === module) main();
