#!/usr/bin/env node

import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import { clamp } from 'ramda';
import boonjiprojectAssets from '../data/boonjiproject-2.json';
import { collection as stats } from '../lib/stats';

const { es } = datasources;

const main = () => {
  const assets = boonjiprojectAssets as Array<any>;
  stats(assets.length, assets);
};

main();
export default main;
