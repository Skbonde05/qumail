const NodeCache = require('node-cache');

// Standard TTL: 5 minutes, check period every 1 minute
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Higher-order function to create a caching middleware
 * @param {number} duration Cache duration in seconds
 */
const cacheMiddleware = (duration) => (req, res, next) => {
  // Only cache GET and specific idempotent POST requests (like folder listings)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return next();
  }

  // Create a unique key based on URL, user ID (from token), and body (for POST)
  const userId = req.user ? req.user.id : 'anonymous';
  const bodyKey = req.method === 'POST' ? JSON.stringify(req.body) : '';
  const key = `__express__${req.originalUrl || req.url}__${userId}__${bodyKey}`;

  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    return res.json(cachedResponse);
  } else {
    // Override res.json to catch the response and cache it
    res.sendResponse = res.json;
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200 || res.statusCode === 201) {
        cache.set(key, body, duration);
      }
      res.sendResponse(body);
    };
    next();
  }
};

/**
 * Clear cache for a specific user
 * Useful after mutations (like sending an email or deleting one)
 */
const clearUserCache = (userId) => {
  const keys = cache.keys();
  const userKeys = keys.filter(k => k.includes(`__${userId}__`));
  if (userKeys.length > 0) {
    cache.del(userKeys);
  }
};

module.exports = {
  cacheMiddleware,
  clearUserCache,
  cache // Export direct instance for advanced use
};
