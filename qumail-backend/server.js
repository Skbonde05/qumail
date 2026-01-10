// server.js - QUMAIL INDEPENDENT PLATFORM BACKEND WITH QUANTUM ENCRYPTION

// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const axios = require("axios");

const app = express();

// Configure CORS properly
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'qumail-quantum-secure-key-2024';
const ENCRYPTION_SERVICE_URL = process.env.ENCRYPTION_SERVICE_URL || 'http://localhost:6000';

// Validate environment variables
console.log('🔧 Environment Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   JWT_SECRET: ${JWT_SECRET ? '✓ Set' : '✗ Using default (insecure for production!)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   ENCRYPTION_SERVICE: ${ENCRYPTION_SERVICE_URL}`);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  WARNING: JWT_SECRET not set in production environment!');
  console.error('⚠️  Please set JWT_SECRET in your .env file for security.');
}

// In-memory database (in production, use PostgreSQL/MongoDB)
const users = new Map(); // Store registered users
const emails = new Map(); // Store all emails by email address
const userDrafts = new Map(); // Store user drafts
const userFolders = new Map(); // Store custom user folders
const encryptionKeys = new Map(); // Store encryption keys for users
const otpOneTimeKeys = new Map(); // Store OTP one-time keys for specific emails
const emailStatus = new Map(); // Store email status (starred, snoozed, etc.)

// Initialize default folders
const defaultFolders = [
  { id: 'inbox', name: 'Inbox', icon: '📥', color: '#1a73e8', order: 1 },
  { id: 'starred', name: 'Starred', icon: '⭐', color: '#ffb300', order: 2 },
  { id: 'important', name: 'Important', icon: '⚠️', color: '#d32f2f', order: 3 },
  { id: 'snoozed', name: 'Snoozed', icon: '⏰', color: '#ff9800', order: 4 },
  { id: 'sent', name: 'Sent', icon: '📤', color: '#388e3c', order: 5 },
  { id: 'drafts', name: 'Drafts', icon: '📝', color: '#f57c00', order: 6 },
  { id: 'archive', name: 'Archive', icon: '📁', color: '#5d4037', order: 7 },
  { id: 'trash', name: 'Trash', icon: '🗑️', color: '#616161', order: 8 },
  { id: 'spam', name: 'Spam', icon: '🚫', color: '#ab47bc', order: 9 },
];

// Default user settings
const defaultSettings = {
  theme: 'light',
  encryptionLevel: 'otp',
  autoSaveDrafts: true,
  notifyOnNewMail: true,
  signature: `Sent securely via QuMail\nQuantum-Secure Email Platform`
};

// Validate email is @qumail.com
const validateQumailEmail = (email) => {
  return email.toLowerCase().endsWith('@qumail.com');
};

// Generate JWT token
const generateToken = (email, name) => {
  return jwt.sign(
    { 
      email: email,
      name: name,
      timestamp: Date.now(),
      type: 'qumail'
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Longer token for better UX
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
    
    // Verify it's a QuMail token
    if (decoded.type !== 'qumail') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    // Check if user exists in either storage
    if (!users.has(decoded.email)) {
      return res.status(401).json({
        success: false,
        message: 'User account not found'
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

// Generate quantum OTP key (hex format) - used only once per email
const generateOTPKey = (textLength) => {
  // OTP key must be at least as long as the text
  const keyLength = Math.ceil(textLength / 2) * 2; // Ensure even length for hex
  return crypto.randomBytes(keyLength).toString('hex');
};

// Generate AES key (hex format) - reusable
const generateAESKey = () => {
  return crypto.randomBytes(32).toString('hex'); // 256-bit key
};

// Validate hex key
const isValidHexKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  return /^[0-9a-fA-F]+$/.test(key);
};

// OTP Encryption - TRUE ONE-TIME PAD
const otpEncrypt = (text, key) => {
  try {
    if (!isValidHexKey(key)) {
      throw new Error('Invalid hex key format for OTP encryption');
    }
    
    const textBuffer = Buffer.from(text, 'utf8');
    const keyBuffer = Buffer.from(key, 'hex');
    
    // Check key length - for true OTP, key must be at least as long as text
    if (keyBuffer.length < textBuffer.length) {
      throw new Error(`OTP key too short! Key: ${keyBuffer.length} bytes, Text: ${textBuffer.length} bytes`);
    }
    
    // Use only as much key as needed
    const effectiveKey = keyBuffer.slice(0, textBuffer.length);
    const encrypted = Buffer.alloc(textBuffer.length);
    
    // XOR each byte (true OTP)
    for (let i = 0; i < textBuffer.length; i++) {
      encrypted[i] = textBuffer[i] ^ effectiveKey[i];
    }
    
    return encrypted.toString('hex');
  } catch (error) {
    console.error('OTP encryption error:', error);
    throw new Error(`OTP encryption failed: ${error.message}`);
  }
};

// OTP Decryption - same as encryption (XOR)
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

// AES-256-GCM Encryption
const aesEncrypt = (text, key) => {
  try {
    if (!isValidHexKey(key)) {
      throw new Error('Invalid hex key format for AES encryption');
    }
    
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error(`AES key must be 32 bytes (256 bits). Got: ${keyBuffer.length} bytes`);
    }
    
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      content: encrypted,
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('AES encryption error:', error);
    throw new Error(`AES encryption failed: ${error.message}`);
  }
};

// AES-256-GCM Decryption
const aesDecrypt = (encryptedData, key) => {
  try {
    if (!isValidHexKey(key)) {
      throw new Error('Invalid hex key format for AES decryption');
    }
    
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error(`AES key must be 32 bytes (256 bits). Got: ${keyBuffer.length} bytes`);
    }
    
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('AES decryption error:', error);
    throw new Error(`AES decryption failed: ${error.message}`);
  }
};

// Encryption handler
const encryptionAlgorithms = {
  otp: {
    encrypt: otpEncrypt,
    decrypt: otpDecrypt,
    generateKey: generateOTPKey
  },
  aes256: {
    encrypt: aesEncrypt,
    decrypt: aesDecrypt,
    generateKey: generateAESKey
  },
  none: {
    encrypt: (text) => text,
    decrypt: (text) => text,
    generateKey: () => null
  }
};

// Store encryption keys for users
const generateAndStoreUserKey = (email, encryptionLevel = 'otp') => {
  const algorithm = encryptionAlgorithms[encryptionLevel];
  if (!algorithm) {
    throw new Error(`Unsupported encryption level: ${encryptionLevel}`);
  }
  
  const key = algorithm.generateKey(256); // Generate default length key
  if (!encryptionKeys.has(email)) {
    encryptionKeys.set(email, new Map());
  }
  
  encryptionKeys.get(email).set(encryptionLevel, key);
  return key;
};

// Get user's encryption key
const getUserEncryptionKey = (email, encryptionLevel = 'otp') => {
  if (!encryptionKeys.has(email)) {
    // Generate new key if none exists
    return generateAndStoreUserKey(email, encryptionLevel);
  }
  
  const userKeys = encryptionKeys.get(email);
  if (!userKeys.has(encryptionLevel)) {
    // Generate key for this encryption level
    return generateAndStoreUserKey(email, encryptionLevel);
  }
  
  return userKeys.get(encryptionLevel);
};

// ================== MONGODB CODE ==================
const mongoose = require('mongoose');

// MONGODB CONNECTION
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qumail';

// Connect to MongoDB with updated options for mongoose 8+
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// USER MODEL
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
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  encryptionKeys: {
    otp: { type: String, default: null },
    aes256: { type: String, default: null }
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

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Helper function to synchronize user to in-memory storage
const syncUserToMemory = async (email) => {
  try {
    if (!users.has(email)) {
      const mongoUser = await User.findOne({ email });
      if (mongoUser) {
        const user = {
          id: uuidv4(),
          email: mongoUser.email,
          name: mongoUser.name,
          password: mongoUser.password,
          encryptionKeys: mongoUser.encryptionKeys || {},
          createdAt: mongoUser.createdAt || new Date().toISOString(),
          lastLogin: null,
          settings: defaultSettings,
          storageUsed: 0,
          isActive: true,
          isVerified: true
        };
        
        users.set(email, user);
        
        // Sync encryption keys to memory
        if (mongoUser.encryptionKeys?.otp) {
          if (!encryptionKeys.has(email)) {
            encryptionKeys.set(email, new Map());
          }
          encryptionKeys.get(email).set('otp', mongoUser.encryptionKeys.otp);
        }
        if (mongoUser.encryptionKeys?.aes256) {
          if (!encryptionKeys.has(email)) {
            encryptionKeys.set(email, new Map());
          }
          encryptionKeys.get(email).set('aes256', mongoUser.encryptionKeys.aes256);
        }
        
        if (!userFolders.has(email)) {
          userFolders.set(email, [...defaultFolders]);
        }
        if (!emails.has(email)) {
          emails.set(email, []);
        }
        
        console.log(`✅ User synchronized to memory: ${email}`);
        return user;
      }
    }
    return users.get(email);
  } catch (error) {
    console.error('Error syncing user to memory:', error);
    return null;
  }
};

// Save user encryption keys to MongoDB
const saveUserEncryptionKeys = async (email) => {
  try {
    if (isMongoConnected() && encryptionKeys.has(email)) {
      const userKeys = encryptionKeys.get(email);
      const updateData = {};
      
      if (userKeys.has('otp')) {
        updateData['encryptionKeys.otp'] = userKeys.get('otp');
      }
      if (userKeys.has('aes256')) {
        updateData['encryptionKeys.aes256'] = userKeys.get('aes256');
      }
      
      if (Object.keys(updateData).length > 0) {
        await User.findOneAndUpdate(
          { email: email },
          { $set: updateData },
          { new: true }
        );
        console.log(`✅ Saved encryption keys for ${email} to MongoDB`);
      }
    }
  } catch (error) {
    console.error('Error saving encryption keys to MongoDB:', error);
  }
};

// ================== HELPER FUNCTIONS FOR EMAIL STATUS ==================

// Initialize email status tracking for a user
const initializeUserEmailStatus = (email) => {
  if (!emailStatus.has(email)) {
    emailStatus.set(email, {
      starred: new Set(),
      snoozed: new Set(),
      important: new Set(),
      read: new Set(),
      unread: new Set()
    });
  }
};

// Update email status
const updateEmailStatus = (email, emailId, field, value) => {
  initializeUserEmailStatus(email);
  const status = emailStatus.get(email);
  
  switch (field) {
    case 'starred':
      if (value) {
        status.starred.add(emailId);
      } else {
        status.starred.delete(emailId);
      }
      break;
    case 'snoozed':
      if (value) {
        status.snoozed.add(emailId);
      } else {
        status.snoozed.delete(emailId);
      }
      break;
    case 'important':
      if (value) {
        status.important.add(emailId);
      } else {
        status.important.delete(emailId);
      }
      break;
    case 'read':
      if (value) {
        status.read.add(emailId);
        status.unread.delete(emailId);
      } else {
        status.read.delete(emailId);
        status.unread.add(emailId);
      }
      break;
  }
  
  emailStatus.set(email, status);
};

// Get counts for folders
const getFolderCounts = (email) => {
  const userEmails = emails.get(email) || [];
  const status = emailStatus.get(email) || {
    starred: new Set(),
    snoozed: new Set(),
    important: new Set(),
    read: new Set(),
    unread: new Set()
  };
  
  return {
    // Inbox: emails in inbox folder (not in trash, not draft)
    inbox: userEmails.filter(e => 
      e.folder === 'inbox' && !e.trash && !e.draft
    ).length,
    
    // Unread in inbox
    inboxUnread: userEmails.filter(e => 
      e.folder === 'inbox' && !e.trash && !e.draft && !e.read
    ).length,
    
    // Starred: emails marked as starred (from status tracking)
    starred: status.starred.size,
    
    // Important: emails marked as important
    important: status.important.size,
    
    // Snoozed: emails marked as snoozed
    snoozed: status.snoozed.size,
    
    // Sent: emails with sent flag
    sent: userEmails.filter(e => e.sent && !e.trash).length,
    
    // Drafts: emails with draft flag
    drafts: userEmails.filter(e => e.draft && !e.trash).length,
    
    // Archive: emails with archived flag
    archive: userEmails.filter(e => e.archived && !e.trash).length,
    
    // Trash: emails with trash flag
    trash: userEmails.filter(e => e.trash).length,
    
    // Spam: emails with spam flag
    spam: userEmails.filter(e => e.spam && !e.trash).length
  };
};

// ================== FIXED /send-email ENDPOINT ==================
app.post("/send-email", async (req, res) => {
  try {
    const { from, to, subject, body, mode } = req.body;

    // Validate required fields
    if (!from || !to || !subject || !body || !mode) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: from, to, subject, body, mode" 
      });
    }

    // Validate email format
    if (!validateQumailEmail(from) || !validateQumailEmail(to)) {
      return res.status(400).json({ 
        success: false, 
        message: "Both sender and recipient must use @qumail.com addresses" 
      });
    }

    console.log(`📧 Sending email: ${from} -> ${to} (${mode})`);

    // Check if sender exists
    const sender = users.get(from.toLowerCase());
    if (!sender) {
      return res.status(404).json({ 
        success: false, 
        message: "Sender account not found" 
      });
    }

    // Check if recipient exists
    const recipient = users.get(to.toLowerCase());
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        message: "Recipient account not found" 
      });
    }

    // Generate email ID
    const emailId = uuidv4();
    const timestamp = new Date().toISOString();

    let encryptedBody = body;
    let encryptionKey = null;
    let iv = null;
    let requiresDecryption = false;

    // Handle encryption
    if (mode.toLowerCase() === 'aes') {
      try {
        // Get or generate AES key for sender
        let aesKey = encryptionKeys.get(from.toLowerCase())?.get('aes256');
        if (!aesKey) {
          aesKey = generateAESKey();
          if (!encryptionKeys.has(from.toLowerCase())) {
            encryptionKeys.set(from.toLowerCase(), new Map());
          }
          encryptionKeys.get(from.toLowerCase()).set('aes256', aesKey);
          console.log(`Generated new AES key for ${from}: ${aesKey.substring(0, 32)}...`);
        }
        
        // Encrypt with AES
        const encryptedData = aesEncrypt(body, aesKey);
        encryptedBody = encryptedData.content;
        iv = encryptedData.iv;
        encryptionKey = aesKey;
        requiresDecryption = true;
        
        console.log(`✅ AES Encryption successful for ${from}`);
        
      } catch (aesError) {
        console.error('AES encryption error:', aesError);
        return res.status(500).json({ 
          success: false, 
          message: "AES encryption failed: " + aesError.message 
        });
      }
    } else if (mode.toLowerCase() === 'otp') {
      try {
        // Generate OTP key for this specific email
        const textLength = Buffer.from(body, 'utf8').length;
        const otpKey = generateOTPKey(textLength);
        
        // Encrypt with OTP
        encryptedBody = otpEncrypt(body, otpKey);
        encryptionKey = otpKey;
        requiresDecryption = true;
        
        // Store OTP key for recipient
        otpOneTimeKeys.set(emailId, otpKey);
        
        console.log(`✅ OTP Encryption successful for ${from}`);
        console.log(`   OTP Key stored: ${otpKey.substring(0, 32)}...`);
        
      } catch (otpError) {
        console.error('OTP encryption error:', otpError);
        return res.status(500).json({ 
          success: false, 
          message: "OTP encryption failed: " + otpError.message 
        });
      }
    } else if (mode.toLowerCase() === 'none') {
      // No encryption
      requiresDecryption = false;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Unsupported encryption mode. Use 'aes', 'otp', or 'none'" 
      });
    }

    // Create email object
    const email = {
      id: emailId,
      from: from,
      to: to,
      subject: subject,
      body: mode.toLowerCase() !== 'none' ? encryptedBody : body,
      originalBody: null,
      snippet: mode.toLowerCase() !== 'none' ? `🔒 Encrypted message (${mode.toUpperCase()})` : body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      createdAt: timestamp,
      updatedAt: timestamp,
      read: false,
      starred: false,
      important: false,
      draft: false,
      sent: true,
      trash: false,
      spam: false,
      archived: false,
      folder: 'inbox', // For recipient
      encrypted: mode.toLowerCase() !== 'none',
      encryptionLevel: mode.toLowerCase(),
      requiresDecryption: requiresDecryption,
      iv: iv,
      key: encryptionKey, // Store key for decryption
      mode: mode,
      attachments: [],
      size: body.length
    };

    // Store in sender's sent folder
    const senderEmails = emails.get(from.toLowerCase()) || [];
    const sentEmail = {
      ...email,
      id: uuidv4(),
      folder: 'sent',
      read: true,
      requiresDecryption: false,
      body: body, // Store original body for sender
      originalBody: body,
      snippet: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
      encrypted: false // Sender sees unencrypted version
    };
    senderEmails.push(sentEmail);
    emails.set(from.toLowerCase(), senderEmails);

    // Store in recipient's inbox
    const recipientEmails = emails.get(to.toLowerCase()) || [];
    recipientEmails.push(email);
    emails.set(to.toLowerCase(), recipientEmails);
    
    // Initialize status for recipient
    initializeUserEmailStatus(to.toLowerCase());
    updateEmailStatus(to.toLowerCase(), emailId, 'read', false);

    console.log(`✅ Email sent successfully: ${emailId}`);

    res.json({ 
      success: true,
      message: `Email sent successfully using ${mode.toUpperCase()} encryption`,
      emailId: emailId,
      sentAt: timestamp,
      encryption: {
        mode: mode,
        encrypted: mode.toLowerCase() !== 'none',
        keyPreview: encryptionKey ? encryptionKey.substring(0, 32) + '...' : null,
        ivPreview: iv ? iv.substring(0, 16) + '...' : null
      },
      autoRefresh: true // Signal client to refresh inbox
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + error.message
    });
  }
});

// ================== OTP ROUTES ==================
// Import OTP routes
const otpRoutes = require("./routes/otpRoutes.js");
app.use("/api", otpRoutes);

// If otpRoutes.js doesn't exist, create basic OTP endpoints here
if (!otpRoutes) {
  // Basic OTP key generation endpoint
  app.post('/api/otp/generate', (req, res) => {
    try {
      const { length = 256 } = req.body;
      const key = crypto.randomBytes(length).toString('hex');
      
      res.json({
        success: true,
        key: key,
        length: key.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate OTP key'
      });
    }
  });

  // OTP encryption endpoint
  app.post('/api/otp/encrypt', (req, res) => {
    try {
      const { text, key } = req.body;
      
      if (!text || !key) {
        return res.status(400).json({
          success: false,
          message: 'Text and key are required'
        });
      }
      
      const encrypted = otpEncrypt(text, key);
      
      res.json({
        success: true,
        encrypted: encrypted,
        keyPreview: key.substring(0, 32) + '...'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'OTP encryption failed: ' + error.message
      });
    }
  });

  // OTP decryption endpoint
  app.post('/api/otp/decrypt', (req, res) => {
    try {
      const { encrypted, key } = req.body;
      
      if (!encrypted || !key) {
        return res.status(400).json({
          success: false,
          message: 'Encrypted text and key are required'
        });
      }
      
      const decrypted = otpDecrypt(encrypted, key);
      
      res.json({
        success: true,
        decrypted: decrypted,
        keyPreview: key.substring(0, 32) + '...'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'OTP decryption failed: ' + error.message
      });
    }
  });
}

// ================== SIMPLE REGISTRATION ENDPOINT ==================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !email.endsWith("@qumail.com")) {
      return res.status(400).json({ success: false, message: "Use @qumail.com email" });
    }

    const lowerEmail = email.toLowerCase();
    
    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    }
    
    if (!password || password.length < 12) {
      return res.status(400).json({ success: false, message: "Password must be at least 12 characters" });
    }
    
    // Check both MongoDB AND in-memory storage
    let userExists = false;
    
    // Check MongoDB first
    if (isMongoConnected()) {
      const existingMongo = await User.findOne({ email: lowerEmail });
      if (existingMongo) {
        userExists = true;
      }
    }
    
    // Check in-memory storage
    if (users.has(lowerEmail)) {
      userExists = true;
    }
    
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password for MongoDB
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate encryption keys for new user
    const otpKey = generateOTPKey(256); // Generate long OTP key
    const aesKey = generateAESKey();
    
    // Create user in MongoDB with encryption keys
    if (isMongoConnected()) {
      await User.create({ 
        name: name.trim(), 
        email: lowerEmail, 
        password: hashedPassword,
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        }
      });
    }
    
    // Also add to in-memory storage for compatibility
    const user = {
      id: uuidv4(),
      email: lowerEmail,
      name: name.trim(),
      password: hashedPassword,
      encryptionKeys: {
        otp: otpKey,
        aes256: aesKey
      },
      createdAt: new Date().toISOString(),
      lastLogin: null,
      settings: defaultSettings,
      storageUsed: 0,
      isActive: true,
      isVerified: true
    };
    
    users.set(lowerEmail, user);
    
    // Store encryption keys in memory
    if (!encryptionKeys.has(lowerEmail)) {
      encryptionKeys.set(lowerEmail, new Map());
    }
    encryptionKeys.get(lowerEmail).set('otp', otpKey);
    encryptionKeys.get(lowerEmail).set('aes256', aesKey);
    
    userFolders.set(lowerEmail, [...defaultFolders]);
    emails.set(lowerEmail, []);
    initializeUserEmailStatus(lowerEmail);
    
    console.log(`✅ User registered: ${lowerEmail} (${name})`);
    console.log(`   Storage: ${isMongoConnected() ? 'MongoDB + Memory' : 'Memory only'}`);
    console.log(`   OTP Key generated: ${otpKey.substring(0, 32)}...`);
    console.log(`   AES Key generated: ${aesKey.substring(0, 32)}...`);

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        email: lowerEmail,
        name: name.trim()
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// SIMPLE LOGIN ENDPOINT - FIXED VERSION
app.post("/login-email", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    
    const lowerEmail = email.toLowerCase();
    
    console.log('🔐 Simple login attempt for:', lowerEmail);

    // First, try to sync from MongoDB if not in memory
    if (!users.has(lowerEmail) && isMongoConnected()) {
      await syncUserToMemory(lowerEmail);
    }

    // Check in-memory storage
    const user = users.get(lowerEmail);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "No account found with this email" 
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    users.set(lowerEmail, user);
    
    // Generate token
    const token = generateToken(lowerEmail, user.name);
    
    console.log(`✅ Login successful: ${lowerEmail}`);
    
    return res.json({ 
      success: true, 
      message: 'Login successful',
      token: token,
      user: { 
        email: user.email,
        name: user.name
      },
      folderCounts: getFolderCounts(lowerEmail)
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ================== REST OF THE EXISTING ENDPOINTS ==================

// ------------------ SERVER STATUS ------------------
app.get('/', (req, res) => {
  const dbStatus = isMongoConnected() ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'running', 
    message: 'QuMail Quantum-Secure Email Platform',
    version: '4.1',
    platform: 'Independent Secure Network',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    endpoints: {
      auth: ['POST /api/register', 'POST /api/login', 'POST /api/logout', 'POST /login-email', 'POST /register'],
      email: ['POST /api/emails', 'POST /api/email', 'POST /api/send', 'POST /send-email', 'POST /api/search', 'POST /api/decrypt'],
      encryption: ['POST /api/generate-keys', 'GET /api/encryption-status'],
      management: ['POST /api/email/update', 'POST /api/emails/bulk-update', 'POST /api/emails/move'],
      drafts: ['POST /api/draft', 'POST /api/drafts', 'POST /api/email/delete'],
      folders: ['GET /api/folders'],
      user: ['GET /api/profile', 'POST /api/verify-token'],
      admin: ['POST /api/seed-test-data'],
      otp: ['POST /api/otp/generate', 'POST /api/otp/encrypt', 'POST /api/otp/decrypt']
    },
    security: {
      encryption: 'End-to-End Quantum-Resistant',
      algorithms: ['OTP (One-Time Pad)', 'AES-256-GCM'],
      keyStorage: 'Secure In-Memory + MongoDB',
      network: 'Closed @qumail.com Ecosystem',
      storage: 'Encrypted Database'
    },
    config: {
      jwt: JWT_SECRET ? '✓ Configured' : '✗ Using default',
      port: PORT,
      mongodb: dbStatus,
      encryption_service: ENCRYPTION_SERVICE_URL
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = isMongoConnected() ? 'connected' : 'disconnected';
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    usersCount: users.size,
    emailsCount: Array.from(emails.values()).reduce((sum, userEmails) => sum + userEmails.length, 0),
    encryptedEmails: Array.from(emails.values()).reduce((sum, userEmails) => sum + userEmails.filter(e => e.encrypted).length, 0),
    platform: 'QuMail Quantum Platform',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    encryption_service: ENCRYPTION_SERVICE_URL,
    encryption: {
      otp: Array.from(encryptionKeys.values()).filter(keys => keys.has('otp')).length,
      aes256: Array.from(encryptionKeys.values()).filter(keys => keys.has('aes256')).length
    },
    uptime: process.uptime()
  });
});

// ------------------ ENCRYPTION STATUS ------------------
app.get('/api/encryption-status', verifyToken, (req, res) => {
  try {
    const email = req.user.email;
    const userKeys = encryptionKeys.get(email);
    
    res.json({
      success: true,
      hasOTPKey: userKeys?.has('otp') || false,
      hasAESKey: userKeys?.has('aes256') || false,
      otpKeyLength: userKeys?.get('otp')?.length || 0,
      aesKeyLength: userKeys?.get('aes256')?.length || 0,
      supportedAlgorithms: ['otp', 'aes256', 'none']
    });
    
  } catch (error) {
    console.error('Encryption status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ------------------ GENERATE ENCRYPTION KEYS ------------------
app.post('/api/generate-keys', verifyToken, async (req, res) => {
  try {
    const { algorithm = 'otp' } = req.body;
    const email = req.user.email;
    
    if (!['otp', 'aes256'].includes(algorithm)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid algorithm. Supported: otp, aes256'
      });
    }
    
    const key = encryptionAlgorithms[algorithm].generateKey(256);
    
    if (!encryptionKeys.has(email)) {
      encryptionKeys.set(email, new Map());
    }
    encryptionKeys.get(email).set(algorithm, key);
    
    // Save to MongoDB
    await saveUserEncryptionKeys(email);
    
    console.log(`✅ Generated new ${algorithm} key for ${email}: ${key.substring(0, 32)}...`);
    
    res.json({
      success: true,
      message: `New ${algorithm.toUpperCase()} key generated`,
      algorithm: algorithm,
      keyPreview: key.substring(0, 32) + '...',
      keyLength: key.length
    });
    
  } catch (error) {
    console.error('Generate keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate encryption keys: ' + error.message
    });
  }
});

// ------------------ REGISTRATION (UPDATED TO CHECK BOTH STORAGES) ------------------
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
      
      console.log('📝 Enhanced registration attempt for:', lowerEmail);
      
      // Check if user already exists in BOTH storages
      let userExists = false;
      
      // Check in-memory storage
      if (users.has(lowerEmail)) {
        userExists = true;
      }
      
      // Check MongoDB if connected
      if (isMongoConnected()) {
        const existingMongo = await User.findOne({ email: lowerEmail });
        if (existingMongo) {
          userExists = true;
        }
      }
      
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this @qumail.com address already exists'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate encryption keys for new user
      const otpKey = generateOTPKey(256); // Generate long OTP key
      const aesKey = generateAESKey();
      
      // Create user in memory
      const user = {
        id: uuidv4(),
        email: lowerEmail,
        name: name.trim(),
        password: hashedPassword,
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        },
        createdAt: new Date().toISOString(),
        lastLogin: null,
        settings: defaultSettings,
        storageUsed: 0,
        isActive: true,
        isVerified: true // Auto-verify for now, in production would need email verification
      };
      
      users.set(lowerEmail, user);
      
      // Store encryption keys in memory
      if (!encryptionKeys.has(lowerEmail)) {
        encryptionKeys.set(lowerEmail, new Map());
      }
      encryptionKeys.get(lowerEmail).set('otp', otpKey);
      encryptionKeys.get(lowerEmail).set('aes256', aesKey);
      
      // Also save to MongoDB if connected
      if (isMongoConnected()) {
        await User.create({
          name: name.trim(),
          email: lowerEmail,
          password: hashedPassword,
          encryptionKeys: {
            otp: otpKey,
            aes256: aesKey
          }
        });
        console.log(`✅ User saved to MongoDB: ${lowerEmail}`);
      }
      
      // Initialize user's folders
      userFolders.set(lowerEmail, [...defaultFolders]);
      
      // Initialize empty email storage
      emails.set(lowerEmail, []);
      
      // Initialize email status tracking
      initializeUserEmailStatus(lowerEmail);
      
      // Generate token
      const token = generateToken(lowerEmail, name);
      
      console.log(`✅ Enhanced user registered: ${lowerEmail} (${name})`);
      console.log(`   OTP Key: ${otpKey.substring(0, 32)}...`);
      console.log(`   AES Key: ${aesKey.substring(0, 32)}...`);
      
      res.status(201).json({
        success: true,
        message: 'Welcome to QuMail Quantum-Secure Email Platform!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token: token,
        settings: user.settings,
        folderCounts: getFolderCounts(lowerEmail)
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

// ------------------ LOGIN (UPDATED TO CHECK BOTH STORAGES) ------------------
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
      
      console.log('🔐 Enhanced login attempt for:', lowerEmail);
      
      // First, try to sync from MongoDB if user not in memory
      if (!users.has(lowerEmail) && isMongoConnected()) {
        await syncUserToMemory(lowerEmail);
      }
      
      // Check if user exists in memory (now includes synced MongoDB users)
      const user = users.get(lowerEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this @qumail.com address'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
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
      user.lastLogin = new Date().toISOString();
      users.set(lowerEmail, user);
      
      // Generate token
      const token = generateToken(lowerEmail, user.name);
      
      console.log(`✅ Enhanced login successful: ${lowerEmail}`);
      
      res.json({
        success: true,
        message: `Welcome back to QuMail, ${user.name}!`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token: token,
        settings: user.settings,
        folderCounts: getFolderCounts(lowerEmail)
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

// ------------------ GET USER PROFILE ------------------
app.get('/api/profile', verifyToken, (req, res) => {
  try {
    const email = req.user.email;
    const user = users.get(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Count emails
    const userEmails = emails.get(email) || [];
    const counts = getFolderCounts(email);
    
    // Calculate storage used (simplified)
    user.storageUsed = userEmails.reduce((total, email) => total + (email.size || 1000), 0);
    users.set(email, user);
    
    // Get encryption key status
    const userKeys = encryptionKeys.get(email);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        storageUsed: user.storageUsed,
        storageLimit: 10737418240, // 10GB default
        isVerified: user.isVerified,
        settings: user.settings
      },
      folderCounts: counts,
      encryption: {
        hasOTPKey: userKeys?.has('otp') || false,
        hasAESKey: userKeys?.has('aes256') || false,
        otpKeyPreview: userKeys?.get('otp') ? userKeys.get('otp').substring(0, 16) + '...' : null,
        aesKeyPreview: userKeys?.get('aes256') ? userKeys.get('aes256').substring(0, 16) + '...' : null
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

// ------------------ GET FOLDERS ------------------
app.get('/api/folders', verifyToken, (req, res) => {
  try {
    const email = req.user.email;
    
    // Get user's folders
    const folders = userFolders.get(email) || [...defaultFolders];
    
    // Get counts for each folder
    const counts = getFolderCounts(email);
    
    const foldersWithCounts = folders.map(folder => {
      let count = 0;
      let unread = 0;
      
      switch (folder.id) {
        case 'inbox':
          count = counts.inbox;
          unread = counts.inboxUnread;
          break;
        case 'starred':
          count = counts.starred;
          break;
        case 'important':
          count = counts.important;
          break;
        case 'snoozed':
          count = counts.snoozed;
          break;
        case 'sent':
          count = counts.sent;
          break;
        case 'drafts':
          count = counts.drafts;
          break;
        case 'archive':
          count = counts.archive;
          break;
        case 'trash':
          count = counts.trash;
          break;
        case 'spam':
          count = counts.spam;
          break;
        default:
          // Custom folders - check email status
          const userEmails = emails.get(email) || [];
          count = userEmails.filter(e => e.folder === folder.id && !e.trash).length;
      }
      
      return {
        ...folder,
        count: count,
        unread: unread
      };
    });
    
    res.json({
      success: true,
      folders: foldersWithCounts,
      systemFolders: defaultFolders.map(f => f.id),
      counts: counts
    });
    
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ------------------ FETCH EMAILS ------------------
app.post('/api/emails', verifyToken, async (req, res) => {
  try {
    const { folder = 'inbox', limit = 50, offset = 0, refresh = false } = req.body;
    const email = req.user.email;
    
    console.log(`📥 Fetching emails for: ${email}, folder: ${folder}, refresh: ${refresh}`);
    
    const userEmails = emails.get(email) || [];
    const status = emailStatus.get(email) || {
      starred: new Set(),
      snoozed: new Set(),
      important: new Set(),
      read: new Set(),
      unread: new Set()
    };
    
    let filteredEmails = [];
    
    // Filter by folder and status
    switch (folder) {
      case 'inbox':
        filteredEmails = userEmails.filter(e => 
          e.folder === 'inbox' && !e.trash && !e.draft && !e.snoozed
        );
        break;
      case 'starred':
        filteredEmails = userEmails.filter(e => 
          status.starred.has(e.id) && !e.trash
        );
        break;
      case 'important':
        filteredEmails = userEmails.filter(e => 
          status.important.has(e.id) && !e.trash
        );
        break;
      case 'snoozed':
        filteredEmails = userEmails.filter(e => 
          status.snoozed.has(e.id) && !e.trash
        );
        break;
      case 'sent':
        filteredEmails = userEmails.filter(e => 
          e.sent && !e.trash
        );
        break;
      case 'drafts':
        filteredEmails = userEmails.filter(e => 
          e.draft && !e.trash
        );
        break;
      case 'archive':
        filteredEmails = userEmails.filter(e => 
          e.archived && !e.trash
        );
        break;
      case 'trash':
        filteredEmails = userEmails.filter(e => 
          e.trash
        );
        break;
      case 'spam':
        filteredEmails = userEmails.filter(e => 
          e.spam && !e.trash
        );
        break;
      default:
        // Custom folder
        filteredEmails = userEmails.filter(e => 
          e.folder === folder && !e.trash
        );
    }
    
    // Sort by date (newest first)
    filteredEmails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const paginatedEmails = filteredEmails.slice(offset, offset + limit);
    
    // Format response with status flags
    const formattedEmails = paginatedEmails.map(email => ({
      id: email.id,
      uid: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      snippet: email.snippet,
      body: email.body,
      preview: email.snippet,
      date: email.createdAt,
      originalDate: email.createdAt,
      read: status.read.has(email.id) || email.read,
      starred: status.starred.has(email.id) || email.starred,
      important: status.important.has(email.id) || email.important,
      snoozed: status.snoozed.has(email.id) || email.snoozed,
      draft: email.draft,
      sent: email.sent,
      trash: email.trash,
      spam: email.spam,
      archived: email.archived,
      folder: email.folder,
      encrypted: email.encrypted,
      encryptionLevel: email.encryptionLevel,
      requiresDecryption: email.requiresDecryption || false,
      attachments: email.attachments || [],
      size: email.size || 0
    }));
    
    res.json({
      success: true,
      emails: formattedEmails,
      count: formattedEmails.length,
      total: filteredEmails.length,
      folder: folder,
      hasMore: filteredEmails.length > offset + limit,
      refreshed: refresh, // Signal that this was a refresh
      timestamp: new Date().toISOString(), // Add timestamp for cache busting
      folderCounts: getFolderCounts(email)
    });
    
  } catch (error) {
    console.error('Fetch emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails',
      error: error.message
    });
  }
});

// ------------------ GET SINGLE EMAIL ------------------
app.post('/api/email', verifyToken, async (req, res) => {
  try {
    const { emailId } = req.body;
    const userEmail = req.user.email;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: 'Email ID is required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const email = userEmails.find(e => e.id === emailId);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Mark as read when opened
    if (!email.read) {
      email.read = true;
      updateEmailStatus(userEmail, emailId, 'read', true);
      emails.set(userEmail, userEmails);
    }
    
    // Check if there's a one-time key stored for this email
    if (email.encryptionLevel === 'otp' && email.encrypted) {
      const otpKey = otpOneTimeKeys.get(emailId);
      if (otpKey) {
        email.otpKeyAvailable = true;
      }
    }
    
    res.json({
      success: true,
      email: {
        ...email,
        uid: email.id,
        read: email.read,
        starred: emailStatus.get(userEmail)?.starred.has(emailId) || email.starred,
        important: emailStatus.get(userEmail)?.important.has(emailId) || email.important,
        snoozed: emailStatus.get(userEmail)?.snoozed.has(emailId) || email.snoozed
      }
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

// ------------------ SEND EMAIL WITH ENCRYPTION ------------------
app.post('/api/send', 
  [
    verifyToken,
    body('to').isEmail().withMessage('Valid recipient email required').custom(validateQumailEmail).withMessage('Can only send to @qumail.com addresses'),
    body('subject').optional().trim().isLength({ max: 200 }).withMessage('Subject too long'),
    body('body').trim().notEmpty().withMessage('Message body is required'),
    body('encryptionLevel').optional().isIn(['none', 'otp', 'aes256']).withMessage('Invalid encryption level. Use: none, otp, or aes256')
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
      
      const { to, subject, body, encryptionLevel = 'none' } = req.body;
      const from = req.user.email;
      const user = users.get(from);
      
      console.log(`📧 Sending email from ${from} to ${to} with encryption: ${encryptionLevel}`);
      
      // Check if recipient exists
      const lowerTo = to.toLowerCase();
      const recipient = users.get(lowerTo);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient @qumail.com address not found'
        });
      }
      
      let encryptedBody = body;
      let encryptionKey = null;
      let requiresDecryption = false;
      let otpOneTimeKey = null;
      
      // Handle encryption
      if (encryptionLevel !== 'none') {
        try {
          // For OTP: Generate a new key for THIS specific email
          if (encryptionLevel === 'otp') {
            // Generate a new OTP key that's at least as long as the message
            const textLength = Buffer.from(body, 'utf8').length;
            otpOneTimeKey = generateOTPKey(textLength);
            
            console.log(`🔑 Generated OTP key for email: ${otpOneTimeKey.substring(0, 32)}...`);
            console.log(`   Text length: ${textLength} bytes, Key length: ${otpOneTimeKey.length} hex chars`);
            
            // Encrypt with the new OTP key
            encryptedBody = otpEncrypt(body, otpOneTimeKey);
            encryptionKey = otpOneTimeKey;
            requiresDecryption = true;
            
            console.log(`✅ OTP Encryption successful`);
            console.log(`   Plaintext: ${body.length} chars, Ciphertext: ${encryptedBody.length} hex chars`);
            
          } else if (encryptionLevel === 'aes256') {
            // For AES: Use sender's existing AES key
            const userKeys = encryptionKeys.get(from);
            if (!userKeys || !userKeys.has('aes256')) {
              throw new Error('No AES encryption key found for sender. Please generate one first.');
            }
            
            encryptionKey = userKeys.get('aes256');
            
            // Encrypt with AES
            const encryptedData = aesEncrypt(body, encryptionKey);
            encryptedBody = JSON.stringify(encryptedData);
            requiresDecryption = true;
            
            console.log(`✅ AES Encryption successful`);
            console.log(`   Key used: ${encryptionKey.substring(0, 32)}...`);
          }
          
        } catch (encryptionError) {
          console.error('Encryption failed:', encryptionError);
          return res.status(500).json({
            success: false,
            message: `Encryption failed: ${encryptionError.message}`,
            suggestion: 'Try sending without encryption or generate new encryption keys'
          });
        }
      }
      
      // Generate email ID
      const emailId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Create sent email for sender
      const sentEmail = {
        id: emailId,
        from: from,
        to: to,
        subject: subject || '(No Subject)',
        body: body, // Store original body for sender
        encryptedBody: encryptionLevel !== 'none' ? encryptedBody : null,
        snippet: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
        createdAt: timestamp,
        updatedAt: timestamp,
        read: true,
        starred: false,
        important: false,
        draft: false,
        sent: true,
        trash: false,
        spam: false,
        archived: false,
        folder: 'sent',
        encrypted: encryptionLevel !== 'none',
        encryptionLevel: encryptionLevel,
        encryptionKeyUsed: encryptionKey ? encryptionKey.substring(0, 32) + '...' : null,
        attachments: [],
        size: body.length
      };
      
      // Store in sender's emails
      const senderEmails = emails.get(from) || [];
      senderEmails.push(sentEmail);
      emails.set(from, senderEmails);
      
      // Create received email for recipient
      const receivedEmail = {
        id: uuidv4(),
        from: from,
        to: to,
        subject: encryptionLevel !== 'none' ? `🔒 ${subject || 'Encrypted Message'}` : (subject || '(No Subject)'),
        body: encryptedBody,
        originalBody: null,
        snippet: encryptionLevel !== 'none' ? '🔒 Encrypted message - Requires decryption' : (body.substring(0, 150) + (body.length > 150 ? '...' : '')),
        createdAt: timestamp,
        updatedAt: timestamp,
        read: false,
        starred: false,
        important: false,
        snoozed: false,
        draft: false,
        sent: false,
        trash: false,
        spam: false,
        archived: false,
        folder: 'inbox',
        encrypted: encryptionLevel !== 'none',
        encryptionLevel: encryptionLevel,
        requiresDecryption: requiresDecryption,
        senderEncryptionKey: encryptionKey ? encryptionKey.substring(0, 32) + '...' : null,
        attachments: [],
        size: body.length
      };
      
      // If OTP, store the one-time key for the recipient
      if (encryptionLevel === 'otp' && otpOneTimeKey) {
        otpOneTimeKeys.set(receivedEmail.id, otpOneTimeKey);
        console.log(`💾 Stored OTP key for email ${receivedEmail.id}: ${otpOneTimeKey.substring(0, 32)}...`);
        
        // Also store key reference in the email
        receivedEmail.otpKeyId = receivedEmail.id;
      }
      
      // Store in recipient's emails
      const recipientEmails = emails.get(lowerTo) || [];
      recipientEmails.push(receivedEmail);
      emails.set(lowerTo, recipientEmails);
      
      // Initialize status for recipient
      initializeUserEmailStatus(lowerTo);
      updateEmailStatus(lowerTo, receivedEmail.id, 'read', false);
      
      console.log(`✅ Email sent: ${emailId} from ${from} to ${to} (${encryptionLevel})`);
      
      res.json({
        success: true,
        message: `Email sent securely via QuMail Quantum Network (${encryptionLevel})`,
        messageId: emailId,
        sentAt: timestamp,
        encryption: {
          level: encryptionLevel,
          status: encryptionLevel === 'none' ? 'unencrypted' : 'encrypted',
          keyPreview: encryptionKey ? encryptionKey.substring(0, 16) + '...' : null,
          requiresDecryption: requiresDecryption,
          // For OTP, include the key for the recipient (in real system, this would be sent securely)
          ...(encryptionLevel === 'otp' && { 
            otpKey: otpOneTimeKey,
            note: 'In a real system, this key would be transmitted through a secure channel'
          })
        },
        recipient: {
          email: recipient.email,
          name: recipient.name
        },
        autoRefresh: true, // Signal client to refresh inbox
        folderCounts: getFolderCounts(from)
      });
      
    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email: ' + error.message
      });
    }
  }
);

// ------------------ DECRYPT EMAIL ------------------
app.post('/api/decrypt', verifyToken, async (req, res) => {
  try {
    const { emailId, encryptionKey } = req.body;
    const userEmail = req.user.email;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: 'Email ID is required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const email = userEmails.find(e => e.id === emailId);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    if (!email.encrypted) {
      return res.json({
        success: true,
        decrypted: email.body,
        encryptionLevel: 'none',
        alreadyDecrypted: true
      });
    }
    
    // For OTP emails, check if we have stored the key
    if (email.encryptionLevel === 'otp') {
      const storedKey = otpOneTimeKeys.get(emailId);
      if (storedKey) {
        // Use stored key if no key provided
        if (!encryptionKey) {
          encryptionKey = storedKey;
          console.log(`🔑 Using stored OTP key for email ${emailId}: ${storedKey.substring(0, 32)}...`);
        }
      }
    }
    
    if (!encryptionKey) {
      return res.status(400).json({
        success: false,
        message: 'Encryption key is required for decryption',
        ...(email.encryptionLevel === 'otp' && { 
          hint: 'For OTP, the key should be provided by the sender through a secure channel' 
        })
      });
    }
    
    // Validate hex key
    if (!isValidHexKey(encryptionKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid encryption key format. Must be a valid hex string.'
      });
    }
    
    // Decrypt based on encryption level
    const algorithm = encryptionAlgorithms[email.encryptionLevel];
    if (!algorithm) {
      return res.status(400).json({
        success: false,
        message: `Unsupported encryption algorithm: ${email.encryptionLevel}`
      });
    }
    
    let decryptedBody;
    
    try {
      if (email.encryptionLevel === 'otp') {
        decryptedBody = algorithm.decrypt(email.body, encryptionKey);
      } else if (email.encryptionLevel === 'aes256') {
        try {
          const encryptedData = JSON.parse(email.body);
          decryptedBody = algorithm.decrypt(encryptedData, encryptionKey);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid encrypted data format for AES-256'
          });
        }
      }
    } catch (decryptionError) {
      console.error('Decryption failed:', decryptionError);
      return res.status(400).json({
        success: false,
        message: 'Decryption failed. The encryption key might be incorrect.',
        hint: 'Make sure you are using the exact key provided by the sender'
      });
    }
    
    // Update email with decrypted content
    email.body = decryptedBody;
    email.originalBody = decryptedBody;
    email.requiresDecryption = false;
    email.snippet = decryptedBody.substring(0, 150) + (decryptedBody.length > 150 ? '...' : '');
    email.updatedAt = new Date().toISOString();
    
    // If OTP, remove the stored key after decryption (one-time use)
    if (email.encryptionLevel === 'otp') {
      otpOneTimeKeys.delete(emailId);
      console.log(`🗑️  Removed OTP key for email ${emailId} after decryption`);
    }
    
    emails.set(userEmail, userEmails);
    
    res.json({
      success: true,
      decrypted: decryptedBody,
      encryptionLevel: email.encryptionLevel,
      from: email.from,
      decryptedAt: new Date().toISOString(),
      message: 'Email successfully decrypted'
    });
    
  } catch (error) {
    console.error('Decrypt email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decrypt email: ' + error.message
    });
  }
});

// ------------------ GET OTP KEY FOR EMAIL ------------------
app.post('/api/email/otp-key', verifyToken, async (req, res) => {
  try {
    const { emailId } = req.body;
    const userEmail = req.user.email;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: 'Email ID is required'
      });
    }
    
    // Check if user has access to this email
    const userEmails = emails.get(userEmail) || [];
    const email = userEmails.find(e => e.id === emailId);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Check if it's an OTP encrypted email
    if (email.encryptionLevel !== 'otp' || !email.encrypted) {
      return res.status(400).json({
        success: false,
        message: 'Email is not OTP encrypted'
      });
    }
    
    // Get stored OTP key
    const otpKey = otpOneTimeKeys.get(emailId);
    
    if (!otpKey) {
      return res.status(404).json({
        success: false,
        message: 'OTP key not found. It may have been deleted after decryption or not stored.',
        hint: 'For OTP encrypted emails, the key must be obtained from the sender through a secure channel'
      });
    }
    
    res.json({
      success: true,
      emailId: emailId,
      from: email.from,
      subject: email.subject,
      otpKey: otpKey,
      keyPreview: otpKey.substring(0, 32) + '...',
      keyLength: otpKey.length,
      note: 'This key is for one-time use only. Store it securely.'
    });
    
  } catch (error) {
    console.error('Get OTP key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OTP key: ' + error.message
    });
  }
});

// ------------------ UPDATE EMAIL STATUS (star, snooze, important, read) ------------------
app.post('/api/email/update-status', verifyToken, async (req, res) => {
  try {
    const { emailId, field, value } = req.body;
    const userEmail = req.user.email;
    
    if (!emailId || !field) {
      return res.status(400).json({
        success: false,
        message: 'Email ID and field are required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const emailIndex = userEmails.findIndex(e => e.id === emailId);
    
    if (emailIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Update email status in tracking system
    updateEmailStatus(userEmail, emailId, field, value);
    
    // Also update the email object
    userEmails[emailIndex][field] = value;
    userEmails[emailIndex].updatedAt = new Date().toISOString();
    
    emails.set(userEmail, userEmails);
    
    res.json({
      success: true,
      message: `Email ${field} updated to ${value}`,
      emailId: emailId,
      field: field,
      value: value,
      folderCounts: getFolderCounts(userEmail)
    });
    
  } catch (error) {
    console.error('Update email status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email status',
      error: error.message
    });
  }
});

// ------------------ UPDATE EMAIL (for other updates) ------------------
app.post('/api/email/update', verifyToken, async (req, res) => {
  try {
    const { emailId, updates } = req.body;
    const userEmail = req.user.email;
    
    if (!emailId || !updates) {
      return res.status(400).json({
        success: false,
        message: 'Email ID and updates are required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const emailIndex = userEmails.findIndex(e => e.id === emailId);
    
    if (emailIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Update email
    userEmails[emailIndex] = {
      ...userEmails[emailIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    emails.set(userEmail, userEmails);
    
    res.json({
      success: true,
      message: 'Email updated successfully',
      email: userEmails[emailIndex],
      folderCounts: getFolderCounts(userEmail)
    });
    
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email',
      error: error.message
    });
  }
});

// ------------------ BULK UPDATE EMAILS ------------------
app.post('/api/emails/bulk-update', verifyToken, async (req, res) => {
  try {
    const { emailIds, updates } = req.body;
    const userEmail = req.user.email;
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0 || !updates) {
      return res.status(400).json({
        success: false,
        message: 'Email IDs array and updates are required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const updatedCount = userEmails.filter(email => {
      if (emailIds.includes(email.id)) {
        // Handle status updates separately
        if (updates.starred !== undefined) {
          updateEmailStatus(userEmail, email.id, 'starred', updates.starred);
        }
        if (updates.important !== undefined) {
          updateEmailStatus(userEmail, email.id, 'important', updates.important);
        }
        if (updates.snoozed !== undefined) {
          updateEmailStatus(userEmail, email.id, 'snoozed', updates.snoozed);
        }
        if (updates.read !== undefined) {
          updateEmailStatus(userEmail, email.id, 'read', updates.read);
        }
        
        Object.assign(email, updates, { updatedAt: new Date().toISOString() });
        return true;
      }
      return false;
    }).length;
    
    emails.set(userEmail, userEmails);
    
    res.json({
      success: true,
      message: `${updatedCount} emails updated successfully`,
      count: updatedCount,
      folderCounts: getFolderCounts(userEmail)
    });
    
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update emails',
      error: error.message
    });
  }
});

// ------------------ MOVE EMAILS ------------------
app.post('/api/emails/move', verifyToken, async (req, res) => {
  try {
    const { emailIds, targetFolder } = req.body;
    const userEmail = req.user.email;
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0 || !targetFolder) {
      return res.status(400).json({
        success: false,
        message: 'Email IDs array and target folder are required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const movedEmails = [];
    
    for (const email of userEmails) {
      if (emailIds.includes(email.id)) {
        // Update folder
        email.folder = targetFolder;
        email.updatedAt = new Date().toISOString();
        
        // Update other flags based on folder
        if (targetFolder === 'trash') {
          email.trash = true;
          // Remove from status tracking when moved to trash
          updateEmailStatus(userEmail, email.id, 'starred', false);
          updateEmailStatus(userEmail, email.id, 'important', false);
          updateEmailStatus(userEmail, email.id, 'snoozed', false);
        } else if (targetFolder === 'spam') {
          email.spam = true;
        } else if (targetFolder === 'archive') {
          email.archived = true;
        } else if (targetFolder === 'inbox') {
          email.trash = false;
          email.spam = false;
          email.archived = false;
        }
        
        movedEmails.push(email.id);
      }
    }
    
    emails.set(userEmail, userEmails);
    
    res.json({
      success: true,
      message: `${movedEmails.length} emails moved to ${targetFolder}`,
      count: movedEmails.length,
      emailIds: movedEmails,
      folderCounts: getFolderCounts(userEmail)
    });
    
  } catch (error) {
    console.error('Move emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move emails',
      error: error.message
    });
  }
});

// ------------------ DRAFT MANAGEMENT ------------------
app.post('/api/draft', verifyToken, async (req, res) => {
  try {
    const { to, subject, body, draftId = null } = req.body;
    const from = req.user.email;
    
    if (!body) {
      return res.status(400).json({
        success: false,
        message: 'Draft body is required'
      });
    }
    
    const userEmails = emails.get(from) || [];
    const timestamp = new Date().toISOString();
    
    let draft;
    
    if (draftId) {
      // Update existing draft
      const draftIndex = userEmails.findIndex(e => e.id === draftId && e.draft);
      if (draftIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Draft not found'
        });
      }
      
      draft = {
        ...userEmails[draftIndex],
        to: to || '',
        subject: subject || '',
        body: body,
        snippet: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
        updatedAt: timestamp
      };
      
      userEmails[draftIndex] = draft;
    } else {
      // Create new draft
      const newDraftId = uuidv4();
      draft = {
        id: newDraftId,
        from: from,
        to: to || '',
        subject: subject || '',
        body: body,
        snippet: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
        createdAt: timestamp,
        updatedAt: timestamp,
        read: true,
        starred: false,
        important: false,
        snoozed: false,
        draft: true,
        sent: false,
        trash: false,
        spam: false,
        archived: false,
        folder: 'drafts',
        encrypted: false,
        encryptionLevel: 'none',
        attachments: [],
        size: body.length
      };
      
      userEmails.push(draft);
    }
    
    emails.set(from, userEmails);
    
    res.json({
      success: true,
      message: draftId ? 'Draft updated successfully' : 'Draft saved successfully',
      draft: {
        ...draft,
        uid: draft.id
      },
      folderCounts: getFolderCounts(from)
    });
    
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message
    });
  }
});

// ------------------ GET DRAFTS ------------------
app.post('/api/drafts', verifyToken, (req, res) => {
  try {
    const userEmail = req.user.email;
    const userEmails = emails.get(userEmail) || [];
    
    const drafts = userEmails
      .filter(email => email.draft && !email.trash)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(draft => ({
        ...draft,
        uid: draft.id
      }));
    
    res.json({
      success: true,
      drafts: drafts,
      count: drafts.length,
      folderCounts: getFolderCounts(userEmail)
    });
    
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get drafts',
      error: error.message
    });
  }
});

// ------------------ DELETE EMAIL/DRAFT ------------------
app.post('/api/email/delete', verifyToken, async (req, res) => {
  try {
    const { emailId, permanent = false } = req.body;
    const userEmail = req.user.email;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: 'Email ID is required'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    
    if (permanent) {
      // Permanent delete - remove from emails array
      const filteredEmails = userEmails.filter(e => e.id !== emailId);
      emails.set(userEmail, filteredEmails);
      
      // Also remove from status tracking
      updateEmailStatus(userEmail, emailId, 'starred', false);
      updateEmailStatus(userEmail, emailId, 'important', false);
      updateEmailStatus(userEmail, emailId, 'snoozed', false);
      
      // Remove OTP key if exists
      otpOneTimeKeys.delete(emailId);
      
      res.json({
        success: true,
        message: 'Email permanently deleted',
        folderCounts: getFolderCounts(userEmail)
      });
    } else {
      // Move to trash
      const emailIndex = userEmails.findIndex(e => e.id === emailId);
      if (emailIndex !== -1) {
        userEmails[emailIndex].trash = true;
        userEmails[emailIndex].folder = 'trash';
        userEmails[emailIndex].updatedAt = new Date().toISOString();
        
        // Remove from status tracking when moved to trash
        updateEmailStatus(userEmail, emailId, 'starred', false);
        updateEmailStatus(userEmail, emailId, 'important', false);
        updateEmailStatus(userEmail, emailId, 'snoozed', false);
        
        emails.set(userEmail, userEmails);
      }
      
      res.json({
        success: true,
        message: 'Email moved to trash',
        folderCounts: getFolderCounts(userEmail)
      });
    }
    
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email',
      error: error.message
    });
  }
});

// ------------------ EMPTY TRASH ------------------
app.post('/api/trash/empty', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userEmails = emails.get(userEmail) || [];
    
    // Filter out emails in trash
    const filteredEmails = userEmails.filter(email => !email.trash);
    
    // Find emails that were removed
    const removedEmails = userEmails.filter(email => email.trash);
    
    // Remove status tracking for all deleted emails
    removedEmails.forEach(email => {
      updateEmailStatus(userEmail, email.id, 'starred', false);
      updateEmailStatus(userEmail, email.id, 'important', false);
      updateEmailStatus(userEmail, email.id, 'snoozed', false);
      otpOneTimeKeys.delete(email.id);
    });
    
    emails.set(userEmail, filteredEmails);
    
    res.json({
      success: true,
      message: `Permanently deleted ${removedEmails.length} emails from trash`,
      count: removedEmails.length,
      folderCounts: getFolderCounts(userEmail)
    });
    
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to empty trash',
      error: error.message
    });
  }
});

// ------------------ SEARCH EMAILS ------------------
app.post('/api/search', verifyToken, async (req, res) => {
  try {
    const { query, folder = 'all' } = req.body;
    const userEmail = req.user.email;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const userEmails = emails.get(userEmail) || [];
    const status = emailStatus.get(userEmail) || {
      starred: new Set(),
      snoozed: new Set(),
      important: new Set(),
      read: new Set(),
      unread: new Set()
    };
    
    let filteredEmails = [];
    
    // Filter by folder if not 'all'
    if (folder !== 'all') {
      filteredEmails = userEmails.filter(email => {
        if (email.trash) return false;
        
        switch (folder) {
          case 'inbox': 
            return email.folder === 'inbox' && !email.draft && !email.snoozed;
          case 'starred': 
            return status.starred.has(email.id);
          case 'important': 
            return status.important.has(email.id);
          case 'snoozed': 
            return status.snoozed.has(email.id);
          case 'sent': 
            return email.sent;
          case 'drafts': 
            return email.draft;
          case 'archive': 
            return email.archived;
          case 'trash': 
            return email.trash;
          case 'spam': 
            return email.spam;
          default: 
            return email.folder === folder;
        }
      });
    } else {
      filteredEmails = userEmails.filter(email => !email.trash);
    }
    
    // Search in subject, body, from, to
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    const results = filteredEmails.filter(email => {
      const searchable = [
        email.subject || '',
        email.body || '',
        email.from || '',
        email.to || '',
        email.snippet || ''
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchable.includes(term));
    });
    
    // Add status flags to results
    const resultsWithStatus = results.map(email => ({
      ...email,
      uid: email.id,
      starred: status.starred.has(email.id),
      important: status.important.has(email.id),
      snoozed: status.snoozed.has(email.id),
      read: status.read.has(email.id) || email.read
    }));
    
    // Sort by relevance (simplified - by date)
    resultsWithStatus.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      results: resultsWithStatus,
      count: results.length,
      query: query
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search emails',
      error: error.message
    });
  }
});

// ------------------ LOGOUT ------------------
app.post('/api/logout', verifyToken, (req, res) => {
  try {
    // In JWT system, logout is client-side by deleting token
    // We could implement token blacklisting here if needed
    
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

// ------------------ VERIFY TOKEN ------------------
app.post('/api/verify-token', verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      valid: true,
      user: {
        email: req.user.email,
        name: req.user.name
      },
      folderCounts: getFolderCounts(req.user.email)
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token'
    });
  }
});

// ------------------ UPDATE USER SETTINGS ------------------
app.post('/api/user/settings', verifyToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const email = req.user.email;
    
    const user = users.get(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update settings
    user.settings = {
      ...user.settings,
      ...settings
    };
    
    users.set(email, user);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// ------------------ SEED TEST DATA ------------------
app.post('/api/seed-test-data', async (req, res) => {
  try {
    const testUser = 'test@qumail.com';
    const testPassword = 'TestPassword123!';
    
    // Check if user already exists in MongoDB
    if (isMongoConnected()) {
      const existingMongo = await User.findOne({ email: testUser });
      if (existingMongo) {
        // Update in-memory storage with MongoDB user
        const user = {
          id: uuidv4(),
          email: testUser,
          name: existingMongo.name,
          password: existingMongo.password,
          encryptionKeys: existingMongo.encryptionKeys || {},
          createdAt: existingMongo.createdAt || new Date().toISOString(),
          lastLogin: null,
          settings: defaultSettings,
          storageUsed: 0,
          isActive: true,
          isVerified: true
        };
        
        users.set(testUser, user);
        
        // Sync encryption keys
        if (existingMongo.encryptionKeys?.otp) {
          if (!encryptionKeys.has(testUser)) {
            encryptionKeys.set(testUser, new Map());
          }
          encryptionKeys.get(testUser).set('otp', existingMongo.encryptionKeys.otp);
        }
        if (existingMongo.encryptionKeys?.aes256) {
          if (!encryptionKeys.has(testUser)) {
            encryptionKeys.set(testUser, new Map());
          }
          encryptionKeys.get(testUser).set('aes256', existingMongo.encryptionKeys.aes256);
        }
        
        userFolders.set(testUser, [...defaultFolders]);
        emails.set(testUser, []);
        initializeUserEmailStatus(testUser);
        
        return res.json({
          success: true,
          message: 'Test user already exists, synchronized from MongoDB',
          user: {
            email: testUser,
            password: testPassword,
            note: 'Password may not match if changed in MongoDB'
          }
        });
      }
    }
    
    // Create test user if not exists
    if (!users.has(testUser)) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      // Generate encryption keys
      const otpKey = generateOTPKey(256);
      const aesKey = generateAESKey();
      
      const user = {
        id: uuidv4(),
        email: testUser,
        name: 'Test User',
        password: hashedPassword,
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        },
        createdAt: new Date().toISOString(),
        lastLogin: null,
        settings: defaultSettings,
        storageUsed: 0,
        isActive: true,
        isVerified: true
      };
      
      users.set(testUser, user);
      
      // Store encryption keys
      if (!encryptionKeys.has(testUser)) {
        encryptionKeys.set(testUser, new Map());
      }
      encryptionKeys.get(testUser).set('otp', otpKey);
      encryptionKeys.get(testUser).set('aes256', aesKey);
      
      userFolders.set(testUser, [...defaultFolders]);
      emails.set(testUser, []);
      initializeUserEmailStatus(testUser);
      
      // Also save to MongoDB if connected
      if (isMongoConnected()) {
        await User.create({
          name: 'Test User',
          email: testUser,
          password: hashedPassword,
          encryptionKeys: {
            otp: otpKey,
            aes256: aesKey
          }
        });
      }
    }
    
    // Seed some test emails (including encrypted ones)
    const testEmails = emails.get(testUser) || [];
    const now = new Date();
    
    // Clear existing test emails
    emails.set(testUser, []);
    
    // Initialize fresh status
    const status = emailStatus.get(testUser) || {
      starred: new Set(),
      snoozed: new Set(),
      important: new Set(),
      read: new Set(),
      unread: new Set()
    };
    
    for (let i = 1; i <= 15; i++) {
      let body = `This is test email ${i} content. It contains some text for testing purposes.`;
      let encrypted = false;
      let encryptionLevel = 'none';
      let requiresDecryption = false;
      let emailId = uuidv4();
      
      // Make some emails encrypted
      if (i % 3 === 0) {
        // OTP encrypted email
        const textLength = Buffer.from(body, 'utf8').length;
        const otpKey = generateOTPKey(textLength);
        
        try {
          const encryptedBody = otpEncrypt(body, otpKey);
          body = encryptedBody;
          encrypted = true;
          encryptionLevel = 'otp';
          requiresDecryption = true;
          
          // Store OTP key
          otpOneTimeKeys.set(emailId, otpKey);
          
          console.log(`🔑 Created OTP test email ${i} with key: ${otpKey.substring(0, 32)}...`);
        } catch (error) {
          console.error(`Failed to encrypt test email ${i}:`, error);
        }
      } else if (i % 3 === 1) {
        // AES encrypted email
        const aesKey = encryptionKeys.get(testUser)?.get('aes256');
        if (aesKey) {
          try {
            const encryptedData = aesEncrypt(body, aesKey);
            body = JSON.stringify(encryptedData);
            encrypted = true;
            encryptionLevel = 'aes256';
            requiresDecryption = true;
          } catch (error) {
            console.error(`Failed to encrypt test email ${i}:`, error);
          }
        }
      }
      
      const email = {
        id: emailId,
        from: `sender${i}@qumail.com`,
        to: testUser,
        subject: encrypted ? `🔒 Test Encrypted Email ${i}` : `Test Email ${i}`,
        body: body,
        snippet: encrypted ? '🔒 Encrypted message - Requires decryption' : `This is test email ${i} content. It contains...`,
        createdAt: new Date(now.getTime() - (i * 3600000)).toISOString(), // 1 hour apart
        updatedAt: new Date(now.getTime() - (i * 3600000)).toISOString(),
        read: i % 3 === 0, // Some read, some unread
        starred: i % 4 === 0,
        important: i % 5 === 0,
        snoozed: i % 6 === 0,
        draft: i % 7 === 0,
        sent: i > 5,
        trash: false,
        spam: false,
        archived: i > 10,
        folder: i > 10 ? 'archive' : 'inbox',
        encrypted: encrypted,
        encryptionLevel: encryptionLevel,
        requiresDecryption: requiresDecryption,
        attachments: [],
        size: 1000 + (i * 100)
      };
      
      testEmails.push(email);
      
      // Update status tracking
      if (email.starred) status.starred.add(emailId);
      if (email.important) status.important.add(emailId);
      if (email.snoozed) status.snoozed.add(emailId);
      if (email.read) status.read.add(emailId);
      else status.unread.add(emailId);
    }
    
    // Add a draft
    const draftId = uuidv4();
    const draft = {
      id: draftId,
      from: testUser,
      to: 'recipient@qumail.com',
      subject: 'Draft email',
      body: 'This is a draft email that has not been sent yet.',
      snippet: 'This is a draft email that has not been sent yet...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: true,
      starred: false,
      important: false,
      snoozed: false,
      draft: true,
      sent: false,
      trash: false,
      spam: false,
      archived: false,
      folder: 'drafts',
      encrypted: false,
      encryptionLevel: 'none',
      attachments: [],
      size: 500
    };
    testEmails.push(draft);
    
    // Add a trash email
    const trashId = uuidv4();
    const trashEmail = {
      id: trashId,
      from: 'deleted@qumail.com',
      to: testUser,
      subject: 'Deleted email',
      body: 'This email has been moved to trash.',
      snippet: 'This email has been moved to trash...',
      createdAt: new Date(now.getTime() - (24 * 3600000)).toISOString(),
      updatedAt: new Date(now.getTime() - (24 * 3600000)).toISOString(),
      read: true,
      starred: false,
      important: false,
      snoozed: false,
      draft: false,
      sent: false,
      trash: true,
      spam: false,
      archived: false,
      folder: 'trash',
      encrypted: false,
      encryptionLevel: 'none',
      attachments: [],
      size: 300
    };
    testEmails.push(trashEmail);
    
    emails.set(testUser, testEmails);
    emailStatus.set(testUser, status);
    
    const counts = getFolderCounts(testUser);
    
    res.json({
      success: true,
      message: 'Test user created with sample emails',
      user: {
        email: testUser,
        password: testPassword
      },
      encryption: {
        otpKey: encryptionKeys.get(testUser)?.get('otp')?.substring(0, 32) + '...',
        aesKey: encryptionKeys.get(testUser)?.get('aes256')?.substring(0, 32) + '...'
      },
      counts: counts,
      note: 'Use these credentials for testing'
    });
    
  } catch (error) {
    console.error('Seed data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed test data'
    });
  }
});

// ------------------ CLEAR TEST DATA ------------------
app.post('/api/clear-test-data', async (req, res) => {
  try {
    const testUser = 'test@qumail.com';
    
    // Clear from memory
    users.delete(testUser);
    emails.delete(testUser);
    userFolders.delete(testUser);
    encryptionKeys.delete(testUser);
    emailStatus.delete(testUser);
    
    // Clear all OTP keys
    for (const [key, value] of otpOneTimeKeys.entries()) {
      otpOneTimeKeys.delete(key);
    }
    
    // Clear from MongoDB if connected
    if (isMongoConnected()) {
      await User.deleteOne({ email: testUser });
    }
    
    res.json({
      success: true,
      message: 'Test data cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear test data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear test data'
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
  console.log(`🔧 Encryption Service: ${ENCRYPTION_SERVICE_URL}`);
  console.log(`👥 Users: ${users.size} registered users`);
  console.log(`📧 Email Status Tracking: Enabled`);
  console.log(`🔑 Email Status Features:`);
  console.log(`   • Starred emails properly tracked`);
  console.log(`   • Snoozed emails properly tracked`);
  console.log(`   • Important emails properly tracked`);
  console.log(`   • Draft emails properly saved`);
  console.log(`   • Archive emails properly managed`);
  console.log(`   • Trash emails with permanent delete`);
  console.log(`   • Real-time folder counts`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   POST /api/email/update-status  - Update email status (star, snooze, important, read)`);
  console.log(`   POST /api/trash/empty          - Permanently delete emails from trash`);
  console.log(`   GET  /api/folders              - Get folders with real counts`);
  console.log(`   POST /api/draft                - Save/update drafts`);
  console.log(`   POST /api/emails/move          - Move emails between folders`);
  console.log(`\n💡 Key Features Implemented:`);
  console.log(`   • Starred emails visible in Starred folder`);
  console.log(`   • Snoozed emails visible in Snoozed folder`);
  console.log(`   • Draft emails visible in Drafts folder`);
  console.log(`   • Archive emails visible in Archive folder`);
  console.log(`   • Trash emails with permanent deletion`);
  console.log(`   • Real counts shown on sidebar like Gmail`);
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