const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  appName: process.env.APP_NAME || 'QuMail',
  emailDomain: process.env.EMAIL_DOMAIN || 'qumail.com',
  
  database: {
    uri: process.env.MONGODB_URI
  },
  
  urls: {
    base: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    keyManager: process.env.KEY_MANAGER_URL || 'http://localhost:6001'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_SECRET,
    accessExpire: process.env.ACCESS_EXPIRE || '1d',
    refreshExpire: process.env.REFRESH_EXPIRE || '7d'
  },
  
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  
  cors: {
    // Allows comma-separated origins in FRONTEND_URL environment variable
    origins: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim())
  }
};

// Security Check: In production, certain variables MUST be set
if (config.env === 'production') {
  if (!config.database.uri) {
    throw new Error('PRODUCTION ERROR: MONGODB_URI is not set in environment!');
  }
  if (!config.jwt.secret || config.jwt.secret === 'qumail_super_secret_key_change_in_production') {
    throw new Error('PRODUCTION ERROR: JWT_SECRET must be set to a secure value in production!');
  }
  if (!config.jwt.refreshSecret) {
    throw new Error('PRODUCTION ERROR: REFRESH_SECRET is not set!');
  }
}

module.exports = config;
