// qumail-km/server.js - Updated with AES key endpoint
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

/* -------------------- CONFIGURATION -------------------- */
const PORT = process.env.PORT || 6000;
const KEY_SIZE = parseInt(process.env.KEY_SIZE) || 32;
const KEY_FORMAT = process.env.KEY_FORMAT || 'hex';
const KEY_EXPIRY_HOURS = parseInt(process.env.KEY_EXPIRY_HOURS) || 24;
const MAX_KEYS_PER_USER = parseInt(process.env.MAX_KEYS_PER_USER) || 100;
const REQUIRE_API_KEY = process.env.REQUIRE_API_KEY === 'true';
const API_KEY = process.env.API_KEY;
const API_KEY_HEADER = process.env.API_KEY_HEADER || 'X-API-Key';

// AES Configuration
const AES_KEY = process.env.AES_KEY;
const AES_IV = process.env.AES_IV;

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());

// API Key Middleware
const apiKeyMiddleware = (req, res, next) => {
  if (!REQUIRE_API_KEY) return next();
  
  const clientApiKey = req.headers[API_KEY_HEADER.toLowerCase()];
  
  if (!clientApiKey) {
    return res.status(401).json({ 
      error: "API key required",
      header: API_KEY_HEADER
    });
  }
  
  if (clientApiKey !== API_KEY) {
    return res.status(403).json({ 
      error: "Invalid API key" 
    });
  }
  
  next();
};

app.use(apiKeyMiddleware);

/* -------------------- KEY STORE -------------------- */
const keyStore = {};

// Cleanup expired keys periodically
setInterval(() => {
  const now = Date.now();
  const expiryMs = KEY_EXPIRY_HOURS * 60 * 60 * 1000;
  
  Object.keys(keyStore).forEach(email => {
    keyStore[email] = keyStore[email].filter(key => {
      const age = now - key.createdAt;
      return age < expiryMs;
    });
    
    // Remove user if no keys left
    if (keyStore[email].length === 0) {
      delete keyStore[email];
    }
  });
  
  if (process.env.LOG_LEVEL === 'debug') {
    console.log(`🧹 Cleaned expired keys. Total users: ${Object.keys(keyStore).length}`);
  }
}, 300000); // Every 5 minutes

/* -------------------- UTILITY FUNCTIONS -------------------- */
const generateKey = () => {
  const bytes = crypto.randomBytes(KEY_SIZE);
  
  switch (KEY_FORMAT) {
    case 'hex':
      return bytes.toString('hex');
    case 'base64':
      return bytes.toString('base64');
    case 'base58':
      // Simple base58 implementation
      const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let result = '';
      let num = BigInt('0x' + bytes.toString('hex'));
      
      while (num > 0) {
        const remainder = Number(num % 58n);
        num = num / 58n;
        result = alphabet[remainder] + result;
      }
      
      // Add leading '1's for each leading zero byte
      for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
        result = '1' + result;
      }
      
      return result || '1';
    default:
      return bytes.toString('hex');
  }
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Check if ends with @qumail.com
  if (!email.toLowerCase().endsWith('@qumail.com')) {
    return false;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/* -------------------- HEALTH CHECK -------------------- */
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: process.env.SERVICE_NAME || "qumail-km",
    version: process.env.SERVICE_VERSION || "1.0.0",
    timestamp: new Date().toISOString(),
    stats: {
      totalUsers: Object.keys(keyStore).length,
      totalKeys: Object.values(keyStore).reduce((sum, keys) => sum + keys.length, 0)
    },
    features: {
      aesEndpoint: true,
      quantumKeys: true
    }
  });
});

/* -------------------- ROOT -------------------- */
app.get("/", (req, res) => {
  res.json({
    service: "Quantum Key Manager",
    description: "Key management service for quantum-resistant encryption",
    endpoints: {
      health: "GET /health",
      aesKeys: "GET /api/keys/aes",
      newKey: "POST /new-key",
      getKey: "POST /get-key",
      stats: "GET /stats",
      validate: "POST /validate-key",
      cleanup: "POST /cleanup"
    },
    config: {
      keySize: KEY_SIZE,
      keyFormat: KEY_FORMAT,
      keyExpiryHours: KEY_EXPIRY_HOURS,
      aesAvailable: !!AES_KEY && !!AES_IV
    }
  });
});

/* -------------------- AES KEY ENDPOINT -------------------- */
app.get("/api/keys/aes", (req, res) => {
  try {
    // Check if AES keys are configured
    if (!AES_KEY || !AES_IV) {
      return res.status(503).json({
        error: "AES keys not configured",
        code: "AES_NOT_CONFIGURED",
        message: "Please set AES_KEY and AES_IV environment variables"
      });
    }

    // Validate key and IV format
    const keyBuffer = Buffer.from(AES_KEY, 'hex');
    const ivBuffer = Buffer.from(AES_IV, 'hex');
    
    if (keyBuffer.length !== 32) { // 256-bit key
      return res.status(500).json({
        error: "Invalid AES key length",
        code: "INVALID_KEY_LENGTH",
        expected: "32 bytes (256-bit) hex string",
        actual: `${keyBuffer.length} bytes`
      });
    }
    
    if (ivBuffer.length !== 16) { // 128-bit IV
      return res.status(500).json({
        error: "Invalid AES IV length",
        code: "INVALID_IV_LENGTH",
        expected: "16 bytes (128-bit) hex string",
        actual: `${ivBuffer.length} bytes`
      });
    }

    // Return the keys
    res.json({
      success: true,
      key: AES_KEY,
      iv: AES_IV,
      algorithm: "aes-256-cbc",
      keyLength: "256-bit",
      ivLength: "128-bit",
      format: "hex",
      timestamp: new Date().toISOString(),
      expires: "Never (static key)",
      warning: "These are static keys. For enhanced security, consider using quantum-resistant keys from /new-key endpoint"
    });

  } catch (error) {
    console.error("AES key retrieval error:", error);
    return res.status(500).json({ 
      error: "Internal server error retrieving AES keys",
      code: "AES_RETRIEVAL_ERROR"
    });
  }
});

/* -------------------- CREATE NEW KEY -------------------- */
app.post("/new-key", (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: "Email is required",
        code: "EMAIL_REQUIRED"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: "Invalid email. Must be @qumail.com address",
        code: "INVALID_EMAIL"
      });
    }

    // Limit keys per user
    if (keyStore[email] && keyStore[email].length >= MAX_KEYS_PER_USER) {
      return res.status(429).json({ 
        error: `Maximum keys (${MAX_KEYS_PER_USER}) reached for this user`,
        code: "KEY_LIMIT_REACHED"
      });
    }

    const key = generateKey();
    const now = Date.now();

    if (!keyStore[email]) {
      keyStore[email] = [];
    }

    keyStore[email].push({
      key,
      createdAt: now,
      used: false,
      expiresAt: now + (KEY_EXPIRY_HOURS * 60 * 60 * 1000)
    });

    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`🔑 New key generated for ${email}`);
    }

    return res.status(201).json({
      success: true,
      message: "New quantum key generated",
      key: key,
      expiresInHours: KEY_EXPIRY_HOURS,
      format: KEY_FORMAT,
      timestamp: new Date(now).toISOString()
    });

  } catch (error) {
    console.error("New key generation error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

/* -------------------- GET UNUSED KEY -------------------- */
app.post("/get-key", (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: "Email is required",
        code: "EMAIL_REQUIRED"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: "Invalid email. Must be @qumail.com address",
        code: "INVALID_EMAIL"
      });
    }

    if (!keyStore[email]) {
      keyStore[email] = [];
    }

    const now = Date.now();
    
    // Clean expired keys first
    keyStore[email] = keyStore[email].filter(k => k.expiresAt > now);

    // Find first unused key
    let keyIndex = keyStore[email].findIndex(k => !k.used);

    // If no unused key → generate one
    if (keyIndex === -1) {
      if (keyStore[email].length >= MAX_KEYS_PER_USER) {
        return res.status(429).json({ 
          error: `Maximum keys (${MAX_KEYS_PER_USER}) reached for this user`,
          code: "KEY_LIMIT_REACHED"
        });
      }

      const newKey = generateKey();
      
      keyStore[email].push({
        key: newKey,
        createdAt: now,
        used: true, // Mark as used immediately
        expiresAt: now + (KEY_EXPIRY_HOURS * 60 * 60 * 1000)
      });

      keyIndex = keyStore[email].length - 1;
      
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(`🔑 Auto-generated key for ${email}`);
      }
    } else {
      // Mark existing key as used
      keyStore[email][keyIndex].used = true;
      keyStore[email][keyIndex].lastUsed = now;
    }

    const keyData = keyStore[email][keyIndex];

    return res.json({
      success: true,
      key: keyData.key,
      isNew: keyData.createdAt === now,
      createdAt: new Date(keyData.createdAt).toISOString(),
      expiresAt: new Date(keyData.expiresAt).toISOString(),
      expiresIn: Math.round((keyData.expiresAt - now) / (60 * 60 * 1000)) // hours
    });

  } catch (error) {
    console.error("Get key error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

/* -------------------- VALIDATE KEY -------------------- */
app.post("/validate-key", (req, res) => {
  try {
    const { email, key } = req.body;

    if (!email || !key) {
      return res.status(400).json({ 
        error: "Email and key are required",
        code: "VALIDATION_ERROR"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL"
      });
    }

    if (!keyStore[email]) {
      return res.json({
        valid: false,
        reason: "No keys found for this email"
      });
    }

    const now = Date.now();
    const keyData = keyStore[email].find(k => k.key === key);

    if (!keyData) {
      return res.json({
        valid: false,
        reason: "Key not found"
      });
    }

    if (keyData.expiresAt < now) {
      return res.json({
        valid: false,
        reason: "Key expired",
        expiredAt: new Date(keyData.expiresAt).toISOString()
      });
    }

    return res.json({
      valid: true,
      used: keyData.used || false,
      createdAt: new Date(keyData.createdAt).toISOString(),
      expiresAt: new Date(keyData.expiresAt).toISOString(),
      expiresIn: Math.round((keyData.expiresAt - now) / (60 * 60 * 1000)) + " hours"
    });

  } catch (error) {
    console.error("Validate key error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

/* -------------------- GET STATISTICS -------------------- */
app.get("/stats", (req, res) => {
  try {
    const now = Date.now();
    let totalKeys = 0;
    let usedKeys = 0;
    let expiredKeys = 0;
    
    Object.keys(keyStore).forEach(email => {
      keyStore[email].forEach(key => {
        totalKeys++;
        if (key.used) usedKeys++;
        if (key.expiresAt < now) expiredKeys++;
      });
    });

    res.json({
      users: Object.keys(keyStore).length,
      totalKeys: totalKeys,
      usedKeys: usedKeys,
      unusedKeys: totalKeys - usedKeys,
      expiredKeys: expiredKeys,
      activeKeys: totalKeys - expiredKeys,
      keyFormat: KEY_FORMAT,
      keySize: KEY_SIZE * 8 + " bits", // Convert bytes to bits
      maxKeysPerUser: MAX_KEYS_PER_USER,
      aesAvailable: !!(AES_KEY && AES_IV)
    });

  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

/* -------------------- CLEAR EXPIRED KEYS -------------------- */
app.post("/cleanup", (req, res) => {
  try {
    const now = Date.now();
    let removedCount = 0;
    
    Object.keys(keyStore).forEach(email => {
      const before = keyStore[email].length;
      keyStore[email] = keyStore[email].filter(k => k.expiresAt > now);
      removedCount += (before - keyStore[email].length);
      
      // Remove empty users
      if (keyStore[email].length === 0) {
        delete keyStore[email];
      }
    });

    res.json({
      success: true,
      message: `Cleaned ${removedCount} expired keys`,
      removedCount: removedCount,
      remainingUsers: Object.keys(keyStore).length
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

/* -------------------- ERROR HANDLING -------------------- */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: "Internal server error",
    code: "SERVER_ERROR"
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

/* -------------------- SERVER -------------------- */
app.listen(PORT, () => {
  console.log(`🔐 Quantum Key Manager running on port ${PORT}`);
  console.log(`📊 Key Size: ${KEY_SIZE * 8} bits (${KEY_SIZE} bytes)`);
  console.log(`📝 Key Format: ${KEY_FORMAT}`);
  console.log(`⏰ Key Expiry: ${KEY_EXPIRY_HOURS} hours`);
  console.log(`🔑 Max Keys/User: ${MAX_KEYS_PER_USER}`);
  console.log(`🔒 API Key Required: ${REQUIRE_API_KEY}`);
  console.log(`🔐 AES Endpoint: ${AES_KEY && AES_IV ? 'Available' : 'Not configured'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 Development mode enabled`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 AES Keys: http://localhost:${PORT}/api/keys/aes`);
  }
});