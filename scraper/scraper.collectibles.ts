import { filter, map } from 'ramda';

const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
const debug = true;
let collections: any[] = [];

const main = async () => {
  const browser = await puppeteer.launch({
    headless: !debug
  });
  const page = await browser.newPage();
  const url = "https://opensea.io/rankings?category=collectibles&chain=ethereum&sortBy=thirty_day_volume";
  let hasNextPage = true;
  await page.goto(url);
  await page.waitForSelector('.cf-browser-verification', { hidden: true });

  while (hasNextPage) {
    await page.waitForSelector('.Image--image');
    await (scrapePage(page));
    const btn_next = await page.$$('.Buttonreact__StyledButton-sc-glfma3-0');
    const lastPage = await (await btn_next[1].getProperty("disabled")).jsonValue();
    hasNextPage = !lastPage;
    if (hasNextPage) {
      await btn_next[1].click();
    }
  }
  console.log(collections);
  await browser.close();
};

async function scrapePage(page) {

  const scrollHeight = await page.evaluate('document.body.scrollHeight');
  let currentHeight = 0;
  const collections_temp: any[] = [];
  while (currentHeight < scrollHeight) {
    await page.evaluate('window.scrollBy(0, 200)');
    await page.$$eval("a", links => {
      return links.map(link => link.href)
    })
      .then(filter((link: any) => link.includes("https://opensea.io/collection/")))
      .then(map((slug: any) => {
        const _slug = slug.split("/").pop()
        if (!collections_temp[_slug]) {
          collections_temp[_slug] = {
            slug: _slug
          }
          return _slug;
        }
      }))
      .then(filter((slug: any) => slug !== undefined))
      .then(map((slug: any) => {
        collections.push(collections_temp[slug])
      }))
    currentHeight += 100;
  }
}

if (require.main === module) main();
