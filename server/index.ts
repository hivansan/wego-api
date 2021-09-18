import { app, start } from './init';
const { Client } = require('@elastic/elasticsearch')

const db = new Client({ node: 'http://localhost:9200' });

const routes = [
  'assets',
  'match',
  'search'
];

routes.forEach(name => require(`./endpoints/${name}`)({ app, db }));

start();
