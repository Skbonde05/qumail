const rateLimit = require('express-rate-limit');

/**
 * Enhanced limiter creator
 * @param {number} windowMs Time window in MS
 * @param {number} max Max requests per window
 * @param {string} message Custom error message
 */
const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: message || "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(res.getHeader('Retry-After') || (windowMs / 1000))
    });
  },
  standardHeaders: true, 
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts (good for auth/decryption)
});

// General application limiter (1000 requests / 15 min)
const apiLimiter = createLimiter(15 * 60 * 1000, 1000, "Global API limit reached.");

// Stricter auth limiter (20 attempts / 10 min)
const authLimiter = createLimiter(10 * 60 * 1000, 20, "Too many authentication attempts. Please try again in 10 minutes.");

// Email sending limiter (50 emails / 10 min)
const mailLimiter = createLimiter(10 * 60 * 1000, 50, "Email sending limit reached. Please wait before sending more.");

// NEW: Decryption limiter (to prevent brute-forcing OTP/AES keys)
const decryptionLimiter = createLimiter(5 * 60 * 1000, 30, "Too many decryption attempts. Please check your key format.");

module.exports = {
  apiLimiter,
  authLimiter,
  mailLimiter,
  decryptionLimiter
};
