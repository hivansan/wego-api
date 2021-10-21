import { Express, RequestHandler } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import { path } from 'ramda';

const FileStore = require('session-file-store')(session);

export const useSession: RequestHandler = (req, _, next) => {
  if (req.session && (req.session as any).passport && (req.session as any).passport.user) {
    try {
      (req.session as any).passport.user = JSON.parse((req.session as any).passport.user);
    } catch (e) { }
  }
  next();
};

export const isAdmin: (config: { users: string[] }) => RequestHandler = ({ users }) => (req, res, next) => {
  (users.includes(path(['session', 'passport', 'user', 'email'], req) + ""))
    ? next()
    : res.redirect('/unauthorized');
};

export const init = (app: Express, { callbackURL }: { callbackURL: string }) => {
  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new FileStore({ ttl: 36000 }),
    resave: false,
    saveUninitialized: false,
    secret: 'k3yboard-c4t!'
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_AUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
    callbackURL
  },
    (_accessToken, _refreshToken, { id, displayName, emails, photos }, cb) => {
      cb(null, {
        id,
        name: displayName!,
        email: emails![0]!.value,
        photo: photos![0]!.value
      });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, JSON.stringify(user))
  });

  passport.deserializeUser((user, done) => {
    if (user && typeof user === 'object') {
      return done(null, user);
    }
    try {
      done(null, JSON.parse(user as string))
    } catch (e) {
      done(e, null);
    }
  });
}