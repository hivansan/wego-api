#!/usr/bin/env node

import fs from 'graceful-fs';
import {} from 'ramda';
import { load } from '../scraper/scraper.utils';

/**
 * Example call:
 * ./node_modules/.bin/ts-node ./bin/load-asset-chunks.ts --dir=./data/chunks --index=assets
 *
 * #stage
 * /home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/bin/load-asset-chunks.ts --dir=/home/ubuntu/partials --index=assets
 */

const bail = (err: any) => {
  console.error(err);
  process.exit(1);
};

// readPromise(dirPath, 'readdir').then((files: any) => {
//   // files.length = 4;
//   for (const file of files) {
//     readPromise(`./data/chunks/${file}`, 'readFile')
//     .then((content: any) => {
//       try {
//         content = JSON.parse(content);
//         load(content)
//       } catch (e) {
//         console.log(`[err] ${e}`);
//       }
//     }).catch(e => { console.log(`[err file promise] ${e}`)})
//   }
// }).catch(e => { console.log(`[err dir promise] ${e}`)});
const dirPath: any = process.argv.find((s) => s.startsWith('--dir='))?.replace('--dir=', '');
let index: any = process.argv.find((s) => s.startsWith('--index='))?.replace('--index=', '');

let content: any = null;

const dirFiles = fs.readdirSync(dirPath);

const run = async () => {
  for (const file of dirFiles) {
    content = JSON.parse(fs.readFileSync(`${dirPath}/${file}`).toString());
    await load(content, index);
  }
};

run();
