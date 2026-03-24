const rateLimit = require('express-rate-limit');

// Simple helper to create limiters
const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs, // time window
  max, // max requests per window
  message: {
    success: false,
    message: message || "Too many requests from this IP, please try again later."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General application limiter
const apiLimiter = createLimiter(15 * 60 * 1000, 100, "Global API limit reached. Please wait 15 minutes.");

// Stricter auth limiter (login/register)
const authLimiter = createLimiter(60 * 60 * 1000, 10, "Too many authentication attempts. Please try again in an hour.");

// Email sending limiter
const mailLimiter = createLimiter(10 * 60 * 1000, 20, "Email sending limit reached. Please try again in 10 minutes.");

module.exports = {
  apiLimiter,
  authLimiter,
  mailLimiter
};
