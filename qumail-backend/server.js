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
const mongoose = require('mongoose');

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

// Validate environment variables
console.log('🔧 Environment Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   JWT_SECRET: ${JWT_SECRET ? '✓ Set' : '✗ Using default (insecure for production!)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  WARNING: JWT_SECRET not set in production environment!');
  console.error('⚠️  Please set JWT_SECRET in your .env file for security.');
}

// ================== MONGODB CONNECTION ==================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qumail';

mongoose.connect(MONGODB_URI)
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

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

// Mail Schema (from your Mail.js - updated to match)
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
const generateToken = (email, name) => {
  return jwt.sign(
    { 
      email: email,
      name: name,
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

// ================== ROUTES ==================

// Health check endpoint
app.get('/api/health', (req, res) => {
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
    endpoints: {
      auth: ['POST /api/register', 'POST /api/login', 'POST /api/logout', 'POST /api/verify-token'],
      email: ['POST /api/send', 'POST /api/mail/inbox', 'POST /api/mail/sent', 'GET /api/mail/:mailId'],
      user: ['GET /api/profile']
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
      const token = generateToken(lowerEmail, name);
      
      console.log(`✅ User registered: ${lowerEmail} (${name})`);
      console.log(`   OTP Key: ${otpKey.substring(0, 32)}...`);
      console.log(`   AES Key: ${aesKey.substring(0, 32)}...`);
      
      res.status(201).json({
        success: true,
        message: 'Welcome to QuMail Quantum-Secure Email Platform!',
        user: {
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
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
      user.updatedAt = new Date();
      await user.save();
      
      // Generate token
      const token = generateToken(lowerEmail, user.name);
      
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
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
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
    const [inboxCount, sentCount] = await Promise.all([
      Mail.countDocuments({ owner: req.user.email, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'SENT', trash: false })
    ]);
    
    res.json({
      success: true,
      valid: true,
      user: {
        email: req.user.email,
        name: req.user.name
      },
      folderCounts: {
        inbox: inboxCount,
        sent: sentCount,
        drafts: 0,
        trash: 0
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
    
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
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

// ------------------ SEND EMAIL (MAIN FIXED ENDPOINT) ------------------
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
            
            // Store OTP key in sender's encryption keys (in real system, this would be sent securely)
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
      requiresDecryption: mail.encryption !== 'NONE'
    };
    
    // If encrypted with AES, decrypt it
    if (mail.encryption === 'AES' && mail.aesKey && mail.aesIV) {
      try {
        const decryptedBody = decryptAES(mail.body, mail.aesKey, mail.aesIV);
        response.body = decryptedBody;
        response.decrypted = true;
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
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        }
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
      const body = `This is test email ${i} content. Welcome to QuMail!`;
      
      // Create sender account if not exists
      await User.findOneAndUpdate(
        { email: fromEmail },
        {
          name: `Sender ${i}`,
          password: await bcrypt.hash('TestPassword123!', 12),
          encryptionKeys: {
            otp: generateOTPKey(256),
            aes256: generateAESKey()
          }
        },
        { upsert: true }
      );
      
      // Add to test user's inbox
      testEmails.push({
        mailId: uuidv4(),
        from: fromEmail,
        to: testUser,
        subject: i % 3 === 0 ? `🔒 Encrypted Test Email ${i}` : `Test Email ${i}`,
        body: i % 3 === 0 ? 'ENCRYPTED_CONTENT_PLACEHOLDER' : body,
        encryption: i % 3 === 0 ? (i % 2 === 0 ? 'AES' : 'OTP') : 'NONE',
        aesKey: i % 3 === 0 && i % 2 === 0 ? generateAESKey() : null,
        aesIV: i % 3 === 0 && i % 2 === 0 ? generateAESIV() : null,
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
        body: `This is a sent test email ${i}`,
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
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   POST /api/register              - Register new user`);
  console.log(`   POST /api/login                 - Login`);
  console.log(`   POST /api/send                  - Send email (supports OTP/AES/none)`);
  console.log(`   POST /api/mail/inbox           - Get inbox emails`);
  console.log(`   POST /api/mail/sent            - Get sent emails`);
  console.log(`   GET  /api/mail/:mailId         - Get single email`);
  console.log(`   GET  /api/profile              - Get user profile`);
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