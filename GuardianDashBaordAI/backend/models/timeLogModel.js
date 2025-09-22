const mongoose = require('mongoose');

// Time tracking session for an employee
// We separate from Attendance because Attendance is daily high-level check-in/out.
// A TimeLog can represent multiple segments (pauses) within one continuous start/stop session.
const breakSchema = new mongoose.Schema({
  pauseTime: { type: Date, required: true },
  resumeTime: { type: Date }
}, { _id: false });

const timeLogSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workDay: { type: String, index: true }, // ISO date (YYYY-MM-DD) for quick aggregation
  taskDescription: { type: String, default: 'Work Session' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  totalElapsed: { type: Number, default: 0 }, // milliseconds accumulated (excludes paused time)
  isActive: { type: Boolean, default: true },
  breaks: [ breakSchema ],
  activities: [{
    ts: { type: Date, default: Date.now },
    note: String
  }],
  meta: {
    source: { type: String, default: 'web' },
    userAgent: String,
    ip: String
  }
}, { timestamps: true });

timeLogSchema.index({ employeeId: 1, startTime: 1 });
timeLogSchema.index({ employeeId: 1, workDay: 1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
