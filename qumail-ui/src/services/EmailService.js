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

const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    console.error('[AUTH] No authentication token found');
    throw new Error('No authentication token. Please login.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// [CRITICAL] Enhanced fetch wrapper with 401 handling
const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...options, headers };
    let response = await fetch(url, config);

    // [AUTH] Handle token expiration (401 Unauthorized)
    if (response.status === 401) {
      console.warn(`[AUTH] 401 Unauthorized at ${url}. Attempting token refresh...`);
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.accessToken || refreshData.token;

            console.log("[SUCCESS] Token refreshed successfully");
            localStorage.setItem('token', newToken);
            localStorage.setItem('qumail_token', newToken);

            // Retry the original request with the new token
            config.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, config);
          } else {
            console.error("[ERROR] Token refresh failed");
            removeToken();
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            throw new Error('Session expired. Please login again.');
          }
        } catch (refreshErr) {
          console.error("[ERROR] Error during token refresh:", refreshErr);
          removeToken();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please login again.');
        }
      } else {
        removeToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error(`Fetch error at ${url}:`, error);
    throw error;
  }
};

class EmailService {
  // [TEST] Test connection
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

  // [REGISTER] Register user
  static async register(name, email, password, confirmPassword) {
    try {
      console.log("[INFO] Registering user:", email);
      
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

  // [AUTH] Login user
 static async login(email, password) {
  try {
    console.log("[AUTH] Logging in user:", email);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Login failed"
      };
    }

    // [AUTH] Store tokens (NEW SYSTEM)
    if (data.accessToken && data.refreshToken) {

      // Save tokens
      const token = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      localStorage.setItem("token", token);
      localStorage.setItem("qumail_token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("qumail_refresh_token", refreshToken);

      // Save user info
      localStorage.setItem("userEmail", email);
      localStorage.setItem(
        "userName",
        data.name || email.split("@")[0]
      );

      // Optional: set token in memory (if you use setToken)
      setToken?.(data.accessToken);
    }

    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      name: data.name
    };

  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Network error. Please try again."
    };
  }
}

  // [AUTH] Verify token
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

  // [PROFILE] Get user profile
  static async getProfile() {
    try {
      console.log("[INFO] Getting user profile...");
      
      const response = await fetchWithAuth(`${API_BASE}/profile`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Profile error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`[SUCCESS] Profile loaded for: ${data.user.email}`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get profile');
    } catch (error) {
      console.error("Get profile error:", error.message);
      throw error;
    }
  }

  // [INBOX] Get inbox emails
  static async getInboxEmails(limit = 50, page = 1) {
    try {
      console.log(`[INBOX] Fetching inbox emails, page: ${page}, limit: ${limit}`);
      
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
        console.log(`[SUCCESS] Got ${data.emails.length} inbox emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get inbox emails');
    } catch (error) {
      console.error("Get inbox error:", error.message);
      throw error;
    }
  }

  // [SENT] Get sent emails
  static async getSentEmails(limit = 50, page = 1) {
    try {
      console.log(`[SENT] Fetching sent emails, page: ${page}, limit: ${limit}`);
      
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
        console.log(`[SUCCESS] Got ${data.emails.length} sent emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get sent emails');
    } catch (error) {
      console.error("Get sent error:", error.message);
      throw error;
    }
  }

  // [ARCHIVE] Get archive emails
  static async getArchiveEmails(limit = 50, page = 1) {
    try {
      console.log(`[ARCHIVE] Fetching archive emails, page: ${page}, limit: ${limit}`);
      
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
        console.log(`[SUCCESS] Got ${data.emails.length} archive emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get archive emails');
    } catch (error) {
      console.error("Get archive error:", error.message);
      throw error;
    }
  }

  // [TRASH] Get trash emails
  static async getTrashEmails(limit = 50, page = 1) {
    try {
      console.log(`[TRASH] Fetching trash emails, page: ${page}, limit: ${limit}`);
      
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
        console.log(`[SUCCESS] Got ${data.emails.length} trash emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get trash emails');
    } catch (error) {
      console.error("Get trash error:", error.message);
      throw error;
    }
  }

  // [STAR] Get starred emails
  static async getStarredEmails(limit = 50, page = 1) {
    try {
      console.log(`[STAR] Fetching starred emails, page: ${page}, limit: ${limit}`);
      
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
        console.log(`[SUCCESS] Got ${data.emails.length} starred emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get starred emails');
    } catch (error) {
      console.error("Get starred error:", error.message);
      throw error;
    }
  }

  // [IMPORTANT] Get important emails
  static async getImportantEmails(limit = 50, page = 1) {
    try {
      console.log(`[IMPORTANT] Fetching important emails, page: ${page}, limit: ${limit}`);
      
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
        console.log(`[SUCCESS] Got ${data.emails.length} important emails (total: ${data.total})`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get important emails');
    } catch (error) {
      console.error("Get important error:", error.message);
      throw error;
    }
  }

  // [PAGE] Get single email by ID
  static async getEmailById(emailId) {
    try {
      console.log(`[PAGE] Fetching email: ${emailId}`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/${emailId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Email fetch error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`[SUCCESS] Got email: ${emailId}`);
        return data;
      }
      
      throw new Error(data.message || 'Failed to get email');
    } catch (error) {
      console.error("Get email by ID error:", error.message);
      throw error;
    }
  }

  // [ACTION] Update single email status (star, important, etc.)
  static async updateEmailStatus(emailId, action, folder = null, snoozeDate = null) {
    try {
      console.log(`[ACTION] Updating email ${emailId} with action: ${action}`);
      
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
        console.log(`[SUCCESS] Status update successful: ${data.message}`);
        return data;
      }
      
      console.error('Status update failed:', data.message);
      throw new Error(data.message || 'Failed to update email status');
    } catch (error) {
      console.error("Status update error:", error.message);
      throw error;
    }
  }

  // [MOVE] MOVE EMAILS TO FOLDER
  static async moveEmailsToFolder(emailIds, targetFolder) {
    try {
      console.log(`[MOVE] Moving ${emailIds.length} emails to ${targetFolder}:`, emailIds);
      
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
        console.log(`[SUCCESS] Move successful: ${data.message}`);
        return data;
      }
      
      console.error('Move failed:', data.message, data.details);
      throw new Error(data.message || 'Failed to move emails');
    } catch (error) {
      console.error("Move emails error:", error.message);
      throw error;
    }
  }

  // [DRAFTS] Get drafts
  static async getDrafts() {
    try {
      console.log(`[INFO] Fetching drafts...`);
      const response = await fetchWithAuth(`${API_BASE}/mail/drafts`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.success ? data.drafts : [];
    } catch (error) {
      console.error('Get drafts error:', error);
      return [];
    }
  }

  // [DRAFTS] Save draft (handles both create and update)
  static async saveDraft(draftId, to, subject, body, encryptionLevel = 'none') {
    try {
      console.log(`[SAVE] Saving draft... ${draftId ? 'Update: ' + draftId : 'New'}`);
      
      const payload = {
        to: to || '',
        subject: subject || '',
        body: body || '',
        encryptionLevel: encryptionLevel === 'aes' ? 'aes256' : encryptionLevel
      };
      
      const url = draftId ? `${API_BASE}/mail/drafts/${draftId}` : `${API_BASE}/mail/drafts`;
      const method = draftId ? "PUT" : "POST";
      
      const response = await fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Save draft error:', error);
      throw error;
    }
  }

  // [DRAFTS] Delete draft
  static async deleteDraft(draftId) {
    try {
      console.log(`[TRASH] Deleting draft: ${draftId}`);
      const response = await fetchWithAuth(`${API_BASE}/mail/drafts/${draftId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete draft error:', error);
      throw error;
    }
  }

  // [ACTION] Batch update emails
  static async batchUpdateEmails(emailIds, action, folder = null) {
    try {
      console.log(`[ACTION] Batch updating ${emailIds.length} emails with action: ${action}`);
      
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
        console.log(`[SUCCESS] Batch update successful: ${data.message}`);
        return data;
      }
      
      console.error('Batch update failed:', data.message);
      throw new Error(data.message || 'Failed to batch update emails');
    } catch (error) {
      console.error("Batch update error:", error.message);
      throw error;
    }
  }

  // [SEND] Send email - FIXED VERSION (handles both 'aes' and 'aes256')
  static async sendEmail(to, subject, body, encryptionLevel = 'none') {
    try {
      console.log(`[SEND] Sending email to: ${to} with encryption: ${encryptionLevel}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body length: ${body ? body.length : 0} characters`);
      
      // [FIX] Convert 'aes' to 'aes256' for backend compatibility
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
      
      console.log('[INFO] Sending payload:', payload);
      
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
        console.log(`[SUCCESS] Email sent successfully: ${data.messageId}`);
        return data;
      }
      
      console.error('Send email failed:', data.message);
      throw new Error(data.message || 'Failed to send email');
    } catch (error) {
      console.error("Send email error:", error.message);
      throw error;
    }
  }

  // [INFO] Get folder counts
  static async getFolderCounts() {
    try {
      console.log(`[INFO] Getting folder counts...`);
      
      const response = await fetchWithAuth(`${API_BASE}/mail/folder-counts`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Folder counts error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`[SUCCESS] Got folder counts`);
        return data;
      }
      
      console.error('Get folder counts failed:', data.message);
      throw new Error(data.message || 'Failed to get folder counts');
    } catch (error) {
      console.error("Get folder counts error:", error.message);
      throw error;
    }
  }

  // [PROFILE] Update user profile
  static async updateProfile(name, settings) {
    try {
      console.log(`[INFO] Updating profile...`);
      
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
        console.log(`[SUCCESS] Profile updated: ${data.message}`);
        return data;
      }
      
      console.error('Profile update failed:', data.message);
      throw new Error(data.message || 'Failed to update profile');
    } catch (error) {
      console.error("Update profile error:", error.message);
      throw error;
    }
  }

  // [AUTH] Decrypt email
  static async decryptEmail(emailId, encryptionKey = null) {
    try {
      console.log(`[AUTH] Decrypting email: ${emailId}`);
      
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
        console.log(`[SUCCESS] Email decrypted successfully`);
        return data;
      }
      
      console.error('Decrypt failed:', data.message);
      throw new Error(data.message || 'Failed to decrypt email');
    } catch (error) {
      console.error("Decrypt email error:", error.message);
      throw error;
    }
  }

  // [SEARCH] Search emails
  static async searchEmails(query, folder = 'all', limit = 50) {
    try {
      console.log(`[INFO] Searching emails for: ${query} in folder: ${folder}`);
      
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
        console.log(`[SUCCESS] Found ${data.emails.length} emails for query: ${query}`);
        return data;
      }
      
      console.error('Search failed:', data.message);
      throw new Error(data.message || 'Failed to search emails');
    } catch (error) {
      console.error("Search emails error:", error.message);
      throw error;
    }
  }

  // [AUTH] Logout
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