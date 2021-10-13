import { app, start } from './init';
import datasources from '../server/datasources';
import { Client } from '@elastic/elasticsearch';
import { respond } from './util';
const { es } = datasources;

const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const routes = [
  'assets',
  'collections',
  'match',
  'search',
  'score',
];

routes.forEach(name => require(`./endpoints/${name}`).default({ app, db }));

/**
 * Catch-all 404 to replace Express default handler
 */
app.get('/*', respond(() => ({
  status: 404,
  body: { msg: 'Not found' }
})));

start();
