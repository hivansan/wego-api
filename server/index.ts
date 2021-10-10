import { app, start } from './init';
import datasources from '../server/datasources';
import { Client } from '@elastic/elasticsearch';
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

start();
