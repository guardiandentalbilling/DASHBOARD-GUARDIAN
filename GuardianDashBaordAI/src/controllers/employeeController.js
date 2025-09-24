const Employee = require('../models/Employee');
const User = require('../models/User');
const { validationResult } = require('express-validator');

async function list(req,res){
  const employees = await Employee.find().lean();
  res.json(employees);
}

async function getById(req,res){
  const emp = await Employee.findById(req.params.id).lean();
  if(!emp) return res.status(404).json({ error:'NOT_FOUND', message:'Employee not found' });
  res.json(emp);
}

async function create(req,res){
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ error:'VALIDATION_ERROR', message: errors.array()[0].msg });
  const { firstName, lastName, email, username, baseMonthlySalary, department, password, role } = req.body;
  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
  if(existing) return res.status(400).json({ error:'VALIDATION_ERROR', message:'User with email/username exists' });
  const passwordHash = await User.hashPassword(password || 'Temp123!');
  const user = await User.create({ firstName, lastName, email: email.toLowerCase(), username: username.toLowerCase(), role: role || 'employee', baseMonthlySalary: baseMonthlySalary || 0, department, passwordHash });
  const emp = await Employee.create({ user: user._id, firstName, lastName, email: user.email, username: user.username, department, baseMonthlySalary: user.baseMonthlySalary });
  res.status(201).json({ id: emp._id, userId: user._id, username: user.username });
}

async function update(req,res){
  const emp = await Employee.findById(req.params.id);
  if(!emp) return res.status(404).json({ error:'NOT_FOUND', message:'Employee not found' });
  const { firstName, lastName, email, baseMonthlySalary, department, status } = req.body;
  if(email) emp.email = email.toLowerCase();
  if(firstName) emp.firstName = firstName;
  if(lastName) emp.lastName = lastName;
  if(baseMonthlySalary !== undefined) emp.baseMonthlySalary = baseMonthlySalary;
  if(department) emp.department = department;
  if(status) emp.status = status;
  await emp.save();
  // sync user
  if(emp.user){
    await User.findByIdAndUpdate(emp.user, { $set: { firstName: emp.firstName, lastName: emp.lastName, email: emp.email, baseMonthlySalary: emp.baseMonthlySalary, department: emp.department } });
  }
  res.json({ message:'Updated', id: emp._id });
}

async function softDelete(req,res){
  const emp = await Employee.findById(req.params.id);
  if(!emp) return res.status(404).json({ error:'NOT_FOUND', message:'Employee not found' });
  emp.status = 'Inactive';
  await emp.save();
  res.json({ message:'Employee deactivated' });
}

module.exports = { list, getById, create, update, softDelete };