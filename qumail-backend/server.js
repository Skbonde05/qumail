// server.js - QUMAIL INDEPENDENT PLATFORM BACKEND WITH QUANTUM ENCRYPTION

// Load environment variables from .env file
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();

// Configure CORS properly
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// =============== CRITICAL: INCREASE PAYLOAD LIMIT ===============
app.use(express.json({ limit: '10mb' }));  // Increase from default 100kb to 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// ================================================================

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'qumail-quantum-secure-key-2024';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Validate environment variables
console.log('🔧 Environment Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   JWT_SECRET: ${JWT_SECRET ? '✓ Set' : '✗ Using default (insecure for production!)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   BASE_URL: ${BASE_URL}`);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  WARNING: JWT_SECRET not set in production environment!');
  console.error('⚠️  Please set JWT_SECRET in your .env file for security.');
}

// ================== MONGODB CONNECTION ==================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qumail';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// ================== MONGODB MODELS ==================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    autoSaveDrafts: {
      type: Boolean,
      default: true
    },
    signature: {
      type: String,
      default: ''
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  encryptionKeys: {
    otp: { type: String, default: null },
    aes256: { type: String, default: null }
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  storageLimit: {
    type: Number,
    default: 10 * 1024 * 1024 * 1024 // 10GB
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

// Mail Schema
const mailSchema = new mongoose.Schema({
  mailId: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    default: "(No Subject)"
  },
  body: {
    type: String,
    required: true
  },
  encryption: {
    type: String,
    enum: ["NONE", "OTP", "AES"],
    default: "NONE"
  },
  aesKey: {
    type: String,
    default: null
  },
  aesIV: {
    type: String,
    default: null
  },
  folder: {
    type: String,
    enum: ["INBOX", "SENT"],
    required: true
  },
  owner: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  starred: {
    type: Boolean,
    default: false
  },
  important: {
    type: Boolean,
    default: false
  },
  trash: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Mail = mongoose.model('Mail', mailSchema);

// ================== HELPER FUNCTIONS ==================

// Validate email is @qumail.com
const validateQumailEmail = (email) => {
  return email.toLowerCase().endsWith('@qumail.com');
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      timestamp: Date.now(),
      type: 'qumail'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware to verify JWT token
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

// ================== ENCRYPTION FUNCTIONS ==================

// Generate quantum OTP key
const generateOTPKey = (textLength) => {
  const keyLength = Math.ceil(textLength / 2) * 2;
  return crypto.randomBytes(keyLength).toString('hex');
};

// Generate AES key
const generateAESKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate AES IV
const generateAESIV = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Validate hex key
const isValidHexKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  return /^[0-9a-fA-F]+$/.test(key);
};

// OTP Encryption
const otpEncrypt = (text, key) => {
  try {
    if (!isValidHexKey(key)) {
      throw new Error('Invalid hex key format for OTP encryption');
    }
    
    const textBuffer = Buffer.from(text, 'utf8');
    const keyBuffer = Buffer.from(key, 'hex');
    
    if (keyBuffer.length < textBuffer.length) {
      throw new Error(`OTP key too short! Key: ${keyBuffer.length} bytes, Text: ${textBuffer.length} bytes`);
    }
    
    const effectiveKey = keyBuffer.slice(0, textBuffer.length);
    const encrypted = Buffer.alloc(textBuffer.length);
    
    for (let i = 0; i < textBuffer.length; i++) {
      encrypted[i] = textBuffer[i] ^ effectiveKey[i];
    }
    
    return encrypted.toString('hex');
  } catch (error) {
    console.error('OTP encryption error:', error);
    throw new Error(`OTP encryption failed: ${error.message}`);
  }
};

// OTP Decryption
const otpDecrypt = (encryptedHex, key) => {
  try {
    if (!isValidHexKey(key)) {
      throw new Error('Invalid hex key format for OTP decryption');
    }
    
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const keyBuffer = Buffer.from(key, 'hex');
    
    if (keyBuffer.length < encryptedBuffer.length) {
      throw new Error(`OTP key too short! Key: ${keyBuffer.length} bytes, Cipher: ${encryptedBuffer.length} bytes`);
    }
    
    const effectiveKey = keyBuffer.slice(0, encryptedBuffer.length);
    const decrypted = Buffer.alloc(encryptedBuffer.length);
    
    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ effectiveKey[i];
    }
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('OTP decryption error:', error);
    throw new Error(`OTP decryption failed: ${error.message}`);
  }
};

// AES Encryption (GCM mode)
const aesEncrypt = (text, key, iv) => {
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv,
      content: encrypted,
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('AES encryption error:', error);
    throw new Error(`AES encryption failed: ${error.message}`);
  }
};

// AES Decryption (GCM mode)
const aesDecrypt = (encryptedData, key) => {
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('AES decryption error:', error);
    throw new Error(`AES decryption failed: ${error.message}`);
  }
};

// Simple AES encryption for Mail model
const encryptAES = (text, key, iv) => {
  try {
    const encryptedData = aesEncrypt(text, key, iv);
    return JSON.stringify(encryptedData);
  } catch (error) {
    throw new Error(`AES encryption failed: ${error.message}`);
  }
};

// Simple AES decryption for Mail model
const decryptAES = (encryptedText, key, iv) => {
  try {
    const encryptedData = JSON.parse(encryptedText);
    return aesDecrypt(encryptedData, key);
  } catch (error) {
    throw new Error(`AES decryption failed: ${error.message}`);
  }
};

// ================== FILE UPLOAD CONFIGURATION ==================
const createUploadsDirectory = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const avatarsDir = path.join(__dirname, 'uploads/avatars');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadsDir}`);
  }
  
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
    console.log(`📁 Created avatars directory: ${avatarsDir}`);
  }
};

createUploadsDirectory();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeEmail = req.user.email.replace(/[@.]/g, '-').toLowerCase();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, safeEmail + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  }
});

// Function to get full avatar URL
const getAvatarUrl = (filename) => {
  if (!filename) return '';
  return `${BASE_URL}/uploads/avatars/${filename}`;
};

// ================== ROUTES ==================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = isMongoConnected() ? 'connected' : 'disconnected';
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'QuMail Quantum Platform',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Server info
app.get('/', (req, res) => {
  const dbStatus = isMongoConnected() ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'running', 
    message: 'QuMail Quantum-Secure Email Platform',
    version: '4.1',
    platform: 'Independent Secure Network',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    baseUrl: BASE_URL,
    endpoints: {
      auth: ['POST /api/register', 'POST /api/login', 'POST /api/logout', 'POST /api/verify-token'],
      email: ['POST /api/send', 'POST /api/mail/inbox', 'POST /api/mail/sent', 'GET /api/mail/:mailId', 'POST /api/decrypt'],
      user: ['GET /api/profile', 'PUT /api/profile', 'POST /api/change-password', 'POST /api/upload-avatar', 'DELETE /api/avatar']
    }
  });
});

// ------------------ REGISTRATION ------------------
app.post('/api/register', 
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().withMessage('Valid email required').custom(validateQumailEmail).withMessage('Only @qumail.com addresses allowed'),
    body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { name, email, password } = req.body;
      const lowerEmail = email.toLowerCase();
      
      console.log('📝 Registration attempt for:', lowerEmail);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: lowerEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this @qumail.com address already exists'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate encryption keys
      const otpKey = generateOTPKey(256);
      const aesKey = generateAESKey();
      
      // Create user
      const user = await User.create({
        name: name.trim(),
        email: lowerEmail,
        password: hashedPassword,
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        }
      });
      
      // Generate token
      const token = generateToken(user);
      
      console.log(`✅ User registered: ${lowerEmail} (${name})`);
      
      res.status(201).json({
        success: true,
        message: 'Welcome to QuMail Quantum-Secure Email Platform!',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          settings: user.settings
        },
        token: token
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }
);

// ------------------ LOGIN ------------------
app.post('/api/login',
  [
    body('email').isEmail().withMessage('Valid email required').custom(validateQumailEmail).withMessage('Only @qumail.com addresses allowed'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { email, password } = req.body;
      const lowerEmail = email.toLowerCase();
      
      console.log('🔐 Login attempt for:', lowerEmail);
      
      // Find user
      const user = await User.findOne({ email: lowerEmail });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this @qumail.com address'
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate token
      const token = generateToken(user);
      
      console.log(`✅ Login successful: ${lowerEmail}`);
      
      // Get email counts for response
      const [inboxCount, sentCount] = await Promise.all([
        Mail.countDocuments({ owner: lowerEmail, folder: 'INBOX', trash: false }),
        Mail.countDocuments({ owner: lowerEmail, folder: 'SENT', trash: false })
      ]);
      
      res.json({
        success: true,
        message: `Welcome back to QuMail, ${user.name}!`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          settings: user.settings,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
          isVerified: user.isVerified,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token: token,
        folderCounts: {
          inbox: inboxCount,
          sent: sentCount,
          drafts: 0,
          trash: 0
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authentication'
      });
    }
  }
);

// ------------------ VERIFY TOKEN ------------------
app.post('/api/verify-token', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'User not found'
      });
    }
    
    // Get email counts
    const [inboxCount, sentCount, trashCount] = await Promise.all([
      Mail.countDocuments({ owner: req.user.email, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'SENT', trash: false }),
      Mail.countDocuments({ owner: req.user.email, trash: true })
    ]);
    
    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        settings: user.settings,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      folderCounts: {
        inbox: inboxCount,
        sent: sentCount,
        drafts: 0,
        trash: trashCount
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token'
    });
  }
});

// ================== PROFILE ROUTES ==================

// ------------------ GET USER PROFILE ------------------
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get email counts
    const [inboxCount, sentCount, trashCount] = await Promise.all([
      Mail.countDocuments({ owner: req.user.email, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'SENT', trash: false }),
      Mail.countDocuments({ owner: req.user.email, trash: true })
    ]);
    
    // Calculate storage percentage
    const storagePercentage = user.storageLimit > 0 
      ? (user.storageUsed / user.storageLimit) * 100 
      : 0;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        settings: user.settings,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        storagePercentage: storagePercentage,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        updatedAt: user.updatedAt
      },
      encryption: {
        hasOTPKey: !!user.encryptionKeys?.otp,
        hasAESKey: !!user.encryptionKeys?.aes256
      },
      folderCounts: {
        inbox: inboxCount,
        sent: sentCount,
        drafts: 0,
        trash: trashCount
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ------------------ UPDATE USER PROFILE ------------------
app.put('/api/profile', 
  [
    verifyToken,
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('settings.emailNotifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
    body('settings.autoSaveDrafts').optional().isBoolean().withMessage('Auto-save drafts must be boolean'),
    body('settings.signature').optional().trim().isLength({ max: 1000 }).withMessage('Signature too long'),
    body('settings.twoFactorEnabled').optional().isBoolean().withMessage('Two-factor enabled must be boolean'),
    body('settings.timezone').optional().isIn(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata']).withMessage('Invalid timezone')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { name, settings } = req.body;
      const userEmail = req.user.email;
      
      console.log(`📝 Updating profile for: ${userEmail}`);
      
      // Find user
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update fields
      const updates = {};
      if (name) {
        updates.name = name.trim();
      }
      
      if (settings) {
        updates.settings = {
          ...user.settings,
          ...settings
        };
      }
      
      // Apply updates
      Object.assign(user, updates);
      await user.save();
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          settings: user.settings,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
          isVerified: user.isVerified,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          updatedAt: user.updatedAt
        }
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
);

// ------------------ CHANGE PASSWORD ------------------
app.post('/api/change-password',
  [
    verifyToken,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 12 }).withMessage('New password must be at least 12 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      const userEmail = req.user.email;
      
      console.log(`🔐 Changing password for: ${userEmail}`);
      
      // Find user
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      user.password = hashedPassword;
      await user.save();
      
      // Generate new token with updated info
      const token = generateToken(user);
      
      res.json({
        success: true,
        message: 'Password changed successfully',
        token: token
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
);

// ------------------ UPLOAD AVATAR (CORRECTED) ------------------
app.post('/api/upload-avatar', 
  verifyToken,
  async (req, res) => {
    try {
      const { avatar } = req.body;
      
      if (!avatar) {
        return res.status(400).json({
          success: false,
          message: 'Avatar data is required'
        });
      }
      
      const userEmail = req.user.email;
      
      console.log(`📷 Uploading avatar for: ${userEmail}`);
      console.log(`   Avatar data length: ${avatar.length} characters`);
      
      // Find user
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Store Base64 avatar in MongoDB
      user.avatar = avatar;
      await user.save();
      
      console.log(`✅ Avatar stored in MongoDB for: ${userEmail}`);
      
      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatar: user.avatar,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
      
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload avatar'
      });
    }
  }
);

// Serve uploaded files statically
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// ------------------ DELETE AVATAR ------------------
app.delete('/api/avatar', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    console.log(`🗑️  Deleting avatar for: ${userEmail}`);
    
    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Clear avatar field in database
    user.avatar = '';
    await user.save();
    
    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete avatar'
    });
  }
});

// ------------------ SEND EMAIL ------------------
app.post('/api/send', 
  [
    verifyToken,
    body('to').isEmail().withMessage('Valid recipient email required').custom(validateQumailEmail).withMessage('Can only send to @qumail.com addresses'),
    body('subject').optional().trim().isLength({ max: 200 }).withMessage('Subject too long'),
    body('body').trim().notEmpty().withMessage('Message body is required'),
    body('encryptionLevel').optional().isIn(['none', 'otp', 'aes256']).withMessage('Invalid encryption level. Use: none, otp, or aes256')
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { to, subject, body, encryptionLevel = 'none' } = req.body;
      const from = req.user.email;
      
      console.log(`📧 Sending email from ${from} to ${to} with encryption: ${encryptionLevel}`);
      
      // Check if recipient exists
      const lowerTo = to.toLowerCase();
      const recipient = await User.findOne({ email: lowerTo });
      if (!recipient) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Recipient @qumail.com address not found'
        });
      }
      
      let encryptedBody = body;
      let encryptionType = 'NONE';
      let aesKey = null;
      let aesIV = null;
      
      // Handle encryption
      if (encryptionLevel !== 'none') {
        try {
          if (encryptionLevel === 'otp') {
            // OTP encryption
            encryptionType = 'OTP';
            const textLength = Buffer.from(body, 'utf8').length;
            const otpKey = generateOTPKey(textLength);
            encryptedBody = otpEncrypt(body, otpKey);
            
            // Store OTP key in sender's encryption keys
            await User.findOneAndUpdate(
              { email: from },
              { $set: { "encryptionKeys.otp": otpKey } },
              { session }
            );
            
            console.log(`✅ OTP Encryption successful`);
            
          } else if (encryptionLevel === 'aes256') {
            // AES encryption
            encryptionType = 'AES';
            
            // Get sender's AES key or generate new one
            const sender = await User.findOne({ email: from });
            if (!sender.encryptionKeys?.aes256) {
              // Generate and save new AES key for sender
              aesKey = generateAESKey();
              await User.findOneAndUpdate(
                { email: from },
                { $set: { "encryptionKeys.aes256": aesKey } },
                { session }
              );
              console.log(`🔑 Generated new AES key for ${from}`);
            } else {
              aesKey = sender.encryptionKeys.aes256;
            }
            
            aesIV = generateAESIV();
            encryptedBody = encryptAES(body, aesKey, aesIV);
            
            console.log(`✅ AES Encryption successful`);
          }
        } catch (encryptionError) {
          await session.abortTransaction();
          console.error('Encryption failed:', encryptionError);
          return res.status(500).json({
            success: false,
            message: `Encryption failed: ${encryptionError.message}`
          });
        }
      }
      
      // Create mail objects
      const mailId = uuidv4();
      const timestamp = new Date();
      
      // Sent mail for sender
      await Mail.create([{
        mailId: mailId,
        from: from,
        to: lowerTo,
        subject: subject || '(No Subject)',
        body: body, // Original body for sender
        encryption: 'NONE', // Sender sees unencrypted
        aesKey: null,
        aesIV: null,
        folder: 'SENT',
        owner: from,
        read: true,
        createdAt: timestamp
      }], { session });
      
      // Inbox mail for recipient
      await Mail.create([{
        mailId: uuidv4(),
        from: from,
        to: lowerTo,
        subject: encryptionType !== 'NONE' ? `🔒 ${subject || 'Encrypted Message'}` : (subject || '(No Subject)'),
        body: encryptedBody,
        encryption: encryptionType,
        aesKey: aesKey,
        aesIV: aesIV,
        folder: 'INBOX',
        owner: lowerTo,
        read: false,
        createdAt: timestamp
      }], { session });
      
      await session.commitTransaction();
      
      console.log(`✅ Email sent: ${mailId} from ${from} to ${to} (${encryptionLevel})`);
      
      res.json({
        success: true,
        message: `Email sent successfully via QuMail (${encryptionLevel})`,
        messageId: mailId,
        sentAt: timestamp,
        encryption: {
          level: encryptionLevel,
          encrypted: encryptionLevel !== 'none',
          type: encryptionType
        }
      });
      
    } catch (error) {
      await session.abortTransaction();
      console.error('Send email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email: ' + error.message
      });
    } finally {
      session.endSession();
    }
  }
);

// ------------------ GET INBOX EMAILS ------------------
app.post('/api/mail/inbox', verifyToken, async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    const email = req.user.email;
    
    console.log(`📥 Fetching inbox for: ${email}`);
    
    const mails = await Mail.find({
      owner: email,
      folder: 'INBOX',
      trash: false
    })
    .select('-aesKey -aesIV')
    .sort({ createdAt: -1 })
    .limit(limit);
    
    // Format emails for frontend
    const formattedEmails = mails.map(mail => ({
      id: mail.mailId,
      uid: mail.mailId,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      body: mail.body,
      preview: mail.subject || 'No subject',
      date: mail.createdAt,
      originalDate: mail.createdAt,
      read: mail.read,
      starred: mail.starred,
      important: mail.important,
      draft: false,
      sent: false,
      trash: mail.trash,
      spam: false,
      archived: false,
      folder: 'inbox',
      encrypted: mail.encryption !== 'NONE',
      encryptionLevel: mail.encryption === 'AES' ? 'aes256' : 
                     mail.encryption === 'OTP' ? 'otp' : 'none',
      requiresDecryption: mail.encryption !== 'NONE',
      attachments: [],
      size: mail.body ? mail.body.length : 0
    }));
    
    res.json({
      success: true,
      emails: formattedEmails,
      count: formattedEmails.length,
      total: await Mail.countDocuments({ owner: email, folder: 'INBOX', trash: false }),
      folder: 'inbox'
    });
    
  } catch (error) {
    console.error('Fetch inbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox',
      error: error.message
    });
  }
});

// ------------------ GET SENT EMAILS ------------------
app.post('/api/mail/sent', verifyToken, async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    const email = req.user.email;
    
    console.log(`📤 Fetching sent for: ${email}`);
    
    const mails = await Mail.find({
      owner: email,
      folder: 'SENT',
      trash: false
    })
    .select('-aesKey -aesIV')
    .sort({ createdAt: -1 })
    .limit(limit);
    
    // Format emails for frontend
    const formattedEmails = mails.map(mail => ({
      id: mail.mailId,
      uid: mail.mailId,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      body: mail.body,
      preview: mail.subject || 'No subject',
      date: mail.createdAt,
      originalDate: mail.createdAt,
      read: true,
      starred: mail.starred,
      important: mail.important,
      draft: false,
      sent: true,
      trash: mail.trash,
      spam: false,
      archived: false,
      folder: 'sent',
      encrypted: false,
      encryptionLevel: 'none',
      requiresDecryption: false,
      attachments: [],
      size: mail.body ? mail.body.length : 0
    }));
    
    res.json({
      success: true,
      emails: formattedEmails,
      count: formattedEmails.length,
      total: await Mail.countDocuments({ owner: email, folder: 'SENT', trash: false }),
      folder: 'sent'
    });
    
  } catch (error) {
    console.error('Fetch sent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent emails',
      error: error.message
    });
  }
});

// ------------------ GET SINGLE EMAIL ------------------
app.get('/api/mail/:mailId', verifyToken, async (req, res) => {
  try {
    const mailId = req.params.mailId;
    const userEmail = req.user.email;
    
    console.log(`📄 Fetching email: ${mailId} for ${userEmail}`);
    
    const mail = await Mail.findOne({ 
      mailId: mailId,
      owner: userEmail 
    });
    
    if (!mail) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Mark as read when opened (if in inbox)
    if (mail.folder === 'INBOX' && !mail.read) {
      mail.read = true;
      await mail.save();
    }
    
    // Prepare response
    const response = {
      id: mail.mailId,
      uid: mail.mailId,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      body: mail.body,
      date: mail.createdAt,
      originalDate: mail.createdAt,
      read: mail.read,
      starred: mail.starred,
      important: mail.important,
      draft: false,
      sent: mail.folder === 'SENT',
      trash: mail.trash,
      spam: false,
      archived: false,
      folder: mail.folder.toLowerCase(),
      encrypted: mail.encryption !== 'NONE',
      encryptionLevel: mail.encryption === 'AES' ? 'aes256' : 
                     mail.encryption === 'OTP' ? 'otp' : 'none',
      requiresDecryption: mail.encryption !== 'NONE',
      aesKey: mail.aesKey,
      aesIV: mail.aesIV
    };
    
    // If encrypted with AES and keys exist, decrypt it automatically
    if (mail.encryption === 'AES' && mail.aesKey && mail.aesIV) {
      try {
        const decryptedBody = decryptAES(mail.body, mail.aesKey, mail.aesIV);
        response.body = decryptedBody;
        response.decrypted = true;
        response.requiresDecryption = false;
      } catch (decryptError) {
        console.error('AES decryption error:', decryptError);
        response.decryptionError = 'Failed to decrypt AES email';
      }
    }
    
    res.json({
      success: true,
      email: response
    });
    
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email',
      error: error.message
    });
  }
});

// ------------------ DECRYPT EMAIL ------------------
app.post('/api/decrypt', 
  [
    verifyToken,
    body('emailId').notEmpty().withMessage('Email ID is required')
  ],
  async (req, res) => {
    try {
      const { emailId, encryptionKey } = req.body;
      const userEmail = req.user.email;
      
      console.log(`🔓 Decrypt request for email: ${emailId} by user: ${userEmail}`);
      
      // Find the email in MongoDB
      const mail = await Mail.findOne({ 
        mailId: emailId,
        owner: userEmail 
      });
      
      if (!mail) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }
      
      // Check if email is encrypted
      if (mail.encryption === 'NONE') {
        return res.json({
          success: true,
          decrypted: mail.body,
          encryptionLevel: 'none',
          alreadyDecrypted: true
        });
      }
      
      let decryptedBody;
      
      // Handle decryption based on encryption type
      if (mail.encryption === 'AES') {
        if (!mail.aesKey || !mail.aesIV) {
          return res.status(400).json({
            success: false,
            message: 'AES key or IV missing from email record'
          });
        }
        
        try {
          // Decrypt AES
          decryptedBody = decryptAES(mail.body, mail.aesKey, mail.aesIV);
          console.log(`✅ AES decryption successful for email: ${emailId}`);
        } catch (decryptError) {
          console.error('AES decryption error:', decryptError);
          return res.status(500).json({
            success: false,
            message: 'AES decryption failed. The email may be corrupted.'
          });
        }
      } 
      else if (mail.encryption === 'OTP') {
        // For OTP, require encryption key
        if (!encryptionKey) {
          return res.status(400).json({
            success: false,
            message: 'OTP key is required for decryption'
          });
        }
        
        try {
          // Validate OTP key format
          if (!isValidHexKey(encryptionKey)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid OTP key format. Must be hexadecimal.'
            });
          }
          
          // Decrypt OTP
          decryptedBody = otpDecrypt(mail.body, encryptionKey);
          console.log(`✅ OTP decryption successful for email: ${emailId}`);
        } catch (decryptError) {
          console.error('OTP decryption error:', decryptError);
          return res.status(400).json({
            success: false,
            message: 'OTP decryption failed. Make sure the key is correct.'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported encryption type'
        });
      }
      
      // Update mail to mark as read
      if (!mail.read) {
        mail.read = true;
        await mail.save();
      }
      
      res.json({
        success: true,
        decrypted: decryptedBody,
        encryptionLevel: mail.encryption === 'AES' ? 'aes256' : 'otp',
        decryptedAt: new Date().toISOString(),
        emailId: mail.mailId
      });
      
    } catch (error) {
      console.error('Decrypt email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decrypt email: ' + error.message
      });
    }
  }
);

// ------------------ UPDATE EMAIL STATUS (STAR, IMPORTANT, DELETE) ------------------
app.put('/api/mail/:mailId/status', 
  [
    verifyToken,
    body('action').isIn(['star', 'unstar', 'important', 'unimportant', 'delete', 'restore']).withMessage('Invalid action'),
  ],
  async (req, res) => {
    try {
      const { mailId } = req.params;
      const { action } = req.body;
      const userEmail = req.user.email;
      
      console.log(`⚡ Updating status for email: ${mailId}, action: ${action}`);
      
      const mail = await Mail.findOne({ 
        mailId: mailId,
        owner: userEmail 
      });
      
      if (!mail) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }
      
      let update = {};
      
      switch (action) {
        case 'star':
          update.starred = true;
          break;
        case 'unstar':
          update.starred = false;
          break;
        case 'important':
          update.important = true;
          break;
        case 'unimportant':
          update.important = false;
          break;
        case 'delete':
          update.trash = true;
          break;
        case 'restore':
          update.trash = false;
          break;
      }
      
      mail.set(update);
      await mail.save();
      
      res.json({
        success: true,
        message: `Email ${action.replace('un', '')}ed successfully`,
        email: {
          id: mail.mailId,
          starred: mail.starred,
          important: mail.important,
          trash: mail.trash
        }
      });
      
    } catch (error) {
      console.error('Update email status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update email status'
      });
    }
  }
);

// ------------------ LOGOUT ------------------
app.post('/api/logout', verifyToken, (req, res) => {
  try {
    console.log(`👋 User logged out: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully from QuMail'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ------------------ SEED TEST DATA ------------------
app.post('/api/seed-test-data', async (req, res) => {
  try {
    const testUser = 'test@qumail.com';
    const testPassword = 'TestPassword123!';
    
    // Check if user already exists
    let user = await User.findOne({ email: testUser });
    
    if (!user) {
      // Create test user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      const otpKey = generateOTPKey(256);
      const aesKey = generateAESKey();
      
      user = await User.create({
        name: 'Test User',
        email: testUser,
        password: hashedPassword,
        settings: {
          emailNotifications: true,
          autoSaveDrafts: true,
          signature: 'Best regards,\nTest User',
          twoFactorEnabled: false,
          language: 'en',
          timezone: 'UTC'
        },
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        },
        storageUsed: 250 * 1024 * 1024, // 250MB
        storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
        isVerified: true,
        role: 'user',
        lastLogin: new Date()
      });
      
      console.log(`✅ Test user created: ${testUser}`);
    }
    
    // Clear existing test emails
    await Mail.deleteMany({ owner: testUser });
    
    // Seed test emails
    const now = new Date();
    const testEmails = [];
    
    for (let i = 1; i <= 10; i++) {
      const fromEmail = `sender${i}@qumail.com`;
      const mailId = uuidv4();
      const body = `This is test email ${i} content. Welcome to QuMail!\n\nThis email contains test content to demonstrate the QuMail platform features. You can reply, forward, or delete this email.\n\nRegards,\nSender ${i}`;
      
      // Create sender account if not exists
      await User.findOneAndUpdate(
        { email: fromEmail },
        {
          name: `Sender ${i}`,
          password: await bcrypt.hash('TestPassword123!', 12),
          settings: {
            emailNotifications: true,
            autoSaveDrafts: true,
            signature: '',
            twoFactorEnabled: false,
            language: 'en',
            timezone: 'UTC'
          },
          encryptionKeys: {
            otp: generateOTPKey(256),
            aes256: generateAESKey()
          }
        },
        { upsert: true }
      );
      
      const isEncrypted = i % 3 === 0;
      const isAES = i % 2 === 0;
      let encryptedBody = body;
      let aesKey = null;
      let aesIV = null;
      
      if (isEncrypted && isAES) {
        // Create AES encrypted email
        aesKey = generateAESKey();
        aesIV = generateAESIV();
        encryptedBody = encryptAES(body, aesKey, aesIV);
      } else if (isEncrypted) {
        // Create OTP encrypted email
        const otpKey = generateOTPKey(body.length);
        encryptedBody = otpEncrypt(body, otpKey);
      }
      
      // Add to test user's inbox
      testEmails.push({
        mailId: uuidv4(),
        from: fromEmail,
        to: testUser,
        subject: isEncrypted ? `🔒 Encrypted Test Email ${i}` : `Test Email ${i}`,
        body: encryptedBody,
        encryption: isEncrypted ? (isAES ? 'AES' : 'OTP') : 'NONE',
        aesKey: aesKey,
        aesIV: aesIV,
        folder: 'INBOX',
        owner: testUser,
        read: i % 2 === 0,
        starred: i % 4 === 0,
        important: i % 5 === 0,
        createdAt: new Date(now.getTime() - (i * 3600000))
      });
    }
    
    // Add sent emails
    for (let i = 1; i <= 5; i++) {
      const toEmail = `recipient${i}@qumail.com`;
      
      testEmails.push({
        mailId: uuidv4(),
        from: testUser,
        to: toEmail,
        subject: `Sent Test Email ${i}`,
        body: `This is a sent test email ${i} from the QuMail platform.\n\nThis demonstrates how sent emails appear in your sent folder.\n\nBest regards,\nTest User`,
        encryption: 'NONE',
        folder: 'SENT',
        owner: testUser,
        read: true,
        createdAt: new Date(now.getTime() - (i * 7200000))
      });
    }
    
    await Mail.insertMany(testEmails);
    
    res.json({
      success: true,
      message: 'Test data seeded successfully',
      user: {
        email: testUser,
        password: testPassword
      },
      counts: {
        inbox: testEmails.filter(e => e.folder === 'INBOX').length,
        sent: testEmails.filter(e => e.folder === 'SENT').length
      }
    });
    
  } catch (error) {
    console.error('Seed data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed test data'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// ------------------ START SERVER ------------------
const server = app.listen(PORT, () => {
  const dbStatus = isMongoConnected() ? '✓ Connected' : '✗ Not connected';
  
  console.log(`\n🚀 QuMail Quantum Platform Server`);
  console.log(`========================================`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log(`📧 Platform: Independent @qumail.com Network`);
  console.log(`🔐 Security: End-to-End Quantum-Resistant Encryption`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${dbStatus}`);
  console.log(`📁 Upload Directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   POST /api/register              - Register new user`);
  console.log(`   POST /api/login                 - Login`);
  console.log(`   GET  /api/profile              - Get user profile`);
  console.log(`   PUT  /api/profile              - Update user profile`);
  console.log(`   POST /api/change-password      - Change password`);
  console.log(`   POST /api/upload-avatar        - Upload avatar (Base64)`);
  console.log(`   DELETE /api/avatar             - Delete avatar`);
  console.log(`   POST /api/send                 - Send email (supports OTP/AES/none)`);
  console.log(`   POST /api/mail/inbox           - Get inbox emails`);
  console.log(`   POST /api/mail/sent            - Get sent emails`);
  console.log(`   GET  /api/mail/:mailId         - Get single email`);
  console.log(`   POST /api/decrypt              - Decrypt encrypted email`);
  console.log(`   PUT  /api/mail/:mailId/status  - Update email status`);
  console.log(`   POST /api/verify-token         - Verify JWT token`);
  console.log(`\n🔐 Encryption Support:`);
  console.log(`   • Standard Email (no encryption)`);
  console.log(`   • Quantum OTP (One-Time Pad)`);
  console.log(`   • Quantum AES-256-GCM`);
  console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});