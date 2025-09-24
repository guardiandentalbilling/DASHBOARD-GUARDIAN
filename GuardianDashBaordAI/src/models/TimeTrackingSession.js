const mongoose = require('mongoose');

const TimeTrackingSessionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  taskDescription: { type: String, required: true },
  startTime: { type: Date, required: true },
  stopTime: { type: Date },
  totalElapsedMs: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

TimeTrackingSessionSchema.index({ employeeId: 1, startTime: -1, isActive: 1 });

module.exports = mongoose.model('TimeTrackingSession', TimeTrackingSessionSchema);