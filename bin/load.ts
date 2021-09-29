#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { Client } from '@elastic/elasticsearch';
const client = new Client({ node: 'http://localhost:9200', requestTimeout: 1000 * 60 * 60 });

/**
 * Example call:
 *
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=./data/top-100.json --index=assets`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=./data/initial-collections.json --index=collections`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=asset_mysql.json --index=assets`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=assetTrait_mysql.json --index=asset_traits`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=collection_mysql.json --index=collections`
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

if (index == 'assets' && (!content || !content.assets || !content.assets!.length)) {
  bail('Failed to read or parse valid JSON content');
}

if (index == 'collections' && (!content || !content.collections || !content.collections!.length)) {
  bail('Failed to read or parse valid JSON content');
}
if (index == 'asset_traits' && (index = 'assetTraits') && (!content || !content.assetTraits || !content.assetTraits!.length)) {
  bail('Failed to read or parse valid JSON content');
}

// content![index].flatMap((doc) => console.log(`${doc.asset_contract.address}:${doc.token_id}`, doc.slug, index));
const _id = (doc) => {
  if (index == 'collections') return doc.slug;
  else if (index === 'assets') return `${doc.contractAddress}:${doc.tokenId}`;
  else if (index === 'asset_traits') return `${doc.contractAddress}:${doc.traitType}:${doc.value.split(' ').reduce((acc, v) => acc + '_' + v, '')}`;
};

async function load() {
  let ix = 0;
  const maxChop = (array, step = 1_000) => {
    if (step % 2 != 0) throw new Error('step must be divisible by 2');
    let max = 1_000;
    while (Buffer.byteLength(JSON.stringify(array.slice(0, max + step))) * 8 < 200_000_000 && array.length > max) {
      max += step;
      // console.log(`max: ${max}`);
      // console.log(Buffer.byteLength(JSON.stringify(array.slice(0, max))) * 8);
    }
    return array.splice(0, max);
  };

  const body = content![index].flatMap((doc) => [
    {
      index: {
        _index: index,
        _type: '_doc',
        _id: _id(doc),
      },
    },
    doc,
  ]);

  while (body.length > 0) {
    let chop = maxChop(body);
    await client.bulk({ refresh: true, body: chop });
    ix += chop.length;
    console.log(`${ix.toLocaleString()} objects done. ${body.length} left.`);
  }
}
load();
