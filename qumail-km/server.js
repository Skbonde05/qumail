// qumail-km/server.js - Updated for production deployment
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

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
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// AES Configuration
const AES_KEY = process.env.AES_KEY;
const AES_IV = process.env.AES_IV;

/* -------------------- PRODUCTION MIDDLEWARE -------------------- */
app.use(helmet());
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());

/* -------------------- DATABASE / STORE -------------------- */
const STORE_PATH = path.join(__dirname, 'keystore.json');

// Mongoose Schema (Alternative to local JSON store)
const keySchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  key: { type: String, required: true },
  createdAt: { type: Number, default: Date.now },
  expiresAt: { type: Number, required: true },
  used: { type: Boolean, default: false },
  lastUsed: { type: Number }
});

const Key = mongoose.model('Key', keySchema);

const isMongoEnabled = !!MONGODB_URI;

if (isMongoEnabled) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log(' Connected to MongoDB for Key Management'))
    .catch(err => console.error(' MongoDB connection failed:', err.message));
} else {
  console.log(' Warning: MONGODB_URI not provided. Using ephemeral keystore.json for local/development only.');
}

// In-memory fallback
let keyStore = {};

const loadLocalStore = () => {
    if (fs.existsSync(STORE_PATH)) {
        try {
          keyStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        } catch (e) {
          console.error(' Failed to parse local keystore.json');
          keyStore = {};
        }
    }
};

const saveLocalStore = () => {
    if (!isMongoEnabled) {
        try {
            fs.writeFileSync(STORE_PATH, JSON.stringify(keyStore, null, 2));
        } catch (e) {
            console.error(' Failed to save local keystore');
        }
    }
};

if (!isMongoEnabled) loadLocalStore();

/* -------------------- API KEY MIDDLEWARE -------------------- */
const apiKeyMiddleware = (req, res, next) => {
  if (!REQUIRE_API_KEY) return next();
  const clientApiKey = req.headers[API_KEY_HEADER.toLowerCase()];
  if (!clientApiKey || clientApiKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  next();
};

app.use(apiKeyMiddleware);

/* -------------------- KEY STORE HELPERS -------------------- */
const cleanupExpiredKeys = async () => {
    const now = Date.now();
    if (isMongoEnabled) {
        await Key.deleteMany({ expiresAt: { $lt: now } });
    } else {
        Object.keys(keyStore).forEach(email => {
            keyStore[email] = keyStore[email].filter(key => key.expiresAt > now);
            if (keyStore[email].length === 0) delete keyStore[email];
        });
        saveLocalStore();
    }
};

setInterval(cleanupExpiredKeys, 300000); // 5 min cleanup

const generateKey = () => crypto.randomBytes(KEY_SIZE).toString(KEY_FORMAT);

const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* -------------------- ROUTES -------------------- */
app.get("/health", async (req, res) => {
  let stats = { totalUsers: 0, totalKeys: 0 };
  
  if (isMongoEnabled) {
      stats.totalKeys = await Key.countDocuments();
      const distinctUsers = await Key.distinct('email');
      stats.totalUsers = distinctUsers.length;
  } else {
      stats.totalUsers = Object.keys(keyStore).length;
      stats.totalKeys = Object.values(keyStore).reduce((sum, keys) => sum + keys.length, 0);
  }

  res.json({ 
    status: "ok", 
    service: "qumail-km",
    isMongo: isMongoEnabled,
    stats,
    timestamp: new Date().toISOString()
  });
});

app.post("/new-key", async (req, res) => {
  try {
    const { email } = req.body;
    if (!validateEmail(email)) return res.status(400).json({ error: "Valid email required" });

    const key = generateKey();
    const now = Date.now();
    const expiresAt = now + (KEY_EXPIRY_HOURS * 60 * 60 * 1000);

    if (isMongoEnabled) {
        const count = await Key.countDocuments({ email });
        if (count >= MAX_KEYS_PER_USER) return res.status(429).json({ error: "Limit reached" });
        await Key.create({ email, key, createdAt: now, expiresAt });
    } else {
        if (!keyStore[email]) keyStore[email] = [];
        if (keyStore[email].length >= MAX_KEYS_PER_USER) return res.status(429).json({ error: "Limit reached" });
        keyStore[email].push({ key, createdAt: now, used: false, expiresAt });
        saveLocalStore();
    }

    res.status(201).json({ success: true, key, expiresInHours: KEY_EXPIRY_HOURS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-key", async (req, res) => {
  try {
    const { email } = req.body;
    if (!validateEmail(email)) return res.status(400).json({ error: "Valid email required" });

    const now = Date.now();
    let keyData = null;

    if (isMongoEnabled) {
        keyData = await Key.findOne({ email, used: false, expiresAt: { $gt: now } });
        if (!keyData) {
            const count = await Key.countDocuments({ email });
            if (count >= MAX_KEYS_PER_USER) return res.status(429).json({ error: "Limit reached" });
            keyData = await Key.create({ email, key: generateKey(), createdAt: now, expiresAt: now + (KEY_EXPIRY_HOURS * 60 * 60 * 1000), used: true });
        } else {
            keyData.used = true;
            keyData.lastUsed = now;
            await keyData.save();
        }
    } else {
        if (!keyStore[email]) keyStore[email] = [];
        keyStore[email] = keyStore[email].filter(k => k.expiresAt > now);
        let keyIndex = keyStore[email].findIndex(k => !k.used);

        if (keyIndex === -1) {
            if (keyStore[email].length >= MAX_KEYS_PER_USER) return res.status(429).json({ error: "Limit reached" });
            const key = generateKey();
            keyData = { key, createdAt: now, used: true, expiresAt: now + (KEY_EXPIRY_HOURS * 60 * 60 * 1000) };
            keyStore[email].push(keyData);
        } else {
            keyStore[email][keyIndex].used = true;
            keyStore[email][keyIndex].lastUsed = now;
            keyData = keyStore[email][keyIndex];
        }
        saveLocalStore();
    }

    res.json({
      success: true,
      key: keyData.key,
      createdAt: new Date(keyData.createdAt).toISOString(),
      expiresAt: new Date(keyData.expiresAt).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/validate-key", async (req, res) => {
  try {
    const { email, key } = req.body;
    if (!email || !key) return res.status(400).json({ error: "Email and key required" });

    const now = Date.now();
    let keyData = null;

    if (isMongoEnabled) {
        keyData = await Key.findOne({ email, key, expiresAt: { $gt: now } });
    } else {
        if (keyStore[email]) {
            keyData = keyStore[email].find(k => k.key === key && k.expiresAt > now);
        }
    }

    if (!keyData) return res.json({ valid: false, reason: "Invalid or expired key" });
    res.json({ valid: true, createdAt: new Date(keyData.createdAt).toISOString(), expiresAt: new Date(keyData.expiresAt).toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/keys/aes", (req, res) => {
    if (!AES_KEY || !AES_IV) return res.status(503).json({ error: "AES keys not configured" });
    res.json({ success: true, key: AES_KEY, iv: AES_IV, algorithm: "aes-256-cbc" });
});

/* -------------------- ROOT -------------------- */
app.get("/", (req, res) => {
  res.json({
    service: "QuMail Key Manager (Production Ready)",
    endpoints: ["POST /new-key", "POST /get-key", "POST /validate-key", "GET /health", "GET /api/keys/aes"]
  });
});

/* -------------------- SERVER -------------------- */
app.listen(PORT, () => {
  console.log(` Quantum Key Manager running on port ${PORT} [${NODE_ENV}]`);
});