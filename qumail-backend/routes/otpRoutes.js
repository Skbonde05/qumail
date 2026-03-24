const express = require('express');
const router = express.Router();
const { generateOTPKey, otpEncrypt, otpDecrypt, isValidHexKey } = require('../utils/encryption');

// Generate OTP key
router.post('/generate', (req, res) => {
  try {
    const { length = 256 } = req.body;
    const key = generateOTPKey(length);
    res.json({ success: true, key: key, length: key.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate OTP key' });
  }
});

// OTP encrypt
router.post('/encrypt', (req, res) => {
  try {
    const { text, key } = req.body;
    if (!text || !key) return res.status(400).json({ success: false, message: 'Text and key are required' });
    const encrypted = otpEncrypt(text, key);
    res.json({ success: true, encrypted, keyPreview: key.substring(0, 32) + '...' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP encryption failed: ' + error.message });
  }
});

// OTP decrypt
router.post('/decrypt', (req, res) => {
  try {
    const { encrypted, key } = req.body;
    if (!encrypted || !key) return res.status(400).json({ success: false, message: 'Encrypted text and key are required' });
    const decrypted = otpDecrypt(encrypted, key);
    res.json({ success: true, decrypted, keyPreview: key.substring(0, 32) + '...' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP decryption failed: ' + error.message });
  }
});

module.exports = router;