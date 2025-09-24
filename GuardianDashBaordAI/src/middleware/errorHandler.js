function notFound(req,res,next){
  res.status(404).json({ error:'NOT_FOUND', message:'Route not found' });
}

function errorHandler(err, req, res, next){ // eslint-disable-line
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({ error: mapStatusToError(status), message: err.message || 'Server error' });
}

function mapStatusToError(status){
  if(status === 400) return 'VALIDATION_ERROR';
  if(status === 401) return 'UNAUTHORIZED';
  if(status === 403) return 'FORBIDDEN';
  if(status === 404) return 'NOT_FOUND';
  return 'SERVER_ERROR';
}

module.exports = { notFound, errorHandler };