const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, lowercase: true, trim: true, index: true },
  role: { type: String, default: 'employee' },
  status: { type: String, enum: ['Active','On Leave','Resigned','Retired','Inactive'], default: 'Active', index: true },
  department: { type: String },
  baseMonthlySalary: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);