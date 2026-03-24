const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('./authMiddleware');

const apiGateway = (app) => {
  // 1. Security Headers (Helmet protects against common web vulnerabilities)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow typical dev environments
    crossOriginEmbedderPolicy: false
  }));

  // 2. Request Logging (Morgan provides concise logs for each request)
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

  // 3. Centralized Route Guarding (Protected vs Public)
  // Public Routes (Bypassed by Token Verification)
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/health',
    '/'
  ];

  app.use((req, res, next) => {
    // Skip protection for public paths
    if (publicPaths.some(path => req.path === path)) {
      return next();
    }
    
    // Apply token verification to everything else under /api
    if (req.path.startsWith('/api')) {
      return verifyToken(req, res, next);
    }
    
    next();
  });

  // 4. Centralized Error Handler (API Gateway's Final Step)
  app.use((err, req, res, next) => {
    console.error('API Gateway Error:', err.stack);
    
    const statusCode = err.status || 500;
    const message = err.message || 'Gateway Internal Server Error';
    
    res.status(statusCode).json({
      success: false,
      gateway_error: true,
      status: statusCode,
      message,
      path: req.path
    });
  });
};

module.exports = apiGateway;
