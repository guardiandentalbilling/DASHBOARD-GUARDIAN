const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse environment-based configuration early
const RAW_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '';
const PROD_ALLOWED_ORIGINS = RAW_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
const API_RATE_LIMIT_MAX = parseInt(process.env.API_RATE_LIMIT || (process.env.NODE_ENV === 'production' ? '100' : '1000'), 10);

const connectDB = async () => {
    try {
        // Try to connect to MongoDB
        let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_dashboard';
        
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected Successfully');
        global.mongoConnected = true;
        if (mongoose.connection.readyState === 1) {
            console.log('[DB] state=connected uri=' + mongoUri.replace(/:[^@]*@/, ':****@'));
        }
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        console.log('Starting server without database connection...');
        console.log('Note: API endpoints will work in demo mode');
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
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// CORS configuration
const DEV_FALLBACK_ALLOW = ['http://localhost:3000','http://localhost:5000','http://127.0.0.1:5000'];
if (process.env.NODE_ENV === 'production' && PROD_ALLOWED_ORIGINS.length === 0) {
    console.warn('[CORS] WARNING: No ALLOWED_ORIGINS configured in environment. All requests will be blocked except same-origin.');
}
const corsOptions = {
    origin: function(origin, callback){
        // Allow same-origin / server-to-server (no origin header)
        if(!origin){ return callback(null,true); }

        const isDev = process.env.NODE_ENV !== 'production';
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
console.log('[CORS] Mode:', process.env.NODE_ENV || 'development');
console.log('[CORS] Allowed (prod):', PROD_ALLOWED_ORIGINS);
console.log('[RATE_LIMIT] window=15m max=', API_RATE_LIMIT_MAX);

// Request correlation / basic diagnostics
app.use((req, res, next) => {
    req.reqId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    res.setHeader('X-Request-Id', req.reqId);
    console.log(`[REQ ${req.reqId}] ${req.method} ${req.url}`);
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[RES ${req.reqId}] ${res.statusCode} ${req.method} ${req.url} ${ms}ms`);
    });
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
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Gemini secure proxy (mounted early so available regardless of DB state)
app.use('/api/gemini', require('./backend/routes/geminiRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        port: PORT,
        mode: process.env.NODE_ENV || 'development',
        mongoConnected: global.mongoConnected || false
    });
});

// Debug endpoint to introspect request (development only)
if(process.env.NODE_ENV !== 'production'){
    app.get('/api/debug/env', (req,res)=>{
        res.json({
            time: new Date().toISOString(),
            originHeader: req.headers.origin || null,
            host: req.headers.host,
            mode: process.env.NODE_ENV || 'development',
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
        docs: 'Add documentation route here later',
        time: new Date().toISOString()
    });
});

// Mount API routes only after attempting DB connect. If DB is unavailable, mount demo-safe handlers
async function mountRoutesAndStart() {
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
    } else {
        console.warn('MongoDB not connected - mounting demo API handlers to keep UI available');
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

    const server = app.listen(PORT, () => {
        console.log(`Server is running on ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} mode on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('Process terminated');
            mongoose.connection.close();
        });
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received. Shutting down gracefully...');
        server.close(() => {
            console.log('Process terminated');
            mongoose.connection.close();
        });
    });
}

// Start mounting routes and server after initial DB connect attempt
connectDB().then(() => mountRoutesAndStart()).catch(err => {
    console.error('Failed during startup:', err);
    // ensure server still starts with demo handlers
    mountRoutesAndStart();
});

// Global safety nets (development resilience)
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED_REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT_EXCEPTION]', err);
});