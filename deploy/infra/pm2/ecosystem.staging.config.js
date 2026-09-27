// Documents how the staging frontend PM2 process was started.
// Not currently used to launch the process (it was started with a direct
// `pm2 start npm --name ist-health-frontend-staging -- start` in
// /var/www/ist-health-frontend-staging), but running
// `pm2 start deploy/infra/pm2/ecosystem.staging.config.js` from that directory
// reproduces the same process if it's ever lost.
module.exports = {
  apps: [
    {
      name: 'ist-health-frontend-staging',
      cwd: '/var/www/ist-health-frontend-staging',
      script: 'npm',
      args: 'start',
      // .env.production in the cwd supplies PORT=3100, GNUHEALTH_HOST, etc.
      env: {},
    },
  ],
};
