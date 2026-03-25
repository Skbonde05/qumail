const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Mail = require('../models/Mail');
const SecurityLog = require('../models/SecurityLog');
const Notification = require('../models/Notification');
const { verifyToken, validateQumailEmail } = require('../middleware/authMiddleware');
const { generateOTPKey, generateAESKey } = require('../utils/encryption');
const { authLimiter } = require('../middleware/rateLimit');

// Helper to log security actions
const addLog = async (userId, action, details, type = 'info', req = null) => {
  try {
    const log = {
      userId,
      action,
      details,
      type,
      timestamp: new Date()
    };
    
    if (req) {
      log.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      log.deviceInfo = req.headers['user-agent'];
    }
    
    await SecurityLog.create(log);
  } catch (error) {
    console.error('Logging error:', error);
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'qumail-quantum-secure-key-2024';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'qumail-refresh-secret-2024';
const ACCESS_EXPIRE = process.env.ACCESS_EXPIRE || '1d';
const REFRESH_EXPIRE = process.env.REFRESH_EXPIRE || '7d';

// Generate JWT access token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'qumail'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRE }
  );
};

// Generate JWT refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      type: 'qumail-refresh'
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRE }
  );
};

// ------------------ REGISTRATION ------------------
router.post('/register', authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().withMessage('Valid email required').custom(validateQumailEmail).withMessage('Only @qumail.com addresses allowed'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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
      
      // Generate encryption keys and recovery code
      const otpKey = generateOTPKey(256);
      const aesKey = generateAESKey();
      const recoveryCode = `QU-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // Create user
      const user = await User.create({
        name: name.trim(),
        email: lowerEmail,
        password: hashedPassword,
        recoveryCode: recoveryCode,
        encryptionKeys: {
          otp: otpKey,
          aes256: aesKey
        }
      });

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();
      
      res.status(201).json({
        success: true,
        message: 'Welcome to QuMail Quantum-Secure Email Platform!',
        recoveryCode: recoveryCode, // Only shown once during registration
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          settings: user.settings,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit
        },
        token: token,
        accessToken: token,
        refreshToken: refreshToken
      });

      // Log registration
      await addLog(user._id, 'ACCOUNT_CREATED', `Account ${user.email} created successfully`, 'success', req);

      // Create initial notification
      await Notification.create({
        userId: user._id,
        title: 'Welcome to QuMail!',
        message: 'Your quantum-secure mailbox is ready to use.',
        type: 'success',
        icon: 'VerifiedUser'
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

// ------------------ FORGOT PASSWORD ------------------
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().withMessage('Valid email required').custom(validateQumailEmail).withMessage('Only @qumail.com addresses allowed')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal user existence in security sensitive paths
      return res.json({ success: true, message: 'If that email is in our system, a reset link will be sent.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // In production, send email. Here we simulate it by logging to console/returning it for demo.
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    console.log(`[PASS_RESET] Reset link for ${email}: ${resetUrl}`);

    res.json({ 
      success: true, 
      message: 'Reset link generated (check backend console in demo)',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined // For ease of testing in dev
    });

    await addLog(user._id, 'PASSWORD_RESET_REQUESTED', `Password reset requested for ${email}`, 'warning', req);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ------------------ VERIFY RECOVERY CODE ------------------
router.post('/verify-recovery-code', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('recoveryCode').notEmpty().withMessage('Recovery code required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, recoveryCode } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.recoveryCode !== recoveryCode.trim().toUpperCase()) {
      return res.status(401).json({ success: false, message: 'Invalid email or recovery code' });
    }

    // Generate temporary reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    res.json({ 
      success: true, 
      message: 'Recovery code verified successfully',
      resetToken: resetToken
    });

    await addLog(user._id, 'RECOVERY_CODE_USED', `Recovery code used for password reset by ${email}`, 'warning', req);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ------------------ RESET PASSWORD ------------------
router.get('/verify-reset-token/:token', authLimiter, async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, valid: false, message: 'Invalid or expired reset token' });
    }

    res.json({ success: true, valid: true });
  } catch (error) {
    res.status(500).json({ success: false, valid: false, message: 'Internal server error' });
  }
});

router.post('/reset-password', authLimiter, [
  body('token').notEmpty().withMessage('Token required'),
  body('password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { token, password } = req.body;

  try {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please login with your new password.' });

    await addLog(user._id, 'PASSWORD_RESET_COMPLETED', `Password reset completed for ${user.email}`, 'info', req);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ------------------ LOGIN ------------------
router.post('/login', authLimiter,
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
      
      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Update user with refresh token
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();
      
      // Log login
      await addLog(user._id, 'LOGIN', `Login successful at ${user.lastLogin}`, 'success', req);
      
      // Get email counts for response
      const [inboxCount, sentCount, archiveCount, trashCount] = await Promise.all([
        Mail.countDocuments({ owner: lowerEmail, folder: 'INBOX', trash: false }),
        Mail.countDocuments({ owner: lowerEmail, folder: 'SENT', trash: false }),
        Mail.countDocuments({ owner: lowerEmail, folder: 'ARCHIVE', trash: false }),
        Mail.countDocuments({ owner: lowerEmail, trash: true })
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
        accessToken: token,
        refreshToken: refreshToken,
        folderCounts: {
          inbox: inboxCount,
          sent: sentCount,
          archive: archiveCount,
          trash: trashCount
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
router.post('/verify-token', verifyToken, async (req, res) => {
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
    const [inboxCount, sentCount, archiveCount, trashCount] = await Promise.all([
      Mail.countDocuments({ owner: req.user.email, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'SENT', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'ARCHIVE', trash: false }),
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
        archive: archiveCount,
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

// ------------------ GET USER PROFILE ------------------
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const [inboxCount, sentCount, archiveCount, trashCount] = await Promise.all([
      Mail.countDocuments({ owner: req.user.email, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'SENT', trash: false }),
      Mail.countDocuments({ owner: req.user.email, folder: 'ARCHIVE', trash: false }),
      Mail.countDocuments({ owner: req.user.email, trash: true })
    ]);
    
    const storagePercentage = user.storageLimit > 0 ? (user.storageUsed / user.storageLimit) * 100 : 0;
    
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
        storagePercentage,
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
        archive: archiveCount,
        trash: trashCount
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ------------------ UPDATE USER PROFILE ------------------
router.put('/profile', 
  [
    verifyToken,
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('settings.emailNotifications').optional().isBoolean(),
    body('settings.autoSaveDrafts').optional().isBoolean(),
    body('settings.signature').optional().trim().isLength({ max: 1000 }),
    body('settings.twoFactorEnabled').optional().isBoolean(),
    body('settings.timezone').optional(),
    body('settings.language').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      
      const { name, settings } = req.body;
      const user = await User.findOne({ email: req.user.email });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      if (name) user.name = name.trim();
      if (settings) {
        user.settings = { ...user.settings, ...settings };
      }
      
      await user.save();
      
      res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }
);

// ------------------ CHANGE PASSWORD ------------------
router.post('/change-password',
  [
    verifyToken,
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    body('confirmPassword').custom((value, { req }) => value === req.body.newPassword)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      
      const { currentPassword, newPassword } = req.body;
      const user = await User.findOne({ email: req.user.email });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      
      // Log password change
      await addLog(user._id, 'PASSWORD_CHANGED', 'User password updated', 'warning', req);
      
      res.json({ success: true, message: 'Password changed successfully', token: generateToken(user) });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  }
);

// ------------------ UPLOAD AVATAR ------------------
router.post('/upload-avatar', verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ success: false, message: 'Avatar data is required' });
    
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.avatar = avatar;
    await user.save();
    
    res.json({ success: true, message: 'Avatar uploaded successfully', avatar: user.avatar });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ DELETE AVATAR ------------------
router.delete('/avatar', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.avatar = '';
    await user.save();
    
    res.json({ success: true, message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete avatar' });
  }
});

// ------------------ REFRESH TOKEN ------------------
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });
    
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    
    const accessToken = generateToken(user);
    res.json({ success: true, accessToken, token: accessToken });
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token verification failed' });
  }
});

// ------------------ LOGOUT ------------------
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ------------------ SECURITY LOGS ------------------
router.get('/security-logs', verifyToken, async (req, res) => {
  try {
    const logs = await SecurityLog.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch security logs' });
  }
});

// ------------------ ENCRYPTION KEYS ------------------
router.get('/encryption-keys', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+encryptionKeys');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Return only length and existence to be secure
    res.json({
      success: true,
      keys: {
        otp: user.encryptionKeys?.otp ? { 
          exists: true, 
          length: user.encryptionKeys.otp.length,
          preview: '••••' + user.encryptionKeys.otp.slice(-4)
        } : null,
        aes256: user.encryptionKeys?.aes256 ? { 
          exists: true, 
          length: user.encryptionKeys.aes256.length,
          preview: '••••' + user.encryptionKeys.aes256.slice(-4)
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch key info' });
  }
});

// To actually get the key for sharing/copying
router.post('/get-encryption-key', verifyToken, async (req, res) => {
  try {
    const { algorithm } = req.body;
    const user = await User.findById(req.user.id).select('+encryptionKeys');
    
    if (algorithm === 'otp') {
      await addLog(user._id, 'KEY_VIEWED', 'OTP key viewed by user', 'warning', req);
      return res.json({ success: true, key: user.encryptionKeys.otp });
    } else if (algorithm === 'aes256') {
      await addLog(user._id, 'KEY_VIEWED', 'AES key viewed by user', 'warning', req);
      return res.json({ success: true, key: user.encryptionKeys.aes256 });
    }
    
    res.status(400).json({ success: false, message: 'Invalid algorithm' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/regenerate-key', verifyToken, async (req, res) => {
  try {
    const { algorithm } = req.body;
    const user = await User.findById(req.user.id);
    
    if (algorithm === 'otp') {
      user.encryptionKeys.otp = generateOTPKey(256);
      await addLog(user._id, 'KEY_REGENERATED', 'OTP key regenerated', 'warning', req);
    } else if (algorithm === 'aes256') {
      user.encryptionKeys.aes256 = generateAESKey();
      await addLog(user._id, 'KEY_REGENERATED', 'AES key regenerated', 'warning', req);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid algorithm' });
    }
    
    user.markModified('encryptionKeys');
    await user.save();
    
    res.json({ 
      success: true, 
      message: `${algorithm.toUpperCase()} key regenerated successfully`,
      newKey: algorithm === 'otp' ? user.encryptionKeys.otp : user.encryptionKeys.aes256
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to regenerate key' });
  }
});

// ------------------ NOTIFICATIONS ------------------
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50);
    
    // Alias _id to id for frontend compatibility
    const formatted = notifications.map(n => ({
      ...n.toObject(),
      id: n._id
    }));
    
    res.json({ success: true, notifications: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/status', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: req.body.status || 'read' },
      { new: true }
    );
    
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

router.delete('/notifications/:id', verifyToken, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

module.exports = router;