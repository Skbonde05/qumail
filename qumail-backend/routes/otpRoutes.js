// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Generate OTP key
router.post('/otp/generate', (req, res) => {
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

// OTP encrypt
router.post('/otp/encrypt', (req, res) => {
  try {
    const { text, key } = req.body;
    
    if (!text || !key) {
      return res.status(400).json({
        success: false,
        message: 'Text and key are required'
      });
    }
    
    // Simple XOR encryption
    const textBuffer = Buffer.from(text, 'utf8');
    const keyBuffer = Buffer.from(key, 'hex');
    
    if (keyBuffer.length < textBuffer.length) {
      return res.status(400).json({
        success: false,
        message: 'Key too short for text'
      });
    }
    
    const encrypted = Buffer.alloc(textBuffer.length);
    for (let i = 0; i < textBuffer.length; i++) {
      encrypted[i] = textBuffer[i] ^ keyBuffer[i];
    }
    
    res.json({
      success: true,
      encrypted: encrypted.toString('hex'),
      keyPreview: key.substring(0, 32) + '...'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OTP encryption failed: ' + error.message
    });
  }
});

// OTP decrypt
router.post('/otp/decrypt', (req, res) => {
  try {
    const { encrypted, key } = req.body;
    
    if (!encrypted || !key) {
      return res.status(400).json({
        success: false,
        message: 'Encrypted text and key are required'
      });
    }
    
    // XOR decryption (same as encryption)
    const encryptedBuffer = Buffer.from(encrypted, 'hex');
    const keyBuffer = Buffer.from(key, 'hex');
    
    if (keyBuffer.length < encryptedBuffer.length) {
      return res.status(400).json({
        success: false,
        message: 'Key too short for encrypted text'
      });
    }
    
    const decrypted = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i];
    }
    
    res.json({
      success: true,
      decrypted: decrypted.toString('utf8'),
      keyPreview: key.substring(0, 32) + '...'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OTP decryption failed: ' + error.message
    });
  }
});

module.exports = router;