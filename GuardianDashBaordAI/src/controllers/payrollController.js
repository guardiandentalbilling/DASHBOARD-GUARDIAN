const { computePayroll } = require('../services/payrollService');

async function summary(req,res){
  const data = await computePayroll();
  res.json(data);
}

module.exports = { summary };