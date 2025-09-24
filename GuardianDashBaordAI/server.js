#!/usr/bin/env nodeconst express = require('express');

const mongoose = require('mongoose');

/**const cors = require('cors');

 * Railway Entry Point - Redirects to src/server.jsconst path = require('path');

 * This file ensures Railway uses the correct server architectureconst helmet = require('helmet');

 */const compression = require('compression');

const rateLimit = require('express-rate-limit');

console.log('🚂 Railway entry point - loading src/server.js...');const morgan = require('morgan');

const config = require('./backend/config');

// Just require the actual serverconst logger = require('./backend/utils/logger');

require('./src/server.js');const requestLogger = require('./backend/middleware/requestLogger');

const app = express();
const PORT = config.port;

// Derived config
const PROD_ALLOWED_ORIGINS = config.security.allowedOrigins;
const API_RATE_LIMIT_MAX = config.security.apiRateLimit;

const connectDB = async () => {
    try {
        // Try to connect to MongoDB with shorter timeouts so platform doesn't kill cold start
    const mongoUri = config.mongo.uri || 'mongodb://localhost:27017/employee_dashboard';
    const serverSelectionTimeoutMS = config.mongo.serverSelectionTimeoutMS;
    const connectTimeoutMS = config.mongo.connectTimeoutMS;
        const startTs = Date.now();
        logger.info({ serverSelectionTimeoutMS, connectTimeoutMS }, 'attempting mongo connect');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS, connectTimeoutMS });
        const dur = Date.now() - startTs;
        logger.info({ durationMs: dur }, 'mongo connected successfully');
        global.mongoConnected = true;
        if (mongoose.connection.readyState === 1) {
            logger.info({ uri: mongoUri.replace(/:[^@]*@/, ':****@') }, 'mongo state=connected');
        }
    } catch (error) {
        logger.error({ err: error.message }, 'mongo connection failed');
        global.mongoConnected = false;
    }
};

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://kit.fontawesome.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// Rate limiting (configurable via env API_RATE_LIMIT)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: API_RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
// Keep morgan for now (can be removed later once pino HTTP transport added)
if (config.env === 'production') { app.use(morgan('combined')); } else { app.use(morgan('dev')); }

// Structured request logging
app.use(requestLogger);

// CORS configuration
const DEV_FALLBACK_ALLOW = ['http://localhost:3000','http://localhost:5000','http://127.0.0.1:5000'];
if (config.env === 'production' && PROD_ALLOWED_ORIGINS.length === 0) {
    console.warn('[CORS] WARNING: No ALLOWED_ORIGINS configured in environment. All requests will be blocked except same-origin.');
}
const corsOptions = {
    origin: function(origin, callback){
        // Allow same-origin / server-to-server (no origin header)
        if(!origin){ return callback(null,true); }

        const isDev = config.env !== 'production';
        if(isDev){
            if(origin === 'null' || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')){
                return callback(null,true);
            }
            if(DEV_FALLBACK_ALLOW.includes(origin)) return callback(null,true);
            console.warn('[CORS-DEV] Blocked origin:', origin);
            return callback(new Error('CORS blocked (dev) for origin: '+origin));
        }

        if(PROD_ALLOWED_ORIGINS.includes(origin)) return callback(null,true);
        console.warn('[CORS-PROD] Blocked origin:', origin, 'Allowed:', PROD_ALLOWED_ORIGINS);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((req,res,next)=>{ if(req.headers.origin) console.log('[ORIGIN]', req.headers.origin); next(); });
app.use(cors(corsOptions));
logger.info({ mode: config.env, allowedOrigins: PROD_ALLOWED_ORIGINS, rateLimitMax: API_RATE_LIMIT_MAX }, 'startup cors & rate limit config');

// Request correlation / basic diagnostics
app.use((req, res, next) => {
    req.reqId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    res.setHeader('X-Request-Id', req.reqId);
    // Request/response detail now handled by requestLogger; keep reqId set here for compatibility
    next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));
// Serve uploaded chat images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// Gemini secure proxy (mounted early so available regardless of DB state)
app.use('/api/gemini', require('./backend/routes/geminiRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        port: PORT,
        mode: config.env,
        mongoConnected: global.mongoConnected || false
    });
});

// Debug endpoint to introspect request (development only)
if(config.env !== 'production'){
    app.get('/api/debug/env', (req,res)=>{
        res.json({
            time: new Date().toISOString(),
            originHeader: req.headers.origin || null,
            host: req.headers.host,
            mode: config.env,
            mongoConnected: !!global.mongoConnected
        });
    });
}

// Route for admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Route for employee dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Basic health check (used by hosting platforms for uptime and build verification)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mongo: !!global.mongoConnected, time: new Date().toISOString() });
});

// Root route - provides simple info (prevents platform 404 page)
app.get('/', (req, res) => {
    res.json({
        app: 'Guardian Dashboard API',
        status: 'running',
        health: '/health',
        docs: '/api/docs',
        time: new Date().toISOString()
    });
});

// Mount API routes (can be called after DB connection attempt); if DB is unavailable, mount demo-safe handlers
function mountApiRoutes() {
    // Simple demo router generator
    const demoRouter = () => {
        const r = express.Router();
        // Generic demo responses for GET/POST so UI can continue working in demo mode
        r.get('*', (req, res) => res.json({ success: true, data: [] }));
        r.post('*', (req, res) => res.json({ success: true, data: {} }));
        r.put('*', (req, res) => res.json({ success: true, data: {} }));
        r.delete('*', (req, res) => res.json({ success: true, data: {} }));
        return r;
    };

    if (global.mongoConnected) {
        // Mount real API routes that use the DB
        app.use('/api/users', require('./backend/routes/userRoutes'));
        app.use('/api/employees', require('./backend/routes/employeeRoutes'));
        app.use('/api/loan-requests', require('./backend/routes/loanRoutes'));
        app.use('/api/leave-requests', require('./backend/routes/leaveRoutes'));
        app.use('/api/attendance', require('./backend/routes/attendanceRoutes'));
        app.use('/api/tasks', require('./backend/routes/taskRoutes'));
        app.use('/api/clients', require('./backend/routes/clientRoutes'));
        app.use('/api/expenses', require('./backend/routes/expenseRoutes'));
        app.use('/api/revenue', require('./backend/routes/revenueRoutes'));
    app.use('/api/time-tracking', require('./backend/routes/timeTrackingRoutes'));
    app.use('/api/chat', require('./backend/routes/chatRoutes'));
    } else if(config.features.allowDemoFallback) {
        console.warn('[DEMO-FALLBACK] Enabled and MongoDB not connected - mounting demo handlers. Disable ALLOW_DEMO_FALLBACK for full live enforcement.');
        app.use('/api/users', demoRouter());
        app.use('/api/employees', demoRouter());
        app.use('/api/loan-requests', demoRouter());
        app.use('/api/leave-requests', demoRouter());
        app.use('/api/attendance', demoRouter());
        app.use('/api/tasks', demoRouter());
        app.use('/api/clients', demoRouter());
        app.use('/api/expenses', demoRouter());
        app.use('/api/revenue', demoRouter());
    app.use('/api/time-tracking', demoRouter());
    app.use('/api/chat', demoRouter());
    } else {
        console.error('[FATAL] Database not connected and demo fallback disabled. Refusing to expose mutable API.');
        app.get('/api/*', (req,res)=>res.status(503).json({success:false,message:'Service Unavailable - database offline'}));
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ 
            msg: 'Something went wrong!',
            error: process.env.NODE_ENV === 'production' ? {} : err.message
        });
    });

    // 404 handler for unmatched routes
    app.use((req, res) => {
        // If client expects HTML, send index; else JSON
        if (req.accepts('html')) {
            res.status(404).sendFile(path.join(__dirname, '404.html'));
        } else {
            res.status(404).json({ msg: 'Route not found' });
        }
    });

}

// Export app for testing
async function init(startServer = true){
    await connectDB().catch(err => {
        logger.error({ err: err.message }, 'db connect async error');
    });
    try { mountApiRoutes(); } catch(e){ logger.fatal({ err: e }, 'failed to mount api routes'); }
    if(startServer){
        const server = app.listen(PORT, () => { logger.info({ port: PORT }, 'server listening'); });

        // Graceful shutdown handlers
        const shutdown = (signal) => {
            logger.warn({ signal }, 'shutdown signal received');
            server.close(() => {
                logger.info('server closed');
                mongoose.connection.close();
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    return app;
}

// Global safety nets
process.on('unhandledRejection', (reason) => { logger.error({ reason }, 'unhandled rejection'); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'uncaught exception'); });

if(require.main === module){
    init(true);
}

module.exports = { app, init };