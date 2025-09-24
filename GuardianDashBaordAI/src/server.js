const { init } = require('./app');
const config = require('./config/env');

init().then(()=>{
  const port = config.port;
  // eslint-disable-next-line no-console
  console.log(`API server listening on ${port}`);
}).catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});