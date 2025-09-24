const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name, fallback) {
  if (process.env[name] === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var ${name}`);
  }
  return process.env[name];
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwt: {
    secret: required('JWT_SECRET', 'replace_me'),
    expiresIn: process.env.JWT_EXPIRES || '8h'
  },
  mongo: {
    uri: required('MONGO_URI', 'mongodb://localhost:27017/guardian_dashboard')
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5000').split(',').map(s => s.trim()).filter(Boolean)
  },
  ai: {
    enabled: (process.env.AI_PROXY_ENABLED || 'true').toLowerCase() === 'true',
    geminiKey: process.env.GEMINI_API_KEY || null
  },
  currency: {
    base: process.env.CURRENCY_BASE || 'USD',
    target: process.env.CURRENCY_TARGET || 'PKR',
    rate: parseFloat(process.env.CURRENCY_RATE || '278.5')
  },
  timezone: process.env.TIMEZONE || 'America/New_York',
  payroll: {
    cacheTtlMs: parseInt(process.env.PAYROLL_CACHE_TTL_MS || '300000', 10)
  },
  overtime: {
    dailyHours: 8
  },
  limits: {
    maxLoan: parseFloat(process.env.MAX_LOAN_AMOUNT || '5000')
  }
};

module.exports = config;