// server.js - QUMAIL CLEAN ENTRY POINT
const path = require('path');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
// Set explicit DNS servers if there's a problem with local DNS resolving SRV
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server override failed:', e.message);
}
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const mongoose = require('mongoose');
const { startInboundSmtp } = require('./utils/inboundSmtp');
const authRoutes = require("./routes/authRoutes");
const mailRoutes = require("./routes/mailRoutes");
const otpRoutes = require("./routes/otpRoutes"); // Changed path as per instruction
const { apiLimiter } = require("./middleware/rateLimit");
const apiGateway = require("./middleware/apiGateway"); // Imported apiGateway

const config = require('./config/config');

const app = express();

// Enable Gzip Compression
app.use(compression());

// Configure CORS (Dynamic based on request origin and whitelist)
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.cors.origins.indexOf(origin) !== -1 || config.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Cross-Origin Request Blocked by QuMail Security Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Apply global rate limit to all /api routes
app.use("/api", apiLimiter);

// Payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//  API Gateway Entry Point (Handles Security, Logging, and Centralized Protection)
apiGateway(app);

// Routes
app.use("/api/auth", authRoutes);

// Legacy GET links (old templates) → canonical auth route
app.get('/api/verify-reset-token/:token', (req, res) => {
  res.redirect(307, `/api/auth/verify-reset-token/${encodeURIComponent(req.params.token)}`);
});

app.use("/api/mail", mailRoutes);
app.use("/api/otp", otpRoutes);

// Compatibility aliases (if frontend uses old paths)
app.use("/api/register", authRoutes);
app.use("/api/login", authRoutes);
app.use("/api/profile", authRoutes);
app.use("/api/forgot-password", authRoutes);
app.use("/api/reset-password", authRoutes);
app.use("/api/verify-recovery-code", authRoutes);
app.use("/api/verify-reset-token", authRoutes);
app.use("/api/send", mailRoutes);
app.use("/api/decrypt", mailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root info
app.get('/', (req, res) => {
  res.json({ 
    status: 'running', 
    message: `${config.appName} Quantum-Secure Email Platform API`,
    version: '5.1.0 (Production-Ready Config)',
    platform: 'Independent Secure Network'
  });
});

// MongoDB Connection
mongoose.connect(config.database.uri || 'mongodb://localhost:27017/qumail')
  .then(() => console.log(' MongoDB connected successfully'))
  .catch((err) => console.error(' MongoDB connection error:', err.message));

const PORT = config.port;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  startInboundSmtp();
});