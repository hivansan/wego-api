import { Express } from 'express';
import passport from 'passport';

export default ({ app }: { app: Express }) => {

  app.get('/admin', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/unauthorized' }), (req, res) => {
    res.send(`
      <script>
        localStorage.weGoAdmin = 'true';
        setTimeout(() => window.location = '/', 100);
      </script>
    `);
  });

};
