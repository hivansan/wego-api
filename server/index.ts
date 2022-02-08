import fs from 'fs';
import path from 'path';
import { toLower } from 'ramda';

import express from 'express';
import { app, start, socket, HOST } from './init';
import { respond } from './util';
import * as Auth from './auth';
import { db } from '../bootstrap';
import { MarketEvents, MarketEvent } from '../lib/market-events';
import * as traitsFile from '../lib/traitsFile.loader';
const adminsFilePath = process.env.ADMINS as string || './admins.json';
const admins = JSON.parse(fs.readFileSync(adminsFilePath).toString()).map(toLower);
if (process.env.DO_MARKETEVENTS === 'true') {
  const events = new MarketEvents({ autoStart: true, history: 600, timeWidow: 5, interval: 3 });
  events.stream.on('data', (e: MarketEvent) => {
    /**
     * @TODO ADD DB INDEX AND SAVE EVENT
     */
    socket.broadcast(e);
  });
}

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
  'favorites',
].map(name => require(`./endpoints/${name}`));

routes.forEach(route => route.default({ app, db, users: admins }));

/**
 * Catch-all 404 to replace Express default handler
 */
app.get('/api', respond(() => ({
  status: 200,
  body: {
    meta: {
      links: routes.reduce((all, route) => Object.assign(all, route.meta || {}), {})
    }
  }
})));

/**
 * Catch-all 404 to replace Express default handler
 */
app.get('/api/*', respond(() => ({
  status: 404,
  body: { msg: 'Not found' }
})));

/**
 * Serve public website
 */
app.use('/', express.static('./public'));

/**
 * Serve the index page, React will handle it.
 */
app.get('*', (_, res) => res.sendFile(path.resolve(__dirname + '/../public/index.html')));


start();
