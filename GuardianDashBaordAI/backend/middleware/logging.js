const winston = require('winston');

// Configure logging levels and formats
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'employee-dashboard' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: process.env.ERROR_LOG_FILE || 'logs/error.log', 
            level: 'error' 
        }),
        // Write all logs to combined.log
        new winston.transports.File({ 
            filename: process.env.LOG_FILE || 'logs/combined.log' 
        })
    ]
});

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Express middleware for request logging
const requestLogger = (req, res, next) => {
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    next(err);
};

module.exports = {
    logger,
    requestLogger,
    errorLogger
};