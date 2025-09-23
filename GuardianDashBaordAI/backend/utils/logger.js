const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', '*.password'],
    remove: true
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
