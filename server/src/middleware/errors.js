function notFound(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError') {
    const fields = {};
    for (const [key, value] of Object.entries(error.errors)) fields[key] = value.message;
    return res.status(400).json({ error: 'Validation failed.', fields });
  }
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid resource identifier.' });
  if (error.code === 11000) return res.status(409).json({ error: 'An account with that email already exists.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  } else if (process.env.NODE_ENV === 'production') {
    const errorType = typeof error.name === 'string' ? error.name : 'Error';
    const errorCode = typeof error.code === 'string' || typeof error.code === 'number' ? ` (${error.code})` : '';
    console.error(`API request failed: ${errorType}${errorCode}`);
  }
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
}

module.exports = { notFound, errorHandler };
