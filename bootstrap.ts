import { Client } from '@elastic/elasticsearch';

import datasources from './server/datasources';
const { es } = datasources;

export const db = new Client(es.configuration);
