const jwt = require('jsonwebtoken');
const config = require('../config/env');

function auth(req,res,next){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token){
    return res.status(401).json({ error:'UNAUTHORIZED', message:'Missing token' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, role: decoded.role, name: decoded.name };
    return next();
  } catch (e) {
    return res.status(401).json({ error:'UNAUTHORIZED', message:'Invalid or expired token' });
  }
}

function requireRole(role){
  return (req,res,next)=>{
    if(!req.user) return res.status(401).json({ error:'UNAUTHORIZED', message:'Login required' });
    if(req.user.role !== role) return res.status(403).json({ error:'FORBIDDEN', message:`${role} role required` });
    next();
  };
}

function requireSelfOrAdmin(param='id'){
  return (req,res,next)=>{
    if(!req.user) return res.status(401).json({ error:'UNAUTHORIZED', message:'Login required' });
    if(req.user.role === 'admin') return next();
    if(req.user.id === req.params[param]) return next();
    return res.status(403).json({ error:'FORBIDDEN', message:'Not allowed' });
  };
}

module.exports = { auth, requireRole, requireSelfOrAdmin };