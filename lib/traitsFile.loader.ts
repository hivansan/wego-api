#!/usr/bin/env node

import fs from 'fs'
import * as Query from './query'
import { db } from '../bootstrap';
import { sleep } from '../server/util';
import { toResult } from '../server/endpoints/util';
import { prop, tap } from 'ramda';
import { load } from '../scraper/scraper.utils';


const baseUrl = '/Users/ivanflores/Downloads/COMPLETE-JSONS';
const contractAddress = '0x4848a07744e46bb3ea93ad4933075a4fa47b1162';

const main = async () => {
  const jsonDir = fs.readdirSync(baseUrl);
  const count = jsonDir.length;
  const traitsCount: any = {};


  // Query.find(db, 'assets', { term: { 'slug.keyword': 'social-bees-university' } }, {
  //   limit: 10,
  //   // source: ['tokenId', 'updatedAt', 'traits', 'traitsCount', 'contractAddress']
  // })
  //   .then(({ body: { took, timed_out: timedOut, hits: { total, hits } } }: any) => ({
  //     body: hits.map(toResult).map(prop('value'))
  //   }))
  //   .then(tap(body => console.log(body)))
  // return


  for (const fileName of jsonDir) {
    const filePath = baseUrl + '/' + fileName;
    // console.log('fileName', fileName, filePath);
    try {

      let fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const jsonTraits = fileContent.attributes.map(t => ({ ...t, tmpKey: `${t.trait_type}${t.value}` }));
      for (const t of jsonTraits) traitsCount[t.tmpKey] = traitsCount[t.tmpKey] ? ++traitsCount[t.tmpKey] : 1;
    } catch (error) {
      console.log('this is not a json ---------------------------', fileName);
      console.log(error);
    }


  }


  const assets: any = [];

  for (const fileName of jsonDir) {
    try {
      const filePath = baseUrl + '/' + fileName;
      let fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const reducer = (acc: number, t: { trait_count: number }) => {
        const norm = t.trait_count / count;
        return norm ? acc + 1 / norm : acc;
      };
      const jsonTraits = fileContent.attributes.map(t => (
        {
          ...t,
          trait_count: traitsCount[`${t.trait_type}${t.value}`]
        }
      ));

      const tokenId = fileName.split('.')[0];

      const rarityScore = jsonTraits.length && count && jsonTraits.reduce(reducer, 0);
      const asset: any = { contractAddress, tokenId, traits: jsonTraits, rarityScore, traitsCount: jsonTraits.length } as any;
      assets.push(asset);
    } catch (error) {
      console.log('error', error);
    }

  }

  load(assets, 'assets', true);

};
if (require.main === module) main();
