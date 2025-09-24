const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const reqId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  req.reqId = reqId;

  logger.info({ reqId, method: req.method, url: req.url }, 'incoming request');

  res.on('finish', () => {
    const durNs = Number(process.hrtime.bigint() - start);
    const ms = Math.round(durNs / 1e6);
    logger.info({ reqId, method: req.method, url: req.url, status: res.statusCode, ms }, 'request complete');
  });

  next();
};
