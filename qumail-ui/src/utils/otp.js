// utils/otp.js
// One-Time Pad encryption/decryption utilities

/**
 * Convert string to Uint8Array bytes
 */
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

/**
 * Convert bytes to string
 */
function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert bytes to Base64 string
 */
function bytesToBase64(bytes) {
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/**
 * Convert Base64 string to bytes
 */
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex) {
  if (!hex || typeof hex !== 'string') {
    return new Uint8Array();
  }
  
  // Remove any non-hex characters
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  
  // Ensure even length
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
  
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes) {
  return Array.from(bytes, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Generate a random OTP key of specified length in hex
 */
export function generateOTPKey(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Generate a random OTP key of specified length in ASCII
 */
export function generateOTPKeyAscii(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Check if key is valid (hex string, allowing spaces/colons)
 */
export function isValidKey(key) {
  if (typeof key !== 'string') return false;
  const clean = key.replace(/[\s:]/g, '');
  return clean.length > 0 && /^[0-9a-fA-F]+$/.test(clean);
}

/**
 * Check if string is likely Base64
 */
function isBase64Strict(str) {
  if (typeof str !== 'string') return false;
  // If it contains characters not in hex, but used in base64
  if (/[g-zG-Z+=\/]/.test(str)) return true;
  // If length is not even, it's not hex
  if (str.length % 2 !== 0 && str.length % 4 === 0) return true;
  return false;
}

/**
 * Encrypt text using OTP with hex key
 */
export function otpEncrypt(text, keyHex) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }
  
  if (!keyHex || typeof keyHex !== 'string') {
    throw new Error('Key must be a non-empty string');
  }
  
  const cleanedKey = keyHex.replace(/[\s:]/g, '');
  if (!/^[0-9a-fA-F]+$/.test(cleanedKey)) {
    throw new Error('Key must be a valid hex string');
  }
  
  try {
    const textBytes = stringToBytes(text);
    const keyBytes = hexToBytes(cleanedKey);
    
    if (keyBytes.length === 0) {
      throw new Error('Invalid key format');
    }
    
    // Encrypt each byte using XOR with key
    const encryptedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to base64 for safe transmission
    return bytesToBase64(encryptedBytes);
    
  } catch (error) {
    console.error('OTP Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt ciphertext (Hex or Base64) using OTP with hex key
 */
export function otpDecrypt(ciphertext, keyHex) {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('Ciphertext must be a non-empty string');
  }
  
  if (!keyHex || typeof keyHex !== 'string') {
    throw new Error('Key must be a non-empty string');
  }
  
  const cleanedKey = keyHex.replace(/[\s:]/g, '');
  if (!/^[0-9a-fA-F]+$/.test(cleanedKey)) {
    throw new Error('Key must be a valid hex string');
  }
  
  try {
    const trimmedCipher = ciphertext.trim();
    let encryptedBytes;

    if (isBase64Strict(trimmedCipher)) {
      encryptedBytes = base64ToBytes(trimmedCipher);
    } else {
      const cleanedCipher = trimmedCipher.replace(/[\s:]/g, '');
      encryptedBytes = hexToBytes(cleanedCipher);
    }

    const keyBytes = hexToBytes(cleanedKey);
    
    if (keyBytes.length === 0) {
      throw new Error('Invalid key format');
    }
    
    // Decrypt each byte using XOR with key
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert bytes back to string
    return bytesToString(decryptedBytes);
    
  } catch (error) {
    console.error('OTP Decryption error:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Simple XOR encryption for ASCII strings (compatibility)
 */
export function simpleOTPEncrypt(text, key) {
  if (!text || !key) return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  
  return result;
}

/**
 * Simple XOR decryption for ASCII strings (compatibility)
 */
export function simpleOTPDecrypt(encrypted, key) {
  if (!encrypted || !key) return encrypted;
  
  let result = '';
  for (let i = 0; i < encrypted.length; i++) {
    const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  
  return result;
}

/**
 * Check if string is valid base64
 */
export function isBase64(str) {
  if (typeof str !== 'string') return false;
  
  try {
    // Check if it's a valid base64 string
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;
    
    // Try to decode it
    const decoded = atob(str);
    // Try to encode it back
    const reencoded = btoa(decoded);
    
    // Remove padding for comparison
    const normalizedInput = str.replace(/=+$/, '');
    const normalizedReencoded = reencoded.replace(/=+$/, '');
    
    return normalizedInput === normalizedReencoded;
  } catch (error) {
    return false;
  }
}

/**
 * Get key length in bytes
 */
export function getKeyLength(keyHex) {
  if (!isValidKey(keyHex)) return 0;
  return Math.ceil(keyHex.length / 2);
}

/**
 * Pad key if needed
 */
export function padKey(keyHex, requiredLength) {
  if (!isValidKey(keyHex)) {
    throw new Error('Invalid key format');
  }
  
  if (keyHex.length >= requiredLength * 2) {
    return keyHex.substring(0, requiredLength * 2);
  }
  
  // Repeat key to reach required length
  let paddedKey = keyHex;
  while (paddedKey.length < requiredLength * 2) {
    paddedKey += keyHex;
  }
  
  return paddedKey.substring(0, requiredLength * 2);
}

/**
 * Generate a key that matches text length
 */
export function generateMatchingKey(text) {
  if (!text || typeof text !== 'string') {
    return generateOTPKey(32);
  }
  
  const textLength = new TextEncoder().encode(text).length;
  return generateOTPKey(textLength);
}

/**
 * Example usage and test function
 */
export async function testOTP() {
  try {
    console.log('Testing OTP encryption/decryption...');
    
    const originalText = 'This is a secret message!';
    const key = generateOTPKey(32);
    
    console.log('Original text:', originalText);
    console.log('Generated key:', key);
    
    // Encrypt
    const encrypted = otpEncrypt(originalText, key);
    console.log('Encrypted (base64):', encrypted);
    
    // Decrypt
    const decrypted = otpDecrypt(encrypted, key);
    console.log('Decrypted text:', decrypted);
    
    // Verify
    const success = decrypted === originalText;
    console.log('Test', success ? 'PASSED' : 'FAILED');
    
    return success;
  } catch (error) {
    console.error('OTP test failed:', error);
    return false;
  }
}

/**
 * Helper function for automatic encryption with key generation
 */
export async function encryptWithAutoKey(text) {
  try {
    const key = generateOTPKey(32);
    const encrypted = otpEncrypt(text, key);
    return {
      success: true,
      encrypted,
      key,
      format: `[otp|${key}]:${encrypted}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper function for automatic decryption from formatted string
 */
export async function decryptFromFormat(formatted) {
  try {
    // Parse format: [otp|key]:encrypted
    const match = formatted.match(/^\[otp\|([0-9a-fA-F]+)\]:(.+)$/s);
    if (!match) {
      throw new Error('Invalid format. Expected: [otp|key]:encrypted');
    }
    
    const key = match[1];
    const encrypted = match[2];
    
    const decrypted = otpDecrypt(encrypted, key);
    
    return {
      success: true,
      decrypted,
      key
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fallback: formatted // Return original if decryption fails
    };
  }
}

// Auto-run test if this file is run directly
if (typeof window !== 'undefined' && window.location.href.includes('test')) {
  testOTP().then(result => {
    console.log('OTP Test completed:', result ? 'SUCCESS' : 'FAILED');
  });
}