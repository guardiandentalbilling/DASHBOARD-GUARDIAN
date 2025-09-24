const TimeTrackingSession = require('../models/TimeTrackingSession');
const { todayRange } = require('../utils/timezone');

async function start(req,res){
  const { taskDescription } = req.body;
  if(!taskDescription) return res.status(400).json({ error:'VALIDATION_ERROR', message:'taskDescription required' });
  const active = await TimeTrackingSession.findOne({ employeeId: req.user.id, isActive: true });
  if(active) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Active session exists' });
  const session = await TimeTrackingSession.create({ employeeId: req.user.id, taskDescription, startTime: new Date() });
  res.status(201).json({ id: session._id });
}

async function stop(req,res){
  const { sessionId } = req.body;
  const session = await TimeTrackingSession.findOne({ _id: sessionId, employeeId: req.user.id, isActive: true });
  if(!session) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Active session not found' });
  session.stopTime = new Date();
  session.totalElapsedMs = session.stopTime - session.startTime;
  session.isActive = false;
  await session.save();
  res.json({ message:'Stopped', totalElapsedMs: session.totalElapsedMs });
}

async function active(req,res){
  const sessions = await TimeTrackingSession.find({ isActive: true }).lean();
  res.json(sessions);
}

async function summaryToday(req,res){
  const { start, end, dateLabel } = todayRange();
  const sessions = await TimeTrackingSession.find({ startTime: { $gte: start, $lte: end } }).lean();
  const activeSessions = sessions.filter(s=> s.isActive);
  const totalHours = sessions.reduce((a,s)=> a + (s.totalElapsedMs/3600000), 0);
  const perEmployee = sessions.reduce((m,s)=>{ m[s.employeeId] = (m[s.employeeId]||0) + (s.totalElapsedMs/3600000); return m; }, {});
  const overtimeEmployees = Object.values(perEmployee).filter(h=> h > 8).length;
  const avgSessionMinutes = sessions.length ? (sessions.reduce((a,s)=> a + (s.totalElapsedMs/60000),0)/sessions.length) : 0;
  res.json({ date: dateLabel, activeCount: activeSessions.length, activeSessions: activeSessions.map(s=>({ employeeId:s.employeeId, taskDescription:s.taskDescription, startTime:s.startTime, totalElapsed:s.totalElapsedMs })), totalHours, overtimeEmployees, avgSessionMinutes, updatedAt: new Date().toISOString() });
}

module.exports = { start, stop, active, summaryToday };