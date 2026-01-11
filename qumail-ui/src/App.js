// App.js - QUMAIL INDEPENDENT PLATFORM VERSION WITH SPLASH SCREEN
import React, { useState, useCallback, useEffect, useMemo } from "react";
import SplashScreen from './pages/SplashScreen';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import { cacheKey, getValidKey, clearKeyCache } from "./utils/keyStore";
import { otpEncrypt, otpDecrypt, generateOTPKey } from "./utils/otp";

const theme = createTheme({
  palette: {
    primary: { main: "#1a73e8", light: "#4285f4", dark: "#0d47a1" },
    secondary: { main: "#ff6d00" },
    error: { main: "#d32f2f" },
    success: { main: "#2e7d32" },
    warning: { main: "#ed6c02" },
    background: { default: "#f8f9fa", paper: "#ffffff" },
  },
  shape: { borderRadius: 8 },
});

// Helper functions
const determineSecurityLevel = (body) => {
  if (!body || typeof body !== 'string') return "none";
  if (body.startsWith('[otp|') || body.includes('[otp|')) return "otp";
  if (body.startsWith('[aes|') || body.includes('[aes|')) return "aes";
  return "none";
};

const generatePreview = (body) => {
  if (!body || typeof body !== 'string') return "";
  try {
    const plainText = body.replace(/<[^>]*>/g, '');
    const encryptedMatch = plainText.match(/^\[(otp|aes)\|[^]]+\]:/);
    if (encryptedMatch) {
      const content = plainText.substring(encryptedMatch[0].length);
      return content.substring(0, 120) + (content.length > 120 ? "..." : "");
    }
    return plainText.substring(0, 120) + (plainText.length > 120 ? "..." : "");
  } catch {
    return body.substring(0, 100) || "";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "Just now";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return "Unknown";
  }
};

// QuMail API Service
const QuMailService = {
  // Test backend connection
  testConnection: async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Register new QuMail user (@qumail.com)
  register: async (name, email, password, confirmPassword) => {
    try {
      // Validate email ends with @qumail.com
      if (!email.toLowerCase().endsWith('@qumail.com')) {
        return { 
          success: false, 
          message: 'Only @qumail.com addresses are supported' 
        };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('qumail_token', data.token);
        localStorage.setItem('qumail_email', email);
        localStorage.setItem('qumail_name', name);
      }
      
      return data;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Login to QuMail
  login: async (email, password) => {
    try {
      // Validate email ends with @qumail.com
      if (!email.toLowerCase().endsWith('@qumail.com')) {
        return { 
          success: false, 
          message: 'Only @qumail.com addresses are supported' 
        };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('qumail_token', data.token);
        localStorage.setItem('qumail_email', email);
        localStorage.setItem('qumail_name', data.name || email.split('@')[0]);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const token = localStorage.getItem('qumail_token');
      const email = localStorage.getItem('qumail_email');
      
      if (!token || !email) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/profile`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false };
    }
  },

  // Get folders/labels
  getFolders: async () => {
    try {
      const token = localStorage.getItem('qumail_token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/folders`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      return data.success ? data.folders : [];
    } catch (error) {
      console.error('Get folders error:', error);
      return [];
    }
  },

  // ✅ FIXED: Fetch emails from folder using correct API endpoint
  fetchEmails: async (folder = 'inbox', limit = 50) => {
    try {
      const token = localStorage.getItem('qumail_token');
      const email = localStorage.getItem('qumail_email');
      
      if (!token || !email) {
        throw new Error('Not authenticated');
      }

      // ✅ FIX 5: Using the correct API endpoint with POST method
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let apiEndpoint = '';
      
      // Map folder to correct API endpoint
      switch(folder) {
        case 'inbox':
          apiEndpoint = '/api/mail/inbox';
          break;
        case 'sent':
          apiEndpoint = '/api/mail/sent';
          break;
        case 'drafts':
          apiEndpoint = '/api/mail/drafts';
          break;
        case 'trash':
          apiEndpoint = '/api/mail/trash';
          break;
        case 'spam':
          apiEndpoint = '/api/mail/spam';
          break;
        default:
          apiEndpoint = '/api/mail/inbox';
      }

      console.log(`📥 Fetching emails from: ${folder}, endpoint: ${apiEndpoint}`);
      
      const response = await fetch(`${API_URL}${apiEndpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: email,
          limit: limit || 50
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Received ${Array.isArray(data) ? data.length : 0} emails from ${folder}`);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.emails)) {
        return data.emails;
      } else if (data && data.success && Array.isArray(data.emails)) {
        return data.emails;
      } else {
        console.warn('Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Fetch emails error:', error);
      // Fallback to old endpoint if new one fails
      try {
        console.log('Trying fallback endpoint...');
        const token = localStorage.getItem('qumail_token');
        const email = localStorage.getItem('qumail_email');
        
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/emails`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            email,
            folder, 
            limit 
          })
        });
        
        const data = await response.json();
        return data.success ? data.emails : [];
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  },

  // Get full email
  getEmail: async (emailId) => {
    try {
      const token = localStorage.getItem('qumail_token');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/mail/${emailId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      return data.success ? data.mail : null;
    } catch (error) {
      console.error('Get email error:', error);
      return null;
    }
  },

  // ✅ ✅ ✅ FIXED: Send email with CORRECT endpoint and payload
  sendEmail: async (to, subject, body, type = "NORMAL") => {
    try {
      const token = localStorage.getItem('qumail_token');
      const from = localStorage.getItem('qumail_email');
      
      if (!token || !from) {
        return { 
          success: false, 
          message: 'Not authenticated. Please login again.' 
        };
      }

      // ✅ CRITICAL: Validate all required fields
      if (!to || !to.trim()) {
        return { 
          success: false, 
          message: 'Recipient email is required' 
        };
      }
      
      if (!body || !body.trim()) {
        return { 
          success: false, 
          message: 'Message body is required' 
        };
      }

      // Validate recipient is @qumail.com
      const recipientEmail = to.toLowerCase().trim();
      if (!recipientEmail.endsWith('@qumail.com')) {
        return { 
          success: false, 
          message: 'Can only send to @qumail.com addresses' 
        };
      }

      // Validate sender is @qumail.com
      const senderEmail = from.toLowerCase().trim();
      if (!senderEmail.endsWith('@qumail.com')) {
        return { 
          success: false, 
          message: 'Invalid sender email' 
        };
      }

      // ✅ CRITICAL: Ensure subject is not null/undefined
      const emailSubject = subject || '(No Subject)';

      // ✅ ✅ ✅ CRITICAL: Correct request body matching backend contract
      const requestBody = {
        to: recipientEmail,
        subject: emailSubject,
        body: body,  // ✅ MUST be "body", not "message"
        encryptionLevel:  // ✅ MUST be "encryptionLevel", not "type"
          type === "AES" ? "aes256" :
          type === "OTP" ? "otp" :
          "none"
      };

      console.log('📤 Sending email with CORRECT payload:', {
        to: recipientEmail,
        subject: emailSubject,
        encryptionLevel: requestBody.encryptionLevel,
        bodyLength: body.length
      });

      // ✅ ✅ ✅ CRITICAL: Correct API endpoint
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send email HTTP error:', response.status, errorText);
        return { 
          success: false, 
          message: `Server error: ${response.status} - ${errorText || 'Unknown error'}` 
        };
      }
      
      const data = await response.json();
      console.log('📤 Send email response:', data);
      
      return data;
    } catch (error) {
      console.error('Send email network error:', error);
      return { 
        success: false, 
        message: `Network error: ${error.message || 'Please check your connection'}` 
      };
    }
  },

  // Update email (star, read, etc.)
  updateEmail: async (emailId, updates) => {
    try {
      const token = localStorage.getItem('qumail_token');
      const userEmail = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/email/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: userEmail,
          emailId,
          updates
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Update email error:', error);
      return { success: false };
    }
  },

  // Bulk update emails
  bulkUpdate: async (emailIds, updates) => {
    try {
      const token = localStorage.getItem('qumail_token');
      const userEmail = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/emails/bulk-update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: userEmail,
          emailIds,
          updates
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Bulk update error:', error);
      return { success: false };
    }
  },

  // Move emails to folder
  moveEmails: async (emailIds, targetFolder) => {
    try {
      const token = localStorage.getItem('qumail_token');
      const userEmail = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/emails/move`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: userEmail,
          emailIds,
          targetFolder
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Move emails error:', error);
      return { success: false };
    }
  },

  // Create draft
  createDraft: async (to, subject, body) => {
    try {
      const token = localStorage.getItem('qumail_token');
      const from = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/draft`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          from,
          to,
          subject,
          body
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Create draft error:', error);
      return { success: false };
    }
  },

  // Get drafts
  getDrafts: async () => {
    try {
      const token = localStorage.getItem('qumail_token');
      const email = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/drafts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      return data.success ? data.drafts : [];
    } catch (error) {
      console.error('Get drafts error:', error);
      return [];
    }
  },

  // Delete email/draft
  deleteEmail: async (emailId, permanent = false) => {
    try {
      const token = localStorage.getItem('qumail_token');
      const email = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/email/delete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email,
          emailId,
          permanent
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Delete email error:', error);
      return { success: false };
    }
  },

  // Search emails
  searchEmails: async (query, folder = 'all') => {
    try {
      const token = localStorage.getItem('qumail_token');
      const email = localStorage.getItem('qumail_email');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/search`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email,
          query,
          folder
        })
      });
      
      const data = await response.json();
      return data.success ? data.results : [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  // Logout
  logout: async () => {
    try {
      const token = localStorage.getItem('qumail_token');
      
      if (token) {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      }
      
      // Clear local storage
      localStorage.removeItem('qumail_token');
      localStorage.removeItem('qumail_email');
      localStorage.removeItem('qumail_name');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage
      localStorage.removeItem('qumail_token');
      localStorage.removeItem('qumail_email');
      localStorage.removeItem('qumail_name');
      return { success: true };
    }
  }
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [allEmails, setAllEmails] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [folders, setFolders] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 100, message: "" });
  const { enqueueSnackbar } = useSnackbar();

  // Handle splash screen finish
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Check for existing session - runs after splash screen
  useEffect(() => {
    if (!showSplash) {
      const checkExistingSession = async () => {
        const token = localStorage.getItem('qumail_token');
        const email = localStorage.getItem('qumail_email');
        const name = localStorage.getItem('qumail_name');
        
        if (token && email && email.toLowerCase().endsWith('@qumail.com')) {
          // Verify token is still valid
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify-token`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            const data = await response.json();
            
            if (data.success) {
              setUserEmail(email);
              setUserName(name || email.split('@')[0]);
              setLoggedIn(true);
              loadUserData();
            } else {
              // Token invalid, clear it
              localStorage.removeItem('qumail_token');
              localStorage.removeItem('qumail_email');
              localStorage.removeItem('qumail_name');
            }
          } catch (error) {
            console.error('Token verification error:', error);
          }
        }
      };
      
      checkExistingSession();
    }
  }, [showSplash]);

  // Load user data
  const loadUserData = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setLoadingProgress({ current: 10, total: 100, message: "Loading your QuMail..." });
    
    try {
      // 1. Get folders
      setLoadingProgress({ current: 20, total: 100, message: "Loading folders..." });
      const folderData = await QuMailService.getFolders();
      setFolders(folderData);
      console.log('📂 QuMail folders:', folderData);
      
      // 2. Load emails for current folder
      setLoadingProgress({ current: 40, total: 100, message: "Loading emails..." });
      await loadEmails(activeFolder);
      
      setLoadingProgress({ current: 100, total: 100, message: "Ready!" });
      
    } catch (error) {
      console.error('Error loading user data:', error);
      enqueueSnackbar('Failed to load data', { variant: 'error' });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress({ current: 0, total: 100, message: "" });
      }, 500);
    }
  };

  // Load emails - FIXED VERSION
  const loadEmails = async (folder = 'inbox') => {
    try {
      console.log(`📥 Loading ${folder} emails for: ${userEmail}`);
      
      const emails = await QuMailService.fetchEmails(folder, 50);
      console.log(`✅ Received ${Array.isArray(emails) ? emails.length : 0} emails`);
      
      if (!Array.isArray(emails)) {
        console.error('Invalid email data received:', emails);
        enqueueSnackbar('Received invalid email data', { variant: 'error' });
        setAllEmails([]);
        return;
      }
      
      const processedEmails = emails.map(email => ({
        ...email,
        uid: email.id || email._id || `email_${Date.now()}_${Math.random()}`,
        id: email.id || email._id,
        preview: generatePreview(email.body || email.snippet || email.message || ''),
        date: formatDate(email.timestamp || email.createdAt || email.date),
        originalDate: email.timestamp || email.createdAt || email.date,
        security: determineSecurityLevel(email.body || email.message || ''),
        read: email.read !== false,
        starred: email.starred || false,
        important: email.important || false,
        draft: email.draft || false,
        sent: email.sent || false,
        trash: email.trash || false,
        spam: email.spam || false,
        archived: email.archived || false,
        folder: (email.folder || folder).toLowerCase(),
        from: email.from || userEmail,
        to: email.to || '',
        subject: email.subject || '(No Subject)',
        body: email.body || email.message || ''
      }));
      
      setAllEmails(processedEmails);
      
      if (processedEmails.length > 0) {
        enqueueSnackbar(`Loaded ${processedEmails.length} emails`, { 
          variant: 'success',
          autoHideDuration: 3000 
        });
      } else {
        enqueueSnackbar(`No emails in ${folder}`, { 
          variant: 'info',
          autoHideDuration: 2000 
        });
      }
      
    } catch (error) {
      console.error('Error loading emails:', error);
      enqueueSnackbar(`Failed to load emails: ${error.message}`, { variant: 'error' });
      setAllEmails([]);
    }
  };

  // Handle QuMail registration
  const handleRegister = async (name, email, password, confirmPassword) => {
    if (!name || !email || !password || !confirmPassword) {
      enqueueSnackbar("Please fill in all fields", { variant: "error" });
      return;
    }
    
    if (password !== confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }
    
    // Validate @qumail.com address
    if (!email.toLowerCase().endsWith('@qumail.com')) {
      enqueueSnackbar("Only @qumail.com addresses are supported", { 
        variant: "warning",
        autoHideDuration: 5000 
      });
      return;
    }
    
    setLoading(true);
    setLoadingProgress({ current: 10, total: 100, message: "Creating your QuMail account..." });
    
    try {
      console.log("📝 Registering new QuMail user:", email);
      
      // Test connection first
      setLoadingProgress({ current: 20, total: 100, message: "Testing connection..." });
      const isConnected = await QuMailService.testConnection();
      if (!isConnected) {
        throw new Error("QuMail server is not running. Please start the backend server.");
      }
      
      // Register
      setLoadingProgress({ current: 40, total: 100, message: "Registering account..." });
      const result = await QuMailService.register(name, email, password, confirmPassword);
      
      if (result.success) {
        setLoadingProgress({ current: 80, total: 100, message: "Registration successful!" });
        
        enqueueSnackbar("QuMail account created successfully! Welcome to secure email.", { 
          variant: "success",
          autoHideDuration: 4000 
        });
        
        // Auto login after registration
        setUserEmail(email);
        setUserName(name);
        setLoggedIn(true);
        
        // Load data
        setTimeout(() => {
          loadUserData();
        }, 500);
        
      } else {
        enqueueSnackbar(result.message || "Registration failed", { variant: "error" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      enqueueSnackbar(err.message || "Failed to register. Please try again.", { variant: "error" });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress({ current: 0, total: 100, message: "" });
      }, 500);
    }
  };

  // Handle QuMail login
  const handleLogin = async (email, password) => {
    if (!email || !password) {
      enqueueSnackbar("Please enter your QuMail email and password", { variant: "error" });
      return;
    }
    
    // Validate @qumail.com address
    if (!email.toLowerCase().endsWith('@qumail.com')) {
      enqueueSnackbar("Only @qumail.com addresses are supported", { 
        variant: "warning",
        autoHideDuration: 5000 
      });
      return;
    }
    
    setLoading(true);
    setLoadingProgress({ current: 10, total: 100, message: "Logging in to QuMail..." });
    
    try {
      console.log("🔐 Logging in to QuMail:", email);
      
      // Test connection first
      setLoadingProgress({ current: 20, total: 100, message: "Testing connection..." });
      const isConnected = await QuMailService.testConnection();
      if (!isConnected) {
        throw new Error("QuMail server is not running. Please start the backend server.");
      }
      
      // Login
      setLoadingProgress({ current: 40, total: 100, message: "Authenticating..." });
      const result = await QuMailService.login(email, password);
      
      if (result.success) {
        setUserEmail(email);
        setUserName(result.name || email.split('@')[0]);
        setLoggedIn(true);
        
        setLoadingProgress({ current: 70, total: 100, message: "Login successful!" });
        
        enqueueSnackbar("Welcome back to QuMail!", { 
          variant: "success",
          autoHideDuration: 3000 
        });
        
        // Clear old key cache
        clearKeyCache(email);
        
        // Load data
        setTimeout(() => {
          loadUserData();
        }, 500);
        
      } else {
        enqueueSnackbar(result.message || "Login failed", { variant: "error" });
      }
    } catch (err) {
      console.error("Login error:", err);
      enqueueSnackbar(err.message || "Network error. Please check your connection.", { 
        variant: "error" 
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress({ current: 0, total: 100, message: "" });
      }, 500);
    }
  };

  // Handle folder change
  const handleFolderChange = (folder) => {
    console.log("📂 Changing folder to:", folder);
    setActiveFolder(folder);
    loadEmails(folder);
  };

  // Get filtered emails
  const getFilteredEmails = useCallback(() => {
    return allEmails.filter(email => {
      if (!email || !email.folder) return false;
      
      // Special handling for starred, important, etc.
      if (activeFolder === 'starred') return email.starred;
      if (activeFolder === 'important') return email.important;
      if (activeFolder === 'drafts') return email.draft;
      if (activeFolder === 'sent') return email.sent;
      if (activeFolder === 'trash') return email.trash;
      if (activeFolder === 'spam') return email.spam;
      if (activeFolder === 'archive') return email.archived;
      
      // Regular folder matching
      return email.folder === activeFolder;
    }).sort((a, b) => {
      // Sort by date (newest first)
      try {
        const dateA = new Date(a.originalDate || a.date || 0);
        const dateB = new Date(b.originalDate || b.date || 0);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
  }, [allEmails, activeFolder]);

  // Calculate email statistics
  const emailStats = useMemo(() => {
    const stats = {
      inbox: allEmails.filter(e => e.folder === 'inbox').length,
      starred: allEmails.filter(e => e.starred).length,
      important: allEmails.filter(e => e.important).length,
      sent: allEmails.filter(e => e.sent).length,
      drafts: allEmails.filter(e => e.draft).length,
      trash: allEmails.filter(e => e.trash).length,
      spam: allEmails.filter(e => e.spam).length,
      archive: allEmails.filter(e => e.archived).length
    };

    return stats;
  }, [allEmails]);

  // Update email state
  const handleUpdateEmail = async (uid, action, value) => {
    try {
      console.log(`🔄 Updating email ${uid}: ${action} = ${value}`);
      
      const email = allEmails.find(e => e.uid === uid);
      if (!email) return;
      
      // Update on server
      const result = await QuMailService.updateEmail(uid, { [action]: value });
      
      if (result.success) {
        // Update local state
        setAllEmails(prev => prev.map(email => 
          email.uid === uid ? { ...email, [action]: value } : email
        ));
        
        const actionText = {
          starred: value ? 'starred' : 'unstarred',
          important: value ? 'marked as important' : 'unmarked as important',
          read: value ? 'marked as read' : 'marked as unread',
          trash: value ? 'moved to trash' : 'restored from trash',
          spam: value ? 'marked as spam' : 'marked as not spam',
          archived: value ? 'archived' : 'unarchived'
        }[action] || 'updated';
        
        enqueueSnackbar(`Email ${actionText}`, { variant: 'success' });
      } else {
        throw new Error('Update failed');
      }
      
    } catch (error) {
      console.error('Update email error:', error);
      enqueueSnackbar(`Failed to update email: ${error.message}`, { variant: 'error' });
    }
  };

  // Bulk actions
  const handleBulkAction = async (uids, action, value = true) => {
    try {
      console.log(`📦 Bulk action: ${uids.length} emails, ${action} = ${value}`);
      
      // Update on server
      const result = await QuMailService.bulkUpdate(uids, { [action]: value });
      
      if (result.success) {
        // Update local state
        setAllEmails(prev => prev.map(email => 
          uids.includes(email.uid) ? { ...email, [action]: value } : email
        ));
        
        enqueueSnackbar(`${uids.length} emails updated`, { variant: 'success' });
      } else {
        throw new Error('Bulk update failed');
      }
      
    } catch (error) {
      console.error('Bulk action error:', error);
      enqueueSnackbar(`Failed to perform bulk action: ${error.message}`, { variant: 'error' });
    }
  };

  // Move emails to folder
  const handleMoveEmails = async (uids, targetFolder) => {
    try {
      console.log(`🚚 Moving ${uids.length} emails to ${targetFolder}`);
      
      // Update on server
      const result = await QuMailService.moveEmails(uids, targetFolder);
      
      if (result.success) {
        // Update local state
        setAllEmails(prev => prev.map(email => 
          uids.includes(email.uid) ? { 
            ...email, 
            folder: targetFolder,
            trash: targetFolder === 'trash',
            spam: targetFolder === 'spam',
            archived: targetFolder === 'archive'
          } : email
        ));
        
        enqueueSnackbar(`Moved ${uids.length} emails to ${targetFolder}`, { variant: 'success' });
      } else {
        throw new Error('Move failed');
      }
      
    } catch (error) {
      console.error('Move emails error:', error);
      enqueueSnackbar(`Failed to move emails: ${error.message}`, { variant: 'error' });
    }
  };

  // Save draft
  const handleSaveDraft = async (draft) => {
    try {
      const result = await QuMailService.createDraft(
        draft.to || '',
        draft.subject || '(No Subject)',
        draft.body || ''
      );
      
      if (result.success && result.draft) {
        const newDraft = {
          ...draft,
          ...result.draft,
          uid: result.draft.id,
          id: result.draft.id,
          draft: true,
          folder: 'drafts',
          date: formatDate(result.draft.createdAt),
          originalDate: result.draft.createdAt,
          preview: generatePreview(draft.body || ''),
          from: userEmail,
          to: draft.to || '',
          subject: draft.subject || '(No Subject)',
          body: draft.body || '',
          security: 'none',
          read: true,
          starred: false,
          important: false,
          snoozed: null,
          sent: false,
          trash: false,
          spam: false,
          archived: false
        };
        
        setAllEmails(prev => [...prev, newDraft]);
        enqueueSnackbar('Draft saved', { variant: 'success' });
        return newDraft;
      } else {
        throw new Error(result.message || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      enqueueSnackbar('Failed to save draft', { variant: 'error' });
      return null;
    }
  };

  // Delete draft/email
  const handleDeleteEmail = async (emailId, permanent = false) => {
    try {
      const result = await QuMailService.deleteEmail(emailId, permanent);
      
      if (result.success) {
        // Remove from local state
        setAllEmails(prev => prev.filter(email => email.uid !== emailId));
        
        enqueueSnackbar(
          permanent ? 'Email permanently deleted' : 'Email moved to trash', 
          { variant: 'success' }
        );
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete email error:', error);
      enqueueSnackbar('Failed to delete email', { variant: 'error' });
    }
  };

  // ✅ ✅ ✅ FIXED: Send email with CORRECT backend contract
  const handleSendEmail = async (to, subject, body, level, draftId = null) => {
    // ✅ CRITICAL: Frontend validation
    if (!to || !to.trim()) {
      enqueueSnackbar("Please enter recipient email", { variant: "warning" });
      return;
    }
    
    if (!body || !body.trim()) {
      enqueueSnackbar("Please enter message content", { variant: "warning" });
      return;
    }

    // Validate recipient is @qumail.com
    const recipientEmail = to.toLowerCase().trim();
    if (!recipientEmail.endsWith('@qumail.com')) {
      enqueueSnackbar("Can only send to @qumail.com addresses", { 
        variant: "error",
        autoHideDuration: 5000 
      });
      return;
    }

    // Validate sender is @qumail.com
    if (!userEmail.toLowerCase().endsWith('@qumail.com')) {
      enqueueSnackbar("Invalid sender email", { 
        variant: "error",
        autoHideDuration: 5000 
      });
      return;
    }

    setLoading(true);
    
    try {
      let emailBody = body;
      let sendLevel = "none";
      let backendType = "NORMAL"; // Default type for backend

      // ✅ PROPER ENCRYPTION SEPARATION:
      if (level === "otp") {
        // FRONTEND OTP ENCRYPTION
        const key = generateOTPKey(32); // HEX key
        const encrypted = otpEncrypt(body, key);
        emailBody = `[otp|${key}]:${encrypted}`;
        cacheKey(userEmail, key);
        sendLevel = "otp";
        backendType = "OTP"; // Tell backend it's OTP
        console.log("✅ OTP encrypted in UI. Key cached.");
      }
      else if (level === "aes") {
        // ✅ BACKEND AES ENCRYPTION - DO NOT ENCRYPT IN UI
        // Just mark it as AES - backend will encrypt it
        sendLevel = "aes";
        backendType = "AES"; // ✅ CRITICAL: Tell backend to encrypt with AES
        console.log("📤 AES encryption delegated to backend with type: AES");
      }
      else {
        // Standard email
        sendLevel = "none";
        backendType = "NORMAL";
      }

      // ✅ ✅ ✅ FIXED: Send with CORRECT encryption type mapping
      const result = await QuMailService.sendEmail(
        recipientEmail, 
        subject || '(No Subject)', 
        emailBody,
        backendType  // This will be mapped to "encryptionLevel" in sendEmail function
      );
      
      console.log('📤 Send result:', result);
      
      if (result.success) {
        // If this was a draft being sent, delete the draft
        if (draftId) {
          await QuMailService.deleteEmail(draftId);
          setAllEmails(prev => prev.filter(email => email.uid !== draftId));
        }
        
        // Add to sent folder
        const sentEmail = {
          uid: result.messageId || `sent_${Date.now()}`,
          id: result.messageId || `sent_${Date.now()}`,
          from: userEmail,
          to: recipientEmail,
          subject: subject || '(No Subject)',
          body: emailBody,
          sent: true,
          folder: 'sent',
          date: new Date().toISOString(),
          originalDate: new Date().toISOString(),
          preview: generatePreview(body),
          security: sendLevel,
          read: true,
          starred: false,
          important: false,
          snoozed: null,
          draft: false,
          trash: false,
          spam: false,
          archived: false
        };
        
        setAllEmails(prev => [...prev, sentEmail]);
        
        enqueueSnackbar("Email sent successfully!", { variant: "success" });
        
        const summaries = {
          otp: { title: "Quantum OTP Encrypted", icon: "🔒" },
          aes: { title: "Quantum AES Encrypted", icon: "⚡" },
          none: { title: "Standard Email", icon: "✉️" }
        };
        
        enqueueSnackbar(
          `${summaries[sendLevel].icon} ${summaries[sendLevel].title}`,
          { variant: "info", autoHideDuration: 3000 }
        );
        
        // Load sent folder to show the sent email
        setTimeout(() => {
          loadEmails('sent');
        }, 1000);
        
      } else {
        // Show specific error message from backend
        const errorMessage = result.message || "Failed to send email";
        console.error('Send email failed:', errorMessage);
        enqueueSnackbar(`Failed: ${errorMessage}`, { 
          variant: "error",
          autoHideDuration: 5000 
        });
      }

    } catch (err) {
      console.error("Send email error:", err);
      enqueueSnackbar(`Network error: ${err.message}`, { 
        variant: "error",
        autoHideDuration: 5000 
      });
    } finally {
      setLoading(false);
    }
  };

  // Get full email body
  const handleGetEmailBody = async (uid, folder = 'inbox') => {
    const email = allEmails.find(e => e.uid === uid);
    if (email && email.body) {
      return email.body;
    }
    
    // Fetch from server if not in cache
    try {
      const fullEmail = await QuMailService.getEmail(uid);
      if (fullEmail && fullEmail.body) {
        // Update cache
        setAllEmails(prev => prev.map(e => 
          e.uid === uid ? { ...e, body: fullEmail.body } : e
        ));
        return fullEmail.body;
      }
    } catch (error) {
      console.error('Error fetching email body:', error);
    }
    
    return '';
  };

  // Decrypt email - FIXED VERSION
  const handleDecryptEmail = async (encryptedBody, level) => {
    if (level === "none") return encryptedBody;
    
    if (level === "otp") {
      const key = getValidKey(userEmail);
      if (!key) return "❌ OTP expired or key not available";
      return otpDecrypt(encryptedBody, key);
    }
    
    if (level === "aes") {
      return "🔐 AES encrypted - Decryption handled by backend";
    }
    
    return encryptedBody;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await QuMailService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local state
    setLoggedIn(false);
    setAllEmails([]);
    setUserEmail("");
    setUserName("");
    setActiveFolder("inbox");
    setFolders([]);
    clearKeyCache();
    
    enqueueSnackbar("Logged out from QuMail", { variant: "info" });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadEmails(activeFolder);
      enqueueSnackbar("Emails refreshed", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to refresh emails", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    enqueueSnackbar(`Switched to ${newMode ? 'dark' : 'light'} mode`, { 
      variant: "info",
      autoHideDuration: 2000 
    });
  };

  // Toggle between login and register
  const toggleAuthMode = () => {
    setShowRegister(!showRegister);
  };

  // Apply theme
  const appliedTheme = useMemo(() => createTheme({
    ...theme,
    palette: { 
      ...theme.palette, 
      mode: darkMode ? 'dark' : 'light',
      background: darkMode ? { 
        default: '#121212', 
        paper: '#1e1e1e' 
      } : theme.palette.background
    },
  }), [darkMode]);

  // Handle email list when active folder changes
  useEffect(() => {
    if (loggedIn && userEmail && activeFolder) {
      loadEmails(activeFolder);
    }
  }, [activeFolder, loggedIn, userEmail]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show the main app content after splash screen
  return (
    <ThemeProvider theme={appliedTheme}>
      <CssBaseline />
      {loggedIn ? (
        <Dashboard
          emails={getFilteredEmails()}
          activeFolder={activeFolder}
          onFolderChange={handleFolderChange}
          userEmail={userEmail}
          userName={userName}
          onSendEmail={handleSendEmail}
          onSaveDraft={handleSaveDraft}
          onDeleteDraft={handleDeleteEmail}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
          onUpdateEmail={handleUpdateEmail}
          onBulkAction={handleBulkAction}
          onMoveEmails={handleMoveEmails}
          onGetEmailBody={handleGetEmailBody}
          onDecryptEmail={handleDecryptEmail}
          loading={loading}
          loadingProgress={loadingProgress}
          emailStats={emailStats}
          onToggleTheme={toggleTheme}
          darkMode={darkMode}
          determineSecurityLevel={determineSecurityLevel}
          generatePreview={generatePreview}
          formatDate={formatDate}
          isQumail={true}
          folders={folders}
        />
      ) : showRegister ? (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={toggleAuthMode} 
          loading={loading} 
          isQumail={true}
        />
      ) : (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={toggleAuthMode} 
          loading={loading} 
          isQumail={true}
        />
      )}
    </ThemeProvider>
  );
};

function App() {
  return (
    <SnackbarProvider 
      maxSnack={3} 
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={4000}
    >
      <AppContent />
    </SnackbarProvider>
  );
}

export default App;