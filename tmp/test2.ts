#!/usr/bin/env node
/**
 * ES_CLIENT=https://localhost:9200 NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/ts-node ./scraper/test2.ts
 */
import axios from 'axios';


import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import { clamp, filter, map, pick, sort, tap } from 'ramda';
import * as AssetLoader from '../lib/asset-loader';
import * as scraper from '../scraper/scraper.assets';
import { error } from '../server/util';


const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const urls = [
  'http://localhost:3000/api/asset/0xdebbc3691d42090d899cafe0c4ed80897a7c9d6a/5669',
  'http://localhost:3000/api/asset/0xbe0d6bc297d85a41a75173932e9db9c19ddda523/707',
  'http://localhost:3000/api/asset/0xc6c817cd60e17fed0af2a759624e02dd6c812e64/4132',
  'http://localhost:3000/api/asset/0x4c102bb3eaa54a52c85d529786d0d4389f48dd99/113',
  'http://localhost:3000/api/asset/0xdb3b2e1f699caf230ee75bfbe7d97d70f81bc945/4663',
  'http://localhost:3000/api/asset/0xdb3b2e1f699caf230ee75bfbe7d97d70f81bc945/4827',
  'http://localhost:3000/api/asset/0xc5cecc420a1f2f78503671f562e1fe61036ff0e0/925',
  'http://localhost:3000/api/asset/0x990ee1df4c3047a4c94aac91a86be3c6bf40097d/9474',
  'http://localhost:3000/api/asset/0x5b85db25439b00e3e4f11d6f25a0abd3df871111/2858',
  'http://localhost:3000/api/asset/0xf80d8012aa753b30824dee28d6f098bcc2075965/68',
  'http://localhost:3000/api/asset/0xc045fb5b3ae934a7f95679852ee598d79f268114/4572',
  'http://localhost:3000/api/asset/0xc6c817cd60e17fed0af2a759624e02dd6c812e64/4133',
  'http://localhost:3000/api/asset/0xde6b458f72801f1b8f4e9186f17f27a201c5a18e/216',
  'http://localhost:3000/api/asset/0x549d38f104ac46d856c1b2bf2a20d170efdb2a8d/475',
  'http://localhost:3000/api/asset/matic/0xa5f1ea7df861952863df2e8d1312f7305dabf215/147894',
  'http://localhost:3000/api/asset/0x3d74450d135f16b6fa20c1211c6faef93ee73d7c/3165',
  'http://localhost:3000/api/asset/0xece4775b96c207cef81e054a3c607e9326d19d42/918',
  'http://localhost:3000/api/asset/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/104619251533950671817019147566682496067905389039642369300134829736420567941121',
  'http://localhost:3000/api/asset/0x5a297395c0b56d2d2adf2e41452970c065d30c32/117',
  'http://localhost:3000/api/asset/0x8204e56f1f517561f9090e769cadd0520d178305/75',
  'http://localhost:3000/api/asset/0x125ecab9fdc132cad4d6c055b9381aad60efaf3d/35',
  'http://localhost:3000/api/asset/0x3a4ca1c1bb243d299032753fdd75e8fec1f0d585/3447',
  'http://localhost:3000/api/asset/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/114226450737517925589651366457559162166763526741133697126959632068231773028353',
  'http://localhost:3000/api/asset/0xfc371329c00aec60aba3880987da602917d7e382/65',
  'http://localhost:3000/api/asset/0x9336888c4fc4adae3c7ced55be2b54884c052d59/544',
  'http://localhost:3000/api/asset/0x916758c4588d0614488f2c53ddc6c337a245d7d7/200036',
  'http://localhost:3000/api/asset/0xc045fb5b3ae934a7f95679852ee598d79f268114/3350',
  'http://localhost:3000/api/asset/0xd4d871419714b778ebec2e22c7c53572b573706e/9857',
  'http://localhost:3000/api/asset/0xf36446105ff682999a442b003f2224bcb3d82067/8755',
]

const apiUrl = 'http://localhost:3000/api'
const main = async () => {

  for (const url of urls) {
    try {
      let { data } = await axios(url)
      // console.log(data);
      console.log(data.rarityScoreRank, data.slug);

    } catch (error) {
      console.log(`[error] ${error}`);

    }
  }


}


main();
