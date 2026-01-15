// EmailService.js - COMPLETE FIX WITH TOKEN MANAGEMENT
const API_BASE = "http://localhost:5000/api";

// Token management
const getToken = () => {
  // Try both token keys for compatibility
  return localStorage.getItem('token') || localStorage.getItem('qumail_token');
};

const setToken = (token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('qumail_token', token); // For backward compatibility
};

const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('qumail_token');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('qumail_email');
};

// 🔧 CRITICAL: Enhanced getAuthHeaders with token validation
const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    console.error('❌ No authentication token found');
    // Redirect to login if no token
    if (window.location.pathname !== '/login') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    throw new Error('No authentication token. Please login.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// 🔧 CRITICAL: Enhanced fetch wrapper with 401 handling
const fetchWithAuth = async (url, options = {}) => {
  try {
    const headers = getAuthHeaders();
    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };
    
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error('🔐 401 Unauthorized - Invalid or expired token');
      
      // Clear tokens
      removeToken();
      
      // Show user-friendly message
      if (typeof window !== 'undefined' && window.showAuthError) {
        window.showAuthError('Session expired. Please login again.');
      }
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw new Error('Authentication failed. Please login again.');
    }
    
    return response;
  } catch (error) {
    // If it's an auth error, rethrow it
    if (error.message.includes('Authentication') || error.message.includes('token')) {
      throw error;
    }
    
    // For network errors
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

class EmailService {
  // ✅ Test connection
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: "GET"
      });
      
      if (!response.ok) {
        throw new Error('Server not responding');
      }
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error("Test connection error:", error.message);
      return false;
    }
  }

  // ✅ Register user
  static async register(name, email, password, confirmPassword) {
    try {
      console.log("📝 Registering user:", email);
      
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);
      }
      
      return data;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  // ✅ Login user
  static async login(email, password) {
    try {
      console.log("🔐 Logging in user:", email);
      
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', data.name || email.split('@')[0]);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  // ✅ Verify token
  static async verifyToken() {
    try {
      const token = getToken();
      if (!token) {
        return { 
          success: false, 
          message: 'No token found',
          shouldRedirect: true 
        };
      }

      const response = await fetch(`${API_BASE}/verify-token`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { 
          success: false, 
          message: 'Token verification failed',
          shouldRedirect: response.status === 401 
        };
      }

      const data = await response.json();
      return { ...data, shouldRedirect: false };
    } catch (error) {
      console.error('Verify token error:', error);
      return { 
        success: false, 
        message: error.message,
        shouldRedirect: true 
      };
    }
  }

  // ✅ Get user profile
  static async getProfile() {
    try {
      console.log("👤 Getting user profile...");
      
      const response = await fetchWithAuth(`${API_BASE}/profile`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Profile error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Profile loaded for: ${data.user.email}`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get profile');
    } catch (error) {
      console.error("Get profile error:", error.message);
      throw error;
    }
  }

  // ✅ Get inbox emails
  static async getInboxEmails(limit = 50, page = 1) {
    try {
      console.log(`📥 Fetching inbox emails, page: ${page}, limit: ${limit}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/inbox`, {
        method: "POST",
        body: JSON.stringify({ limit, page })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Inbox error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got ${data.emails.length} inbox emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get inbox emails');
    } catch (error) {
      console.error("Get inbox error:", error.message);
      throw error;
    }
  }

  // ✅ Get sent emails
  static async getSentEmails(limit = 50, page = 1) {
    try {
      console.log(`📤 Fetching sent emails, page: ${page}, limit: ${limit}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/sent`, {
        method: "POST",
        body: JSON.stringify({ limit, page })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sent error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got ${data.emails.length} sent emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get sent emails');
    } catch (error) {
      console.error("Get sent error:", error.message);
      throw error;
    }
  }

  // ✅ Get archive emails
  static async getArchiveEmails(limit = 50, page = 1) {
    try {
      console.log(`📁 Fetching archive emails, page: ${page}, limit: ${limit}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/archive`, {
        method: "POST",
        body: JSON.stringify({ limit, page })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Archive error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got ${data.emails.length} archive emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get archive emails');
    } catch (error) {
      console.error("Get archive error:", error.message);
      throw error;
    }
  }

  // ✅ Get trash emails
  static async getTrashEmails(limit = 50, page = 1) {
    try {
      console.log(`🗑️ Fetching trash emails, page: ${page}, limit: ${limit}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/trash`, {
        method: "POST",
        body: JSON.stringify({ limit, page })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Trash error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got ${data.emails.length} trash emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get trash emails');
    } catch (error) {
      console.error("Get trash error:", error.message);
      throw error;
    }
  }

  // ✅ Get starred emails
  static async getStarredEmails(limit = 50, page = 1) {
    try {
      console.log(`⭐ Fetching starred emails, page: ${page}, limit: ${limit}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/search`, {
        method: "POST",
        body: JSON.stringify({ 
          limit, 
          page,
          folder: 'starred'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Starred error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got ${data.emails.length} starred emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get starred emails');
    } catch (error) {
      console.error("Get starred error:", error.message);
      throw error;
    }
  }

  // ✅ Get important emails
  static async getImportantEmails(limit = 50, page = 1) {
    try {
      console.log(`🔴 Fetching important emails, page: ${page}, limit: ${limit}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/search`, {
        method: "POST",
        body: JSON.stringify({ 
          limit, 
          page,
          folder: 'important'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Important error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got ${data.emails.length} important emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get important emails');
    } catch (error) {
      console.error("Get important error:", error.message);
      throw error;
    }
  }

  // ✅ Get single email by ID
  static async getEmailById(emailId) {
    try {
      console.log(`📄 Fetching email: ${emailId}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/${emailId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Email fetch error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got email: ${emailId}`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get email');
    } catch (error) {
      console.error("Get email by ID error:", error.message);
      throw error;
    }
  }

  // ✅ Update single email status (star, important, etc.)
  static async updateEmailStatus(emailId, action, folder = null, snoozeDate = null) {
    try {
      console.log(`⚡ Updating email ${emailId} with action: ${action}`);
      
      const body = { action };
      if (folder) body.folder = folder;
      if (snoozeDate) body.snoozeDate = snoozeDate;
      
      const response = await fetchWithAuth(`${API_BASE}/mail/${emailId}/status`, {
        method: "PUT",
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Status update error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Status update successful: ${data.message}`);
        return data;
      }
      
      console.error('Status update failed:', data.message);
      throw new Error(data.message || 'Failed to update email status');
    } catch (error) {
      console.error("Status update error:", error.message);
      throw error;
    }
  }

  // ✅ MOVE EMAILS TO FOLDER
  static async moveEmailsToFolder(emailIds, targetFolder) {
    try {
      console.log(`📂 Moving ${emailIds.length} emails to ${targetFolder}:`, emailIds);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/move-to-folder`, {
        method: "POST",
        body: JSON.stringify({
          emailIds: Array.isArray(emailIds) ? emailIds : [emailIds],
          targetFolder: targetFolder.toLowerCase()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Move error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Move successful: ${data.message}`);
        return data;
      }
      
      console.error('Move failed:', data.message, data.details);
      throw new Error(data.message || 'Failed to move emails');
    } catch (error) {
      console.error("Move emails error:", error.message);
      throw error;
    }
  }

  // ✅ Batch update emails
  static async batchUpdateEmails(emailIds, action, folder = null) {
    try {
      console.log(`⚡ Batch updating ${emailIds.length} emails with action: ${action}`);
      
      const body = { 
        emailIds: Array.isArray(emailIds) ? emailIds : [emailIds],
        action 
      };
      if (folder) body.folder = folder;
      
      const response = await fetchWithAuth(`${API_BASE}/mail/batch-update`, {
        method: "POST",
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Batch update error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Batch update successful: ${data.message}`);
        return data;
      }
      
      console.error('Batch update failed:', data.message);
      throw new Error(data.message || 'Failed to batch update emails');
    } catch (error) {
      console.error("Batch update error:", error.message);
      throw error;
    }
  }

  // ✅ Send email - FIXED VERSION (handles both 'aes' and 'aes256')
  static async sendEmail(to, subject, body, encryptionLevel = 'none') {
    try {
      console.log(`📤 Sending email to: ${to} with encryption: ${encryptionLevel}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body length: ${body ? body.length : 0} characters`);
      
      // ✅ FIX: Convert 'aes' to 'aes256' for backend compatibility
      const normalizedEncryptionLevel = encryptionLevel === 'aes' ? 'aes256' : encryptionLevel;
      
      // Validate required fields
      if (!to || !to.trim()) {
        throw new Error('Recipient email is required');
      }
      
      if (!body || !body.trim()) {
        throw new Error('Email body is required');
      }
      
      // Ensure it's a @qumail.com address
      const normalizedTo = to.toLowerCase().trim();
      if (!normalizedTo.endsWith('@qumail.com')) {
        throw new Error('Can only send to @qumail.com addresses');
      }
      
      const payload = {
        to: normalizedTo,
        subject: subject || '(No Subject)',
        body: body,
        encryptionLevel: normalizedEncryptionLevel  // ✅ Use normalized value
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await fetchWithAuth(`${API_BASE}/send`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Send error ${response.status}:`, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Email sent successfully: ${data.messageId}`);
        return data;
      }
      
      console.error('Send email failed:', data.message);
      throw new Error(data.message || 'Failed to send email');
    } catch (error) {
      console.error("Send email error:", error.message);
      throw error;
    }
  }

  // ✅ Get folder counts
  static async getFolderCounts() {
    try {
      console.log(`📊 Getting folder counts...`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/folder-counts`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Folder counts error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Got folder counts`);
        return data;
      }
      
      console.error('Get folder counts failed:', data.message);
      throw new Error(data.message || 'Failed to get folder counts');
    } catch (error) {
      console.error("Get folder counts error:", error.message);
      throw error;
    }
  }

  // ✅ Update user profile
  static async updateProfile(name, settings) {
    try {
      console.log(`📝 Updating profile...`);
      
      const body = {};
      if (name) body.name = name;
      if (settings) body.settings = settings;
      
      const response = await fetchWithAuth(`${API_BASE}/profile`, {
        method: "PUT",
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Profile update error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Profile updated: ${data.message}`);
        return data;
      }
      
      console.error('Profile update failed:', data.message);
      throw new Error(data.message || 'Failed to update profile');
    } catch (error) {
      console.error("Update profile error:", error.message);
      throw error;
    }
  }

  // ✅ Decrypt email
  static async decryptEmail(emailId, encryptionKey = null) {
    try {
      console.log(`🔓 Decrypting email: ${emailId}`);
      
      const payload = { emailId };
      if (encryptionKey) {
        payload.encryptionKey = encryptionKey;
      }
      
      const response = await fetchWithAuth(`${API_BASE}/decrypt`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Decrypt error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Email decrypted successfully`);
        return data;
      }
      
      console.error('Decrypt failed:', data.message);
      throw new Error(data.message || 'Failed to decrypt email');
    } catch (error) {
      console.error("Decrypt email error:", error.message);
      throw error;
    }
  }

  // ✅ Search emails
  static async searchEmails(query, folder = 'all', limit = 50) {
    try {
      console.log(`🔍 Searching emails for: ${query} in folder: ${folder}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/search`, {
        method: "POST",
        body: JSON.stringify({
          query,
          folder,
          limit
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Search error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Found ${data.emails.length} emails for query: ${query}`);
        return data;
      }
      
      console.error('Search failed:', data.message);
      throw new Error(data.message || 'Failed to search emails');
    } catch (error) {
      console.error("Search emails error:", error.message);
      throw error;
    }
  }

  // ✅ Logout
  static async logout() {
    try {
      const token = getToken();
      
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      removeToken();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      removeToken();
      return { success: true };
    }
  }
}

export default EmailService;