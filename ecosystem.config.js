module.exports = {
  apps: [{
    name: 'API',
    script: './server/index.js',
    node_args: '-r dotenv/config',
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
  }]
}
