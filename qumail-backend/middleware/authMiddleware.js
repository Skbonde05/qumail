const jwt = require('jsonwebtoken');
const { isQumailAddress } = require('../config/mailDomain');

const JWT_SECRET = process.env.JWT_SECRET || 'qumail-quantum-secure-key-2024';

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'qumail') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const validateQumailEmail = (email) => isQumailAddress(email);

module.exports = {
  verifyToken,
  validateQumailEmail
};
