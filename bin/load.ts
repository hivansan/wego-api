#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import datasources from '../server/datasources';
const { es } = datasources;
import { Client } from '@elastic/elasticsearch';
import { load } from '../scraper/scraper.utils';
const client = new Client({ node: es.configuration.node, requestTimeout: 1000 * 60 * 60 });

/**
 * Example call:
 *
 * `npx ts-node ./bin/load.ts --file=./data/top-100.json --index=assets`
 * `npx ts-node ./bin/load.ts --file=./data/initial-collections.json --index=collections`
 * `npx ts-node ./bin/load.ts --file=./data/assets.json --index=assets`
 * `npx ts-node ./bin/load.ts --file=./data/traits.json --index=asset_traits`
 * `npx ts-node ./bin/load.ts --file=./data/collections.json --index=collections`
 *
 * `npx ts-node ./bin/load.ts --file=./data/assets.json --index=assets`
 *
 * `npx ts-node ./bin/load.ts --file=./data/traits.json --index=traits`
 *
 * stage:
 * /home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/bin/load.ts --file=/home/ubuntu/api/current/data/initial-collections.json --index=collections
 */

const bail = (err) => {
  console.error(err);
  process.exit(1);
};

const filePath = process.argv.find((s) => s.startsWith('--file='))?.replace('--file=', '');
let index: any = process.argv.find((s) => s.startsWith('--index='))?.replace('--index=', '');
const resolvedPath = filePath && path.resolve(__dirname, '..', filePath);

if (!filePath) {
  bail('No file specified, use `--file=` to import, or path was unresolved');
}
if (!fs.existsSync(resolvedPath!)) {
  bail(`Path ${resolvedPath} from arg ${filePath} doesn't exist or couldn't be read`);
}

let content: any = null;

try {
  content = JSON.parse(fs.readFileSync(path.resolve(filePath!)).toString());
} catch (e) {
  bail(`Something bad happened while trying to import: ${e.message}`);
}

if (!content.length) {
  bail('Failed to read or parse valid JSON content');
}

console.log(`${index} length: ${content.length}`);

load(content, index);