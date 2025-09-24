const User = require('../models/User');
const TimeTrackingSession = require('../models/TimeTrackingSession');
const config = require('../config/env');

let cache = { data: null, expires: 0 };

async function computePayroll(){
  const now = Date.now();
  if(cache.data && cache.expires > now){
    return { ...cache.data, cached: true };
  }
  const users = await User.find({ role: 'employee' });
  // Synthetic payroll: sum baseMonthlySalary * months employed (simplified) + overtime factor based on sessions
  const sessions = await TimeTrackingSession.find({});
  const totalHours = sessions.reduce((acc,s)=> acc + (s.totalElapsedMs/3600000), 0);
  const lifetime = users.reduce((acc,u)=> acc + (u.baseMonthlySalary||0), 0); // simplified
  const summary = {
    lifetime,
    lastYear: lifetime * 0.6,
    thisYear: lifetime * 0.4,
    lastMonth: lifetime * 0.1,
    thisMonth: lifetime * 0.09,
    thisWeek: lifetime * 0.02,
    breakdown: {
      monthly: [], weekly: [], yearly: [], lifetime: []
    }
  };
  cache = { data: { ...summary, totalHours, updatedAt: new Date().toISOString() }, expires: now + config.payroll.cacheTtlMs };
  return cache.data;
}

module.exports = { computePayroll };