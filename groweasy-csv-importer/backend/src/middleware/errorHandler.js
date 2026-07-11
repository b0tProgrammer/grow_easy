
function errorHandler(err, req, res, next) { 
  console.error(`[error] ${req.method} ${req.path}:`, err.message);

  if (err.message?.includes('File too large')) {
    return res.status(413).json({ success: false, error: 'File exceeds the maximum upload size (15MB).' });
  }
  if (err.message?.includes('Only .csv files')) {
    return res.status(400).json({ success: false, error: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error while processing the import.' : err.message,
  });
}

module.exports = errorHandler;
