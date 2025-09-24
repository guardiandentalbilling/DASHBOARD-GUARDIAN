#!/usr/bin/env node
/* Reset a user's password by username or email.
 * Usage examples:
 *   node src/scripts/resetPassword.js --username shakeel --password NewPass123!
 *   node src/scripts/resetPassword.js --email shakeel@guardiandb.com --password 'StrongerP@ssw0rd'
 */
const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');

function parseArgs(){
  const args = process.argv.slice(2);
  const out = {};
  for(let i=0;i<args.length;i++){
    const a = args[i];
    if(a === '--username' || a === '-u') out.username = args[++i];
    else if(a === '--email' || a === '-e') out.email = args[++i];
    else if(a === '--password' || a === '-p') out.password = args[++i];
    else if(a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function printHelp(){
  console.log(`Password Reset Script\n\nOptions:\n  --username, -u   Username of the user\n  --email,    -e   Email of the user\n  --password, -p   New password (REQUIRED)\n  --help,     -h   Show help\n\nOne of --username or --email is required.\n`);
}

async function run(){
  const { username, email, password, help } = parseArgs();
  if(help){ printHelp(); return; }
  if(!password){
    console.error('Error: --password is required');
    printHelp();
    process.exit(1);
  }
  if(!username && !email){
    console.error('Error: either --username or --email must be provided');
    printHelp();
    process.exit(1);
  }

  await mongoose.connect(config.mongo.uri);

  const query = username ? { username: username.toLowerCase() } : { email: email.toLowerCase() };
  const user = await User.findOne(query);
  if(!user){
    console.error('User not found for query:', query);
    process.exit(2);
  }

  // Handle legacy / incomplete user documents missing required fields after schema evolution
  const updates = {};
  if(!user.username){
    const base = (user.email || username || 'user').split('@')[0];
    updates.username = base.toLowerCase();
  }
  if(!user.firstName){
    updates.firstName = 'System';
  }
  if(!user.lastName){
    updates.lastName = 'User';
  }
  if(!user.role){
    updates.role = 'admin';
  }
  const passwordHash = await User.hashPassword(password);
  updates.passwordHash = passwordHash;

  // Use updateOne to bypass validation on missing historical fields, then fetch updated doc
  await User.updateOne({ _id: user._id }, { $set: updates }, { runValidators: false });
  const updated = await User.findById(user._id);

  console.log('\n[resetPassword] Password updated successfully');
  if(updates.username && !user.username){
    console.log('[resetPassword] Assigned new username (legacy record had none)');
  }
  console.log('User ID:   ', updated._id.toString());
  console.log('Username:  ', updated.username);
  console.log('Email:     ', updated.email);
  console.log('Role:      ', updated.role);
  console.log('New Password (store securely, will NOT be shown again):', password);
}

run().then(()=> mongoose.connection.close()).catch(err => { console.error(err); process.exit(1); });
