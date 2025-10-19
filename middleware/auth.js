const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return next(new AuthenticationError('API key is required'));
  }
  
  if (apiKey !== API_KEY) {
    return next(new AuthenticationError('Invalid API key'));
  }
  
  next();
};