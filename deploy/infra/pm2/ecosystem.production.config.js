// Documents how the production frontend PM2 process was started.
// Not currently used to launch the process (it was started with a direct
// `pm2 start npm --name ist-health-frontend -- start` in /var/www/ist-health-frontend),
// but running `pm2 start deploy/infra/pm2/ecosystem.production.config.js` from that
// directory reproduces the same process if it's ever lost.
module.exports = {
  apps: [
    {
      name: 'ist-health-frontend',
      cwd: '/var/www/ist-health-frontend',
      script: 'npm',
      args: 'start',
      // .env.production in the cwd supplies PORT, GNUHEALTH_HOST, etc.
      env: {},
    },
  ],
};
