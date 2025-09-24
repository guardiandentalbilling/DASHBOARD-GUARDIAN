const Loan = require('../models/Loan');
const { validationResult } = require('express-validator');
const config = require('../config/env');

async function list(req,res){
  const { status, search = '', page = 1, limit = 20 } = req.query;
  const q = {};
  if(status) q.status = status;
  if(search) q.$or = [ { employeeName: { $regex: search, $options: 'i' } } ];
  const loans = await Loan.find(q).skip((page-1)*limit).limit(parseInt(limit,10)).sort({ createdAt: -1 });
  res.json(loans);
}

async function create(req,res){
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ error:'VALIDATION_ERROR', message: errors.array()[0].msg });
  const { amount, reason } = req.body;
  if(amount <= 0 || amount > config.limits.maxLoan) return res.status(400).json({ error:'VALIDATION_ERROR', message:`Amount must be >0 and <= ${config.limits.maxLoan}` });
  const loan = await Loan.create({ employeeId: req.user.id, employeeName: req.user.name, amount, reason, status: 'pending' });
  res.status(201).json({ id: loan._id, status: loan.status });
}

async function updateStatus(req,res){
  const { id } = req.params;
  const { status } = req.body;
  const loan = await Loan.findById(id);
  if(!loan) return res.status(404).json({ error:'NOT_FOUND', message:'Loan not found' });
  if(!['pending','approved','rejected'].includes(status)) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Invalid status' });
  loan.status = status;
  await loan.save();
  res.json({ message:'Updated', id: loan._id, status: loan.status });
}

module.exports = { list, create, updateStatus };