import { difference, filter, map, objOf, path, pipe, prop, tap, uniq } from 'ramda';

import puppeteer from 'puppeteer-extra';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'puppeteer';

import * as Query from '../lib/query';
import { db } from '../bootstrap';
import { toResult } from '../server/endpoints/util';
import { load } from './scraper.utils';



puppeteer.use(StealthPlugin());
const debug = true;

const main = async () => {
  const browser = await puppeteer.launch({
    headless: !debug
  });
  const page = await browser.newPage();
  const url = 'https://opensea.io/rankings?category=collectibles&chain=ethereum&sortBy=thirty_day_volume';
  let hasNextPage = true;
  await page.goto(url);
  await page.waitForSelector('.cf-browser-verification', { hidden: true });

  while (hasNextPage) {
    await page.waitForSelector('.Image--image');
    const _slugs = await (scrapePage(page));
    // slugs = slugs.concat(_slugs)

    Query.find(db, 'collections', { terms: { _id: _slugs } }, { limit: _slugs.length, source: ['slug'] })
      .then(path(['body', 'hits', 'hits']) as any)
      .then(map(pipe(toResult, prop('value'))))
      .then(map(prop('slug')) as any)
      .then(difference(_slugs) as any)
      .then(map(objOf('slug')))
      .then(tap(newCollections => {
        // console.log('newCollections -------', newCollections)
        load(newCollections, 'collections', 'upsert')
      }))

    const btn_next = await page.$$('.Buttonreact__StyledButton-sc-glfma3-0');
    const lastPage = await (await btn_next[1].getProperty('disabled')).jsonValue();
    hasNextPage = !lastPage;
    if (hasNextPage) {
      await btn_next[1].click();
    }
  }

  await browser.close();
};

async function scrapePage(page: Page) {
  const scrollHeight = await page.evaluate('document.body.scrollHeight');
  let currentHeight = 0;
  let slugs = []
  while (currentHeight < scrollHeight) {
    await page.evaluate('window.scrollBy(0, 200)');

    await page.$$eval('a', urls => urls.map(url => url.href))
      .then(filter((url: any) => url.includes('https://opensea.io/collection/')))
      .then(map((url: any) => url.split('/').pop()))
      .then(filter((slug: any) => !!slug))
      .then(uniq)
      .then(tap((_slugs: any) => { slugs = slugs.concat(_slugs) }))

    currentHeight += 100;
  }

  return uniq(slugs);

}

if (require.main === module) main();
