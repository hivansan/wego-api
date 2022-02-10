'use strict';

import axios from 'axios';
import { flatten, map, path, pipe, prop, tap } from 'ramda';
import * as Query from './query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import dotenv from 'dotenv';
import { load } from '../scraper/scraper.utils';

dotenv.config();
const baseURL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const main = async () =>
  Query.find(db, 'collections', {
    'bool': {
      'must': [
        { 'exists': { 'field': 'telegram' } }
      ]
    }
  },
    { limit: 5000, source: ['slug', 'telegram', 'stats'] })
    .then(pipe<any, any, any, any>(
      path(['body', 'hits', 'hits']),
      map(pipe(toResult, prop('value'))) as unknown as (v: any) => any[],
      (collections) => {
        if (!collections?.length) return;
        return Promise.all(collections.map(async collection => {
          const chat_id = collection.telegram.split('/').pop();

          return await axios.get(baseURL + `/getChatMembersCount?chat_id=@${chat_id}`)
            .then(prop('data'))
            .catch(e => {
              console.log(`[error axios telegram]`, `${e.response.data.error_code}-${e.response.data.description}`);
            })
            .then(telegramObj => {
              return {
                ...collection,
                stats: { ...collection.stats, telegram_users: telegramObj?.result || 0 }
              }
            })
        }))
      }))
    .then(flatten)
    .then(tap(collections => load(collections, 'collections', 'upsert')))


if (require.main === module) main();
