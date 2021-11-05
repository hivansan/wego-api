import { Client } from '@elastic/elasticsearch';

import datasources from './server/datasources';
const { es } = datasources;

export const db = new Client({
  node: es.configuration.node || 'http://localhost:9200', ssl: {
    rejectUnauthorized: false,
  }
});
