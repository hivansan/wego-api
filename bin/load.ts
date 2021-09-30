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
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=assets.json --index=assets`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=assetTraits.json --index=asset_traits`
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=collections.json --index=collections`
 * 
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=data/assets.json --index=assets`
 * 
 *  curl localhost:3001/api/Traits > data/traits.json
 * `./node_modules/.bin/ts-node ./bin/load.ts --file=data/traits.json --index=traits`
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

// if (index == 'assets' && (!content || !content.assets || !content.assets!.length)) {
//   bail('Failed to read or parse valid JSON content');
// }

// if (index == 'collections' && (!content || !content.collections || !content.collections!.length)) {
//   bail('Failed to read or parse valid JSON content');
// }
// if (index == 'asset_traits' && (index = 'assetTraits') && (!content || !content.assetTraits || !content.assetTraits!.length)) {
//   bail('Failed to read or parse valid JSON content');
// }

if (!content.length){
  bail('Failed to read or parse valid JSON content');
}

console.log(`${index} length: ${content.length}`);

// content![index].flatMap((doc) => console.log(`${doc.asset_contract.address}:${doc.token_id}`, doc.slug, index));
const _id = (doc) => {
  if (index == 'collections') return doc.slug;
  if (index === 'assets') return `${doc.contractAddress}:${doc.tokenId}`;
  if (index === 'asset_traits') return `${doc.contractAddress}:${doc.traitType}:${doc.value.toLowerCase().split(' ').join('-')}`;
  if (index == 'traits') return `${doc.slug}:${doc.traitType}:${doc.value.toLowerCase().split(' ').join('-')}`;
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

  const body = content.flatMap((doc) => [
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
    const chop = maxChop(body);
    const result = await client.bulk({ refresh: true, body: chop });
    console.log(`result items: ${result.body?.items?.length} status code : ${result.statusCode}`);
    console.log(`${(ix/2 + result.body?.items?.length).toLocaleString()} objects done. ${body.length/2} left.`);
    ix += chop.length;
  }
}
load();
