function sanitizeInput(str){
  if(typeof str !== 'string') return str;
  return str.replace(/[<>]/g,'');
}

function sanitizeBody(fields){
  return (req,res,next)=>{
    fields.forEach(f=>{ if(req.body[f] !== undefined) req.body[f] = sanitizeInput(req.body[f]); });
    next();
  };
}

module.exports = { sanitizeInput, sanitizeBody };