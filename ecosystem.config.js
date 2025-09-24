// PM2 Ecosystem configuration for Guardian Dashboard
// Run with: pm2 start ecosystem.config.js --env production
// Docs: https://pm2.keymetrics.io/

module.exports = {
  apps: [
    {
      name: 'guardian-dashboard',
      cwd: './GuardianDashBaordAI',
      script: 'server.js',
      exec_mode: 'cluster',
      instances: 'max', // or a fixed number like 4
      max_memory_restart: '500M',
      node_args: '--enable-source-maps',
      // Load .env file variables (PM2 >= 5 supports dotenv)
      // If not supported on your PM2 version, ensure you `cp .env.example .env` and export manually in shell
      env_file: './GuardianDashBaordAI/.env',
      env: {
        NODE_ENV: 'development',
        ALLOW_DEMO_FALLBACK: 'true',
        API_RATE_LIMIT: '1000'
      },
      env_production: {
        NODE_ENV: 'production',
        ALLOW_DEMO_FALLBACK: 'false',
        API_RATE_LIMIT: '100',
        LOG_LEVEL: 'info'
      },
      out_file: './logs/guardian.out.log',
      error_file: './logs/guardian.err.log',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      watch: false,
      // Exclude large or unnecessary folders if watch is later enabled
      ignore_watch: ['node_modules', 'logs', 'uploads']
    }
  ]
};
