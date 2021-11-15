import fs from 'fs';
import path from 'path';

import { app, start, socket, HOST } from './init';
import { respond } from './util';
import * as Auth from './auth';
import { db } from '../bootstrap';
import { MarketEvents, MarketEvent } from '../lib/market-events';

const admins = JSON.parse(fs.readFileSync('./admins.json').toString());
const events = new MarketEvents({ autoStart: true, history: 600, interval: 2 });

events.stream.on('data', (e: MarketEvent) => {
  /**
   * @TODO ADD DB INDEX AND SAVE EVENT
   */
  socket.broadcast(e);
});

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

routes.forEach(name => require(`./endpoints/${name}`).default({ app, db, admins }));

/**
 * Catch-all 404 to replace Express default handler
 */
app.get('/api/*', respond(() => ({
  status: 404,
  body: { msg: 'Not found' }
})));

/**
 * Serve the index page, React will handle it.
 */
app.get('*', (_, res) => res.sendFile(path.resolve(__dirname + '/../public/index.html')));


start();
