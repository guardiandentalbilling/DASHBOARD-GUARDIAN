// Centralized configuration loader for production/live mode
// Converts env vars into a structured config object with sane defaults
require('dotenv').config();

const bool = (v, def=false) => {
  if(v === undefined) return def;
  return ['1','true','yes','on'].includes(String(v).toLowerCase());
};

const num = (v, def) => {
  const n = parseInt(v,10);
  return isNaN(n)?def:n;
};

const cfg = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 5000),
  mongo: {
    uri: process.env.MONGO_URI,
    serverSelectionTimeoutMS: num(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 8000),
    connectTimeoutMS: num(process.env.MONGO_CONNECT_TIMEOUT_MS, 8000)
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),
    allowedOrigins: (process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),
    apiRateLimit: num(process.env.API_RATE_LIMIT, 100),
  },
  features: {
    allowDemoFallback: bool(process.env.ALLOW_DEMO_FALLBACK, false) // default off for live
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Basic validation for live mode
if(cfg.env === 'production'){
  const missing = [];
  if(!cfg.mongo.uri) missing.push('MONGO_URI');
  if(!cfg.security.jwtSecret || cfg.security.jwtSecret.length < 32) missing.push('JWT_SECRET(>=32 chars)');
  if(missing.length){
    console.error('[CONFIG] Missing required environment variables:', missing.join(', '));
    throw new Error('Refusing to start in production with missing critical env vars');
  }
}

module.exports = cfg;