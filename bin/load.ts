#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { Client } from '@elastic/elasticsearch';
const client = new Client({ node: 'http://localhost:9200' });

/**
 * Example call:
 *
 * `./bin/load.js --file=./top-100.json`
 */

const bail = err => {
  console.error(err);
  process.exit(1);
}

const filePath = process.argv.find(s => s.startsWith('--file='))?.replace('--file=', '');
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

if (!content || !content.assets || !content.assets!.length) {
  bail('Failed to read or parse valid JSON content');
}

const body = content!.assets!.flatMap(doc => [{ index: { _index: 'assets' } }, doc]);

client.bulk({ refresh: true, body }).then(console.log.bind(console, 'Done'));
