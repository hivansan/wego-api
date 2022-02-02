import express, { Express } from 'express';
import passport from 'passport';
import { isAdmin, SECRET } from '../../server/auth';
import { error, respond } from '../util';
import jwt from 'jsonwebtoken';
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

  app.get('/api/user/isLogged', passport.authenticate('jwt', { session: false }),
    respond(req => ({ body: { isLogged: !!req.user } }))
  );
  // app.get('/api/user/isLogged', (req, res) =>
  //   passport.authenticate('jwt', (err, user) =>
  //     err
  //       ? res.status(401).send({ msg: 'Unauthorized' })
  //       : res.send({ body: { isLogged: !!user } })
  //   )(req, res)
  // );

  // app.post('/api/user/login', passport.authenticate('login'),
  //   respond((req) => req.user
  //     ? req.login(
  //       req.user,
  //       (err) => err
  //         ? error(401, 'Unauthorized')
  //         : Promise.resolve({ body: { token: jwt.sign({ user: req.user }, 'TOP_SECRET') } }))
  //     : error(401, 'Unauthorized'))
  // );

  app.post('/api/user/login', passport.authenticate('login'), (req, res) =>
    req.user
      ? req.login(req.user, { session: false }, (error) =>
        error
          ? res.status(401).send('Unauthorized')
          : res.send({ token: jwt.sign({ user: req.user }, 'TOP_SECRET') }))
      : res.status(401).send('Unauthorized')
  );

};
