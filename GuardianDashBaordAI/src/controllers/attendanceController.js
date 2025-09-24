const Attendance = require('../models/Attendance');
const { todayRange } = require('../utils/timezone');
const { validationResult } = require('express-validator');

async function getByDate(req,res){
  const date = req.params.date;
  const list = await Attendance.find({ date }).lean();
  res.json(list);
}

async function checkIn(req,res){
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ error:'VALIDATION_ERROR', message: errors.array()[0].msg });
  const { dateLabel } = todayRange();
  let att = await Attendance.findOne({ employeeId: req.user.id, date: dateLabel });
  if(att && att.checkInTime) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Already checked in' });
  if(!att) att = new Attendance({ employeeId: req.user.id, date: dateLabel, status: 'present' });
  att.checkInTime = new Date();
  await att.save();
  res.json({ message:'Checked in', id: att._id });
}

async function checkOut(req,res){
  const { dateLabel } = todayRange();
  const att = await Attendance.findOne({ employeeId: req.user.id, date: dateLabel });
  if(!att || !att.checkInTime) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Not checked in' });
  if(att.checkOutTime) return res.status(400).json({ error:'VALIDATION_ERROR', message:'Already checked out' });
  att.checkOutTime = new Date();
  att.totalMs = att.checkOutTime - att.checkInTime;
  await att.save();
  res.json({ message:'Checked out', totalMs: att.totalMs });
}

module.exports = { getByDate, checkIn, checkOut };