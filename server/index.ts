import { app, start } from './init';
const { Client } = require('@elastic/elasticsearch')
import datasources from '../server/datasources';
const { es } = datasources;
import dotenv from 'dotenv';
dotenv.config();

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
