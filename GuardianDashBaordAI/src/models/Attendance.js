const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  status: { type: String, enum: ['present','absent','leave'], required: true },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  totalMs: { type: Number, default: 0 }
}, { timestamps: true });

AttendanceSchema.index({ date: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);