#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { Client } from '@elastic/elasticsearch';
const client = new Client({ node: 'http://localhost:9200' });

/**
 * Example call:
 *
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=./top-100.json --index=assets`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=./initial-collections.json --index=collections`
 */

const bail = err => {
  console.error(err);
  process.exit(1);
}

const filePath = process.argv.find(s => s.startsWith('--file='))?.replace('--file=', '');
const index: any = process.argv.find(s => s.startsWith('--index='))?.replace('--index=', '');
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

if (index == 'assets' && (!content || !content.assets || !content.assets!.length)) {
  bail('Failed to read or parse valid JSON content');
}

if (index == 'collections' && (!content || !content.collections || !content.collections!.length)) {
  bail('Failed to read or parse valid JSON content');
}

const body = content![index].flatMap(doc => [{ index: { _index: index } }, doc]) 

client.bulk({ refresh: true, body }).then(console.log.bind(console, 'Done'));
