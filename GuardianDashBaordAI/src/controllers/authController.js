const User = require('../models/User');
const { validationResult } = require('express-validator');
const { signUser } = require('../utils/token');

async function login(req,res){
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ error:'VALIDATION_ERROR', message: errors.array()[0].msg });
  const { username, password } = req.body;
  const user = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }] });
  if(!user) return res.status(401).json({ error:'UNAUTHORIZED', message:'Invalid credentials' });
  const ok = await user.comparePassword(password);
  if(!ok) return res.status(401).json({ error:'UNAUTHORIZED', message:'Invalid credentials' });
  const token = signUser(user);
  res.json({ token, user: { id: user._id.toString(), role: user.role, name: `${user.firstName} ${user.lastName}`, email: user.email } });
}

module.exports = { login };