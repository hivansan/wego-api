import { app, start, HOST } from './init';
import datasources from '../server/datasources';
import { Client } from '@elastic/elasticsearch';
import { respond } from './util';
import * as Auth from './auth';
const { es } = datasources;

const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

Auth.init(app, {
  callbackURL: `${HOST}/auth/google/callback`
});

const routes = [
  'auth',
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
app.get('/api/*', respond(() => ({
  status: 404,
  body: { msg: 'Not found' }
})));

/**
 * Maybe do a real 404 page sometime
 */
app.get('*', (_, res) => res.redirect('/'));

start();
