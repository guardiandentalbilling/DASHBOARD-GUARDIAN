#!/usr/bin/env node
/**
 * Force create or update a legacy user (backend/models/userModel.js) with a known password.
 * Usage (PowerShell): node scripts/resetLegacyUser.js --username shakeel --password "AdminPass123!" --role admin --email admin@guardian.local
 */
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../backend/models/userModel');

function arg(name, def){
  const i = process.argv.indexOf('--' + name);
  if(i !== -1 && process.argv[i+1]) return process.argv[i+1];
  return def;
}

(async () => {
  const username = arg('username', 'shakeel').toLowerCase();
  const password = arg('password', 'AdminPass123!');
  const role = arg('role', 'admin');
  const email = (arg('email', `${username}@guardian.local`)).toLowerCase();
  const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_dashboard';

  console.log('[RESET] Connecting to Mongo:', mongo.replace(/:[^@]*@/, ':****@'));
  await mongoose.connect(mongo, { serverSelectionTimeoutMS: 15000 });

  let user = await User.findOne({ $or: [{ username }, { email }] });
  if(!user){
    console.log('[RESET] User not found, creating new');
    const hash = await bcrypt.hash(password, 10);
    user = await User.create({ username, email, name: username, password: hash, role });
  } else {
    console.log('[RESET] User found, updating password/role/email if needed');
    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.role = role;
    user.email = email;
    await user.save();
  }

  console.log('[RESET] Success:', { id: user._id.toString(), username: user.username, email: user.email, role: user.role });
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error('[RESET] Failed:', err); process.exit(1); });
