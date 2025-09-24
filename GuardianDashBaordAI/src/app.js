const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const config = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: (origin, cb)=> {
  if(!origin) return cb(null,true);
  if(config.cors.allowedOrigins.includes(origin)) return cb(null,true);
  return cb(new Error('CORS blocked'), false);
}}));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
app.use('/api/auth', limiter);

app.get('/health', (req,res)=> res.json({ status:'ok', time: new Date().toISOString(), version: '2.0' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/time-tracking', require('./routes/timeTrackingRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

app.use(notFound);
app.use(errorHandler);

async function init(){
  await mongoose.connect(config.mongo.uri);
  return app;
}

module.exports = { app, init };