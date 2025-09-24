const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee', index: true },
  department: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  baseMonthlySalary: { type: Number, default: 0 },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

UserSchema.methods.comparePassword = function(pw){
  return bcrypt.compare(pw, this.passwordHash);
};

UserSchema.statics.hashPassword = async function(pw){
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
};

module.exports = mongoose.model('User', UserSchema);