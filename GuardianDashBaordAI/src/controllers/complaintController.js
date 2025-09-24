const Complaint = require('../models/Complaint');

async function list(req,res){
  const { type, search = '', page = 1, limit = 20 } = req.query;
  const q = {};
  if(type) q.type = type;
  if(search) q.$text = { $search: search };
  const complaints = await Complaint.find(q).skip((page-1)*limit).limit(parseInt(limit,10)).sort({ createdAt: -1 });
  res.json(complaints);
}

async function create(req,res){
  const { type, message } = req.body;
  if(!['complaint','suggestion'].includes(type)) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Invalid type' });
  if(!message) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Message required' });
  const c = await Complaint.create({ employeeId: req.user.id, employeeName: req.user.name, type, message });
  res.status(201).json({ id: c._id });
}

module.exports = { list, create };