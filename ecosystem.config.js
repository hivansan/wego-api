'use strict';

module.exports = {
  apps: [
    {
      name: 'API',
      script: 'server/server.js',
      instances: 0,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './err.log',
      out_file: './out.log',
      log_file: './combined.log',
      merge_logs: true,
      time: true,
    },
  ],
  deploy: {
    // pm2 deploy ecosystem.config.js dev --force
    dev: {
      user: 'ubuntu',
      host: 'wego-api',
      ref: 'origin/master',
      repo: 'git@github.com:wegobattle/api.git',
      path: '/home/ubuntu/api',
      // 'pre-deploy-local':
      //   'scp /Users/ivanflores/Dropbox/_mmx-itg/e-commerce-itg/env/env-mdm-dev.txt leopardu:/home/ubuntu/api/mdm/current/.env',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production -i 0',
    },
    // pm2 deploy ecosystem.config.js prod --force
    prod: {
      user: 'ubuntu',
      host: 'wego-api',
      ref: 'origin/master',
      repo: 'git@github.com:wegobattle/api.git',
      path: '/home/ubuntu/api',
      // 'pre-deploy-local':
      //   'scp /Users/ivanflores/Dropbox/_mmx-itg/e-commerce-itg/env/env-mdm-prod.txt mondo:/home/ubuntu/api/mdm/current/.env',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production -i 0',
    },
  },
};
