// qumail-backend/utils/kmService.js
const axios = require('axios');

const config = require('../config/config');

const KM_URL = config.urls.keyManager || 'http://localhost:6001';
const KM_API_KEY = process.env.KM_API_KEY;

const kmClient = axios.create({
  baseURL: KM_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': KM_API_KEY
  }
});

/**
 * Get a new key from the KM service
 * @param {string} email User email for tracking
 * @returns {Promise<string>} Hex representation of the new key
 */
const fetchNewKey = async (email) => {
  try {
    const response = await kmClient.post('/new-key', { email });
    return response.data.key;
  } catch (error) {
    console.error(' KM Service: Failed to fetch new key:', error.message);
    throw new Error('Key Management Service currently unavailable');
  }
};

/**
 * Get the current static AES master keys if configured in KM
 */
const fetchAESMaster = async () => {
  try {
    const response = await kmClient.get('/api/keys/aes');
    return response.data; // { key, iv }
  } catch (error) {
    console.warn(' KM Service: Static AES keys not available in KM. Falling back to backend.');
    return null;
  }
};

module.exports = {
  fetchNewKey,
  fetchAESMaster
};
