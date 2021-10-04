import { app, start } from './init';
const { Client } = require('@elastic/elasticsearch')

const db = new Client({ node: 'http://localhost:9200' });

const routes = [
  'assets',
  'collections',
  'match',
  'search',
  'score',
];

routes.forEach(name => require(`./endpoints/${name}`).default({ app, db }));

start();
