const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signUser(user){
  return jwt.sign({ id: user._id.toString(), role: user.role, name: `${user.firstName} ${user.lastName}` }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

module.exports = { signUser };