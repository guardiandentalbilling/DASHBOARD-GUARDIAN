const { init } = require('./app');
const config = require('./config/env');

init().then((app)=>{
  const port = config.port;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});