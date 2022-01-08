#!/usr/bin/env node

import fs from 'fs'
import * as Query from './query'
import { db } from '../bootstrap';

const baseUrl = '/Users/ivanflores/Downloads/COMPLETE-JSONS';
const contractAddress = '0x4848a07744E46bb3eA93AD4933075a4Fa47b1162';

const main = async () => {
  const jsonDir = fs.readdirSync(baseUrl);
  const count = jsonDir.length;
  const traitsCount: any = {};

  for (const fileName of jsonDir) {
    const filePath = baseUrl + '/' + fileName;
    // console.log('fileName', fileName, filePath);
    let fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const jsonTraits = fileContent.attributes.map(t => ({ ...t, tmpKey: `${t.trait_type}${t.value}` }));

    for (const t of jsonTraits) traitsCount[t.tmpKey] = traitsCount[t.tmpKey] ? ++traitsCount[t.tmpKey] : 1;


  }


  for (const fileName of jsonDir) {
    const filePath = baseUrl + '/' + fileName;
    // console.log('fileName', fileName, filePath);
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

    const rarityScore = jsonTraits.length && count && jsonTraits.reduce(reducer, 0);
    const tokenId = fileName.split('.')[0];

    console.log(`${contractAddress}:${tokenId}`);
    console.log({ traits: jsonTraits, rarityScore });

    // Query.update(db, 'assets', `${contractAddress}:${tokenId}`, { traits: jsonTraits, rarityScore }, true)
    //   .catch(e => console.log(`[score update assets]`, e));


  }

};
if (require.main === module) main();
