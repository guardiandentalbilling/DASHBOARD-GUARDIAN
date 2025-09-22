const TimeLog = require('../models/timeLogModel');

// EST timezone constant
const EST_TIMEZONE = 'America/New_York';

// Get EST time using built-in JavaScript functions
function getESTTime(date = new Date()) {
  return new Date(date.toLocaleString("en-US", {timeZone: EST_TIMEZONE}));
}

// Derive workDay as simple date string in EST
function getWorkDay(d = new Date()) {
  const estDate = getESTTime(d);
  return estDate.toISOString().split('T')[0];
}

// Format EST time as string
function formatESTTime(date) {
  const estDate = getESTTime(date);
  return estDate.toLocaleString("en-US", {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

async function startSession(req, res) {
  try {
    const { taskDescription } = req.body;
    const employeeId = req.user.id;

    // Prevent overlapping active session
    const active = await TimeLog.findOne({ employeeId, isActive: true });
    if (active) {
      return res.status(400).json({ message: 'An active session already exists', session: active });
    }

    const now = getESTTime(); // Already a JavaScript Date for MongoDB
    const session = await TimeLog.create({
      employeeId,
      taskDescription: taskDescription || 'Work Session',
      startTime: now,
      workDay: getWorkDay(now),
      isActive: true,
      meta: { 
        source: 'web', 
        userAgent: req.headers['user-agent'], 
        ip: req.ip,
        timezone: EST_TIMEZONE,
        estStartTime: formatESTTime(now)
      }
    });
    return res.status(201).json(session);
  } catch (err) {
    console.error('startSession error', err);
    return res.status(500).json({ message: 'Failed to start session' });
  }
}

async function pauseSession(req, res) {
  try {
    const employeeId = req.user.id;
    const session = await TimeLog.findOne({ employeeId, isActive: true });
    if (!session) return res.status(404).json({ message: 'No active session' });
    // Add break start with EST time
    const estPauseTime = getESTTime();
    session.breaks.push({ 
      pauseTime: estPauseTime,
      estPauseTime: formatESTTime(estPauseTime)
    });
    session.isActive = false;
    await session.save();
    return res.json(session);
  } catch (err) {
    console.error('pauseSession error', err);
    return res.status(500).json({ message: 'Failed to pause session' });
  }
}

async function resumeSession(req, res) {
  try {
    const employeeId = req.user.id;
    const session = await TimeLog.findOne({ employeeId }).sort({ createdAt: -1 });
    if (!session || session.isActive) return res.status(404).json({ message: 'No paused session' });
    // Find last break without resumeTime and add EST resume time
    const lastBreak = [...session.breaks].reverse().find(b => !b.resumeTime);
    if (lastBreak) {
      const estResumeTime = getESTTime();
      lastBreak.resumeTime = estResumeTime;
      lastBreak.estResumeTime = formatESTTime(estResumeTime);
    }
    session.isActive = true;
    await session.save();
    return res.json(session);
  } catch (err) {
    console.error('resumeSession error', err);
    return res.status(500).json({ message: 'Failed to resume session' });
  }
}

async function stopSession(req, res) {
  try {
    const employeeId = req.user.id;
    const { totalElapsed } = req.body; // milliseconds from client for accuracy
    const session = await TimeLog.findOne({ employeeId, isActive: true });
    if (!session) return res.status(404).json({ message: 'No active session' });
    
    const estEndTime = getESTTime();
    session.endTime = estEndTime;
    session.isActive = false;
    
    // Add EST metadata
    if (!session.meta) session.meta = {};
    session.meta.estEndTime = formatESTTime(estEndTime);
    session.meta.timezone = EST_TIMEZONE;
    
    if (typeof totalElapsed === 'number' && totalElapsed >= 0) {
      session.totalElapsed = totalElapsed;
    } else if (!session.totalElapsed) {
      session.totalElapsed = session.endTime - session.startTime; // fallback simple diff
    }
    await session.save();
    return res.json(session);
  } catch (err) {
    console.error('stopSession error', err);
    return res.status(500).json({ message: 'Failed to stop session' });
  }
}

async function listSessions(req, res) {
  try {
    const employeeId = req.user.role === 'admin' && req.query.employeeId ? req.query.employeeId : req.user.id;
    const { start, end } = req.query; // YYYY-MM-DD
    const query = { employeeId };
    if (start || end) {
      query.startTime = {};
      if (start) query.startTime.$gte = new Date(start);
      if (end) query.startTime.$lte = new Date(end + 'T23:59:59.999Z');
    }
    const sessions = await TimeLog.find(query).sort({ startTime: -1 }).limit(500);
    return res.json(sessions);
  } catch (err) {
    console.error('listSessions error', err);
    return res.status(500).json({ message: 'Failed to list sessions' });
  }
}

async function daySummary(req, res) {
  try {
    const employeeId = req.user.role === 'admin' && req.query.employeeId ? req.query.employeeId : req.user.id;
    const workDay = req.params.workDay || getWorkDay();
    const sessions = await TimeLog.find({ employeeId, workDay });
    let total = 0; let overtime = 0; const eight = 8 * 60 * 60 * 1000;
    sessions.forEach(s => { total += s.totalElapsed || 0; });
    if (total > eight) overtime = total - eight;
    return res.json({ workDay, totalElapsed: total, hours: +(total/3600000).toFixed(2), overtimeHours: +(overtime/3600000).toFixed(2), sessions });
  } catch (err) {
    console.error('daySummary error', err);
    return res.status(500).json({ message: 'Failed to get summary' });
  }
}

async function addActivity(req, res) {
  try {
    const employeeId = req.user.id;
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'Activity note required' });
    const session = await TimeLog.findOne({ employeeId, isActive: true });
    if (!session) return res.status(404).json({ message: 'No active session' });
    session.activities.push({ note });
    await session.save();
    return res.json({ message: 'Activity logged', session });
  } catch (err) {
    console.error('addActivity error', err);
    return res.status(500).json({ message: 'Failed to add activity' });
  }
}

module.exports = {
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  listSessions,
  daySummary,
  addActivity
};
