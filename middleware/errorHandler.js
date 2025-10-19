app.use((err, req, res, next) => {
  // If error is not an AppError, wrap it (so we don't leak internals)
  if (!err) {
    return res.status(500).json({ error: 'Unknown error' });
  }

  if (!(err instanceof AppError)) {
    // Non-operational error -> 500
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  // Operational AppError: send safe details
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Error'
  };
  res.status(status).json(payload);
});