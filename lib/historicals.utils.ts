#!/usr/bin/env node

/**
 * Example usage:
 * npx ts-node scraper/scraper.collections.ts
 */

import { sleep } from '../server/util';
import * as Query from '../lib/query';
import { toResult } from '../server/endpoints/util';
import * as AssetLoader from '../lib/asset-loader';
import { db } from '../bootstrap';
import moment from 'moment';


export const load = <Doc>(doc: Doc | Doc[]) =>
  Query.create(db, 'historicals', doc)
