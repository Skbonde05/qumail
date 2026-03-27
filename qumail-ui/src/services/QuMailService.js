// QuMailService.js - Refactored API Service
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Simple in-memory cache
const cache = {
  data: {},
  set(key, val, ttl = 30000) { this.data[key] = { val, expiry: Date.now() + ttl }; },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() > item.expiry) { delete this.data[key]; return null; }
    return item.val;
  },
  invalidate(key) { if (key) delete this.data[key]; else this.data = {}; }
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qumail_token') || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('qumail_refresh_token');
        if (refreshToken) {
          const res = await axiosInstance.post('/api/auth/refresh', { refreshToken });
          if (res.data.success) {
            localStorage.setItem('qumail_token', res.data.accessToken);
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Logout user or redirect to login
        localStorage.removeItem('qumail_token');
        localStorage.removeItem('qumail_email');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const QuMailService = {
  // Authentication
  verifyToken: async () => {
    try {
      const response = await axiosInstance.post('/api/auth/verify-token');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, shouldRedirect: true, message: error.response?.data?.message || 'Verification failed' };
    }
  },

  testConnection: async () => {
    try {
      const response = await axiosInstance.get('/api/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  register: async (name, email, password, confirmPassword) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', { name, email, password, confirmPassword });
      return response.data;
    } catch (error) {
      return error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        const refreshToken = response.data.refreshToken;
        localStorage.setItem('qumail_token', token);
        localStorage.setItem('token', token);
        localStorage.setItem('qumail_refresh_token', refreshToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('qumail_email', email);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('qumail_name', response.data.user?.name || email.split('@')[0]);
      }
      return response.data;
    } catch (error) {
      return error.response?.data || { success: false, message: 'Login failed' };
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('qumail_token');
      localStorage.removeItem('qumail_refresh_token');
      localStorage.removeItem('qumail_email');
      localStorage.removeItem('qumail_name');
    }
    return { success: true };
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    try {
      const response = await axiosInstance.put('/api/auth/profile', data);
      return response.data;
    } catch (error) {
      return error.response?.data || { success: false, message: 'Profile update failed' };
    }
  },

  // Email Operations
  fetchEmails: async (folder = 'inbox', limit = 50, page = 1) => {
    const cacheKey = `emails_${folder}_${limit}_${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    // Check if it's a standard folder or a custom one
    // Sanitize folder
    const folderStr = (folder || 'inbox').toString().toLowerCase();
    
    // Check if it's a standard folder or a custom one
    const standardFolders = ['inbox', 'sent', 'archive', 'trash', 'starred', 'important', 'drafts', 'snoozed', 'spam'];
    const isStandard = standardFolders.includes(folderStr);
    
    const endpoint = isStandard
      ? `/api/mail/${folderStr}` 
      : `/api/mail/folder/${folder}`; // Keep original case for custom labels

    try {
      const response = await axiosInstance.post(endpoint, { limit, page });
      const result = response.data.emails || [];
      cache.set(cacheKey, result, 10000); // 10s cache
      return result;
    } catch (error) {
      if (error.response?.status === 404 && !isStandard) {
        // Folder probably deleted, fallback to empty to avoid red error popups
        console.warn(`Folder ${folder} not found, likely deleted. Returning empty.`);
        return []; // Return empty instead of throwing
      }
      throw error;
    }
  },

  getEmail: async (mailId) => {
    const cacheKey = `email_${mailId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    const response = await axiosInstance.get(`/api/mail/${mailId}`);
    const result = response.data.email;
    cache.set(cacheKey, result, 60000); // 1min cache
    return result;
  },

  sendEmail: async (to, subject, body, encryptionLevel = 'none') => {
    cache.invalidate(); // Clear all caches on mutation
    const response = await axiosInstance.post('/api/mail/send', { to, subject, body, encryptionLevel });
    return response.data;
  },

  updateEmailStatus: async (mailId, action, extraData = {}) => {
    cache.invalidate(); // Clear caches on status change
    const response = await axiosInstance.put(`/api/mail/${mailId}/status`, { action, ...extraData });
    return response.data;
  },

  batchUpdate: async (emailIds, action, extraData = {}) => {
    const response = await axiosInstance.post('/api/mail/batch-update', { emailIds, action, ...extraData });
    return response.data;
  },

  searchEmails: async (query, folder = 'all', limit = 50) => {
    const response = await axiosInstance.post('/api/mail/search', { query, folder, limit });
    return response.data.emails || [];
  },

  getFolderCounts: async () => {
    const cacheKey = 'folder_counts';
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    const response = await axiosInstance.get('/api/mail/folder-counts');
    const result = response.data.counts;
    cache.set(cacheKey, result, 5000); // 5s cache
    return result;
  },

  decryptEmail: async (emailId, encryptionKey) => {
    const response = await axiosInstance.post('/api/mail/decrypt', { emailId, encryptionKey });
    return response.data;
  },

  // --- Security & Account ---
  // These methods are essential for real-time security monitoring and management.
  getSecurityLogs: async () => {
    const response = await axiosInstance.get('/api/auth/security-logs');
    return response.data;
  },
  getEncryptionKeys: async () => {
    const response = await axiosInstance.get('/api/auth/encryption-keys');
    return response.data;
  },
  getFullEncryptionKey: async (algorithm) => {
    const response = await axiosInstance.post('/api/auth/get-encryption-key', { algorithm });
    return response.data;
  },
  regenerateEncryptionKey: async (algorithm) => {
    const response = await axiosInstance.post('/api/auth/regenerate-key', { algorithm });
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  verifyResetOTP: async (email, otp) => {
    const response = await axiosInstance.post('/api/auth/verify-reset-otp', { email, otp });
    return response.data;
  },
  verifyRecoveryCode: async (email, recoveryCode) => {
    const response = await axiosInstance.post('/api/auth/verify-recovery-code', { email, recoveryCode });
    return response.data;
  },
  resetPassword: async (token, password) => {
    const response = await axiosInstance.post('/api/auth/reset-password', { token, password });
    return response.data;
  },

  // --- Notifications ---
  // These methods are essential for real-time engagement.
  getNotifications: async () => {
    const response = await axiosInstance.get('/api/auth/notifications');
    return response.data;
  },
  updateNotificationStatus: async (id, status) => {
    const response = await axiosInstance.put(`/api/auth/notifications/${id}/status`, { status });
    return response.data;
  },
  deleteNotification: async (id) => {
    const response = await axiosInstance.delete(`/api/auth/notifications/${id}`);
    return response.data;
  },

  // Drafts
  getDrafts: async () => {
    const response = await axiosInstance.get('/api/mail/drafts');
    return response.data.drafts || [];
  },

  createDraft: async (to, subject, body, options = {}) => {
    const response = await axiosInstance.post('/api/mail/drafts', { to, subject, body, ...options });
    return response.data;
  },

  updateDraft: async (id, data) => {
    const response = await axiosInstance.put(`/api/mail/drafts/${id}`, data);
    return response.data;
  },

  deleteDraft: async (id) => {
    const response = await axiosInstance.delete(`/api/mail/drafts/${id}`);
    return response.data;
  },

  // Labels
  getLabels: async () => {
    const response = await axiosInstance.get('/api/mail/labels');
    return response.data.labels || [];
  },

  createLabel: async (name, color) => {
    const response = await axiosInstance.post('/api/mail/labels', { name, color });
    return response.data;
  },

  deleteLabel: async (id) => {
    const response = await axiosInstance.delete(`/api/mail/labels/${id}`);
    return response.data;
  },

  // Two-Factor Authentication
  setup2FA: async () => {
    const response = await axiosInstance.post('/api/auth/setup-2fa');
    return response.data;
  },
  confirm2FA: async (otp) => {
    const response = await axiosInstance.post('/api/auth/confirm-2fa', { otp });
    return response.data;
  },
  verify2FA: async (otp, mfaToken) => {
    const response = await axiosInstance.post('/api/auth/verify-2fa', { otp, mfaToken });
    if (response.data.success && response.data.token) {
      const { token, refreshToken, user } = response.data;
      localStorage.setItem('qumail_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('qumail_refresh_token', refreshToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('qumail_email', user.email);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('qumail_name', user.name || user.email.split('@')[0]);
    }
    return response.data;
  }
};

export default QuMailService;
