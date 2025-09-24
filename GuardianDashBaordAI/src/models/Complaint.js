const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  employeeName: { type: String, required: true, index: true },
  type: { type: String, enum: ['complaint','suggestion'], required: true, index: true },
  message: { type: String, required: true }
}, { timestamps: true });

ComplaintSchema.index({ type: 1, createdAt: -1 });
ComplaintSchema.index({ message: 'text', employeeName: 'text' });

module.exports = mongoose.model('Complaint', ComplaintSchema);