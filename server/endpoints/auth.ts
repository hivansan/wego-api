import express, { Express } from 'express';
import passport from 'passport';
import { isAdmin, SECRET } from '../../server/auth';
import { respond } from '../util';

export const meta = {};

export default ({ app, users }: { app: Express, users: string[] }) => {

  app.get(`/data/${SECRET}`, isAdmin({ users }), respond(() => ({ body: { paperTrailKey: process.env.PAPERTRAIL_KEY } })))
  app.use(`/files/${SECRET}`, isAdmin({ users }), express.static('./admin'));

  app.get('/admin', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/unauthorized' }), (req, res) => {
    res.send(`
      <script>
        Object.keys(localStorage).filter(s => s.match(/weGoAdmin/)).forEach(key => localStorage.removeItem(key))
        localStorage.weGoAdmin${SECRET} = 'true';
        setTimeout(() => window.location = '/', 100);
      </script>
    `);
  });

};
