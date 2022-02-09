'use strict';

import axios from 'axios';
import { any, flatten, map, path, pipe, prop } from 'ramda';
import * as Query from './query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import dotenv from 'dotenv';

dotenv.config();
const baseURL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export default class TelegramUtils {

  async getUsersByChannel() {
    const collections = await Query.find(db, 'collections', {
      'bool': {
        'must': [
          { 'exists': { 'field': 'telegram' } }
        ]
      }
    },
      { limit: 15000, source: ['slug', 'telegram'] })
      .then(pipe<any, any, any, any>(
        path(['body', 'hits', 'hits']),
        map(pipe(toResult, prop('value'))) as unknown as (v: any) => any[],
        async (collections) => {
          if (!collections?.length) return;
          return Promise.all(collections.map(async collection => {
            const chat_id = collection.telegram.split('/').pop();
            const telegramRes = await axios.get(baseURL + `/getChatMembersCount?chat_id=@${chat_id}`)
              .then(result => result.data)
            return {
              ...collection,
              telegram_users: telegramRes.result
            }
          }))
        }
      ))
      .catch(e => {
        console.log(e);
      });
    return collections;
  }
}

const main = async () => {
  const telegram = new TelegramUtils();
  console.log(await telegram.getUsersByChannel());
};
if (require.main === module) main();
