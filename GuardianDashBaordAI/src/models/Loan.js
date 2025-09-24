const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  employeeName: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true }
}, { timestamps: true });

LoanSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Loan', LoanSchema);