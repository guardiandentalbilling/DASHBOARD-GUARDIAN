const Config = require('../models/Config');
const config = require('../config/env');

async function getCurrency(req,res){
  const entry = await Config.findOne({ key:'currency' });
  if(entry) return res.json(entry.value);
  return res.json({ base: config.currency.base, target: config.currency.target, rate: config.currency.rate });
}

async function setCurrency(req,res){
  const { base, target, rate } = req.body;
  const value = { base, target, rate: parseFloat(rate), updatedAt: new Date().toISOString() };
  const entry = await Config.findOneAndUpdate({ key:'currency' }, { $set:{ value } }, { upsert: true, new: true });
  res.json(entry.value);
}

module.exports = { getCurrency, setCurrency };