const crypto = require('crypto');

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

// Validate hex key (more lenient to allow spaces/colons for cleaning)
const isValidHexKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const clean = key.replace(/[\s:]/g, '');
  return clean.length > 0 && /^[0-9a-fA-F]+$/.test(clean);
};

// Clean hex strings
const cleanHex = (hex) => {
  if (!hex || typeof hex !== 'string') return '';
  return hex.replace(/[\s:]/g, '');
};

// Check if string is likely Base64
const isBase64 = (str) => {
  if (!str || typeof str !== 'string') return false;
  // If it contains characters not in hex, but used in base64
  if (/[g-zG-Z+=\/]/.test(str)) return true;
  // If length is not even, it's not hex
  if (str.length % 2 !== 0 && str.length % 4 === 0) return true;
  return false;
};

// OTP Encryption
const otpEncrypt = (text, key) => {
  try {
    const cleanedKey = cleanHex(key);
    if (!cleanedKey || !/^[0-9a-fA-F]+$/.test(cleanedKey)) {
      throw new Error('Invalid hex key format for OTP encryption');
    }
    
    const textBuffer = Buffer.from(text, 'utf8');
    const keyBuffer = Buffer.from(cleanedKey, 'hex');
    
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
const otpDecrypt = (ciphertext, key) => {
  try {
    const cleanedKey = cleanHex(key);
    if (!cleanedKey || !/^[0-9a-fA-F]+$/.test(cleanedKey)) {
      throw new Error('Invalid hex key format for OTP decryption');
    }
    
    const keyBuffer = Buffer.from(cleanedKey, 'hex');
    let encryptedBuffer;

    // Detect if ciphertext is hex or base64
    const trimmedCipher = ciphertext.trim();
    if (isBase64(trimmedCipher)) {
      encryptedBuffer = Buffer.from(trimmedCipher, 'base64');
    } else {
      // Treat as hex, but clean it first
      const cleanedCipher = cleanHex(trimmedCipher);
      encryptedBuffer = Buffer.from(cleanedCipher, 'hex');
    }
    
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

// Simple AES encryption wrapper
const encryptAES = (text, key, iv) => {
  try {
    const encryptedData = aesEncrypt(text, key, iv);
    return JSON.stringify(encryptedData);
  } catch (error) {
    throw new Error(`AES encryption failed: ${error.message}`);
  }
};

// Simple AES decryption wrapper
const decryptAES = (encryptedText, key, iv) => {
  try {
    const encryptedData = JSON.parse(encryptedText);
    return aesDecrypt(encryptedData, key);
  } catch (error) {
    throw new Error(`AES decryption failed: ${error.message}`);
  }
};

module.exports = {
  generateOTPKey,
  generateAESKey,
  generateAESIV,
  isValidHexKey,
  otpEncrypt,
  otpDecrypt,
  aesEncrypt,
  aesDecrypt,
  encryptAES,
  decryptAES
};
