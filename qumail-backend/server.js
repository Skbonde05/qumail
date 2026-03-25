// server.js - QUMAIL CLEAN ENTRY POINT
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require("./routes/authRoutes");
const mailRoutes = require("./routes/mailRoutes");
const otpRoutes = require("./routes/otpRoutes"); // Changed path as per instruction
const { apiLimiter } = require("./middleware/rateLimit");
const apiGateway = require("./middleware/apiGateway"); // Imported apiGateway

const app = express();

// Enable Gzip Compression
app.use(compression());

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    message: 'QuMail Quantum-Secure Email Platform API',
    version: '5.0.0 (Refactored)',
    platform: 'Independent Secure Network'
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qumail';
mongoose.connect(MONGODB_URI)
  .then(() => console.log(' MongoDB connected successfully'))
  .catch((err) => console.error(' MongoDB connection error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});