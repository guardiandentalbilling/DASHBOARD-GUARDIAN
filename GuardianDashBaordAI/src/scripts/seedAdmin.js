#!/usr/bin/env node
/* Seed an initial admin user if not present */
const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');

async function run(){
  await mongoose.connect(config.mongo.uri);
  const existingAdmin = await User.findOne({ role: 'admin' });
  if(existingAdmin){
    console.log('[seedAdmin] Admin already exists:', existingAdmin.email || existingAdmin.username);
    return;
  }
  const firstName = 'System';
  const lastName = 'Admin';
  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'AdminPass123!';
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ firstName, lastName, username, email, role:'admin', passwordHash, baseMonthlySalary: 0 });
  console.log('\n[seedAdmin] Created admin user');
  console.log('--------------------------------');
  console.log('Username:', username);
  console.log('Email:   ', email);
  console.log('Password:', password);
  console.log('User ID: ', user._id.toString());
  console.log('--------------------------------');
  console.log('IMPORTANT: Change this password in production.');
}
run().then(()=>{ mongoose.connection.close(); }).catch(err => { console.error(err); process.exit(1); });