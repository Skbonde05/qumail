import { useState, useCallback, useEffect, useRef } from 'react';
import QuMailService from '../services/QuMailService';
import { useSnackbar } from 'notistack';

export const useDashboardActions = (user, initialFolder = 'inbox') => {
  const [emails, setEmails] = useState([]);
  const [folderCounts, setFolderCounts] = useState({ inbox: 0, sent: 0, drafts: 0, trash: 0, archive: 0, unread: 0 });
  const [activeFolder, setActiveFolder] = useState(initialFolder);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [labels, setLabels] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const lastNotifId = useRef(null);
  const emailEmbeddings = useRef({}); // Local store for email vectors
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isAiSearchEnabled, setIsAiSearchEnabled] = useState(true);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('qumail_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  useEffect(() => {
    const handleUpdate = (e) => setSettings(e.detail || {});
    window.addEventListener('qumail-settings-updated', handleUpdate);
    return () => window.removeEventListener('qumail-settings-updated', handleUpdate);
  }, []);

  // System Notification Handler
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Only notify for fresh UNREAD notifications we haven't seen in this session
      if (latest.id !== lastNotifId.current && latest.status === 'unread') {
        const isMFA = latest.title.includes('MFA') || latest.title.includes('Security');
        
        // Push Notification
        if (settings.pushNotifications && Notification.permission === 'granted') {
          try {
             new Notification(latest.title, { 
                body: latest.message,
                icon: '/logo192.png' // Use site logo if available
             });
          } catch (e) { console.error("Notification trigger failed", e); }
        }

        // Sound Notification
        if (settings.soundNotifications) {
          const sounds = {
            gentle: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
            classic: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
            modern: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
            custom: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
          };
          const soundUrl = sounds[settings.notificationSound] || sounds.gentle;
          const chime = new Audio(soundUrl);
          chime.volume = 0.4;
          chime.play().catch(() => {}); // Autoplay policies might block this until user interacts
        }

        lastNotifId.current = latest.id;
      }
    }
  }, [notifications, settings]);

  // Storage Cleanup Engine
  useEffect(() => {
    if (!settings.autoCleanup) return;
    
    const performCleanup = () => {
      let totalSize = 0;
      const cacheKeys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('qumail_cache_')) {
          const content = localStorage.getItem(key);
          totalSize += (content.length * 2) / (1024 * 1024); // Est MB
          cacheKeys.push(key);
        }
      }

      const limit = settings.maxCacheSize || 1000;
      const threshold = settings.cleanupThreshold || 70;
      
      // If we are over threshold or over limit, clear all
      if (totalSize > limit || totalSize > (limit * (threshold / 100))) {
        cacheKeys.forEach(key => localStorage.removeItem(key));
        console.log('QuMail: Storage auto-cleanup performed.');
      }
    };

    performCleanup();
  }, [settings.autoCleanup, settings.maxCacheSize, settings.cleanupThreshold]);


  const fetchNotifications = useCallback(async () => {
    try {
      const res = await QuMailService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50); // Gmail standard

  const fetchEmails = useCallback(async (folder = activeFolder, currentPage = page) => {
    setLoading(true);
    try {
      const resp = await QuMailService.fetchEmails(folder, limit, currentPage);
      const emailsData = resp.emails || resp; // API might return { emails, total }
      const countsData = await QuMailService.getFolderCounts();
      
      setEmails(emailsData);
      setTotal(resp.total || emailsData.length); // Fallback to length if API doesn't provide total
      setFolderCounts(countsData);
      
      // Cache logic
      if (settings.cacheEmails) {
        localStorage.setItem(`qumail_cache_${folder}`, JSON.stringify(emailsData));
      }
    } catch (error) {
      console.error('Fetch emails failure:', error);
      
      // Fallback to cache if enabled
      if (settings.cacheEmails) {
        const cached = localStorage.getItem(`qumail_cache_${folder}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setEmails(parsed.emails || parsed);
            enqueueSnackbar('Working offline: showing cached emails', { variant: 'info' });
            return;
          } catch(e) {}
        }
      }
      
      enqueueSnackbar('Failed to load emails', { variant: 'error' });
    } finally {
      setLoading(false);
    }

  }, [activeFolder, enqueueSnackbar, limit, page, settings.cacheEmails]);

  useEffect(() => {
    if (user) {
      fetchEmails();
      fetchNotifications();
      
      // Sync frequency from settings (minutes -> ms)
      const syncInterval = (settings.syncFrequency || 5) * 60000;
      const interval = setInterval(() => {
        fetchEmails();
        fetchNotifications();
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [user, activeFolder, fetchEmails, fetchNotifications, settings.syncFrequency, searchQuery]);


  // Server-Side Search Integration
  useEffect(() => {
    // Only search if there's a query; otherwise the default fetchEmails handles it
    if (!searchQuery) {
      return; 
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await QuMailService.searchEmails(searchQuery, activeFolder);
        setEmails(results);
      } catch (err) {
        enqueueSnackbar('Search failed', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, activeFolder, enqueueSnackbar]);


  // --- Privacy-Preserving AI Semantic Search Logic (Prototype) ---
  
  // 1. Mock Embedding Generator (Simplification of transformers.js)
  const generateMockEmbedding = useCallback((text) => {
    if (!text) return new Array(32).fill(0);
    const words = text.toLowerCase().match(/\w+/g) || [];
    const vector = new Array(32).fill(0);
    words.forEach(word => {
      // Use a simple hash to distribute word weights into a 32-dim vector
      let hash = 0;
      for (let i = 0; i < word.length; i++) hash = (hash << 5) - hash + word.charCodeAt(i);
      vector[Math.abs(hash) % 32] += 1;
    });
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / magnitude);
  }, []);

  // 2. Cosine Similarity Calculator
  const calculateCosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) dotProduct += vecA[i] * vecB[i];
    return dotProduct;
  };

  // 3. Index emails for semantic search when they are fetched
  useEffect(() => {
    if (emails.length > 0) {
      emails.forEach(email => {
        const id = email.id || email.uid;
        if (!emailEmbeddings.current[id]) {
          const textToIndex = `${email.subject} ${email.from} ${email.preview || ''}`;
          emailEmbeddings.current[id] = generateMockEmbedding(textToIndex);
        }
      });
    }
  }, [emails, generateMockEmbedding]);

  // 4. Enhanced Search with Semantic Relevance
  useEffect(() => {
    if (!searchQuery) {
      setIsSemanticSearch(false);
      return; 
    }

    // Only apply semantic search if enabled
    if (!isAiSearchEnabled) {
      setIsSemanticSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Step A: Get keyword results from server
        let results = await QuMailService.searchEmails(searchQuery, activeFolder);
        
        // Step B: Apply Semantic Scoring locally (Privacy-Preserving)
        const queryVector = generateMockEmbedding(searchQuery);
        
        const scoredResults = results.map(email => {
          const id = email.id || email.uid;
          const vector = emailEmbeddings.current[id] || generateMockEmbedding(`${email.subject} ${email.from}`);
          const semanticScore = calculateCosineSimilarity(queryVector, vector);
          
          return {
            ...email,
            relevanceScore: semanticScore,
            isSemanticMatch: semanticScore > 0.4
          };
        });

        // Step C: Sort by Semantic Relevance
        scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        setEmails(scoredResults);
        setIsSemanticSearch(scoredResults.some(r => r.isSemanticMatch));
      } catch (err) {
        enqueueSnackbar('AI Search failed', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFolder, enqueueSnackbar, generateMockEmbedding, isAiSearchEnabled]);



  const addNotification = useCallback(async (title, message, type = 'info', icon = 'Info') => {
    // Note: We don't have a POST /notifications for custom client-side notifications yet,
    // so we'll keep it local for now OR we could add it to the backend.
    // For now, let's just refresh after actions.
    const newNotif = {
      id: 'local-' + Date.now(),
      title, message, type, icon,
      timestamp: new Date().toISOString(),
      status: 'unread'
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  const handleAction = useCallback(async (mailId, action, extra = {}) => {
    try {
      const isBatch = Array.isArray(mailId);
      const res = isBatch 
        ? await QuMailService.batchUpdate(mailId, action, extra)
        : await QuMailService.updateEmailStatus(mailId, action, extra);
        
      if (res.success) {
        fetchEmails();
        fetchNotifications();
        return true;
      }
    } catch (error) {
      enqueueSnackbar('Action failed', { variant: 'error' });
    }
    return false;
  }, [fetchEmails, fetchNotifications, enqueueSnackbar]);

  const markNotificationAsRead = useCallback(async (id) => {
    if (id.toString().startsWith('local-')) {
       setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
       return;
    }
    try {
      await QuMailService.updateNotificationStatus(id, 'read');
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id) => {
    if (id.toString().startsWith('local-')) {
       setNotifications(prev => prev.filter(n => n.id !== id));
       return;
    }
    try {
      await QuMailService.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }, [fetchNotifications]);

  const fetchLabels = useCallback(async () => {
    try {
      const data = await QuMailService.getLabels();
      setLabels(data || []);
    } catch (err) {
      console.error("Failed to fetch labels", err);
    }
  }, []);

  const createLabel = useCallback(async (name, color) => {
    try {
      const res = await QuMailService.createLabel(name, color);
      if (res.success) {
        fetchLabels();
        enqueueSnackbar('Label created', { variant: 'success' });
        return true;
      }
    } catch (err) {
      enqueueSnackbar('Failed to create label', { variant: 'error' });
    }
    return false;
  }, [fetchLabels, enqueueSnackbar]);

  const deleteLabel = useCallback(async (id) => {
    try {
      const res = await QuMailService.deleteLabel(id);
      if (res.success) {
        if (activeFolder === id || activeFolder === id.toUpperCase()) {
          setActiveFolder('inbox');
          setTimeout(() => fetchEmails('inbox'), 100); 
        } else {
          setTimeout(() => fetchEmails(), 100);
        }
        fetchLabels();
        enqueueSnackbar('Label deleted', { variant: 'success' });
        return true;
      }
    } catch (err) {
      enqueueSnackbar('Failed to delete label', { variant: 'error' });
    }
    return false;
  }, [fetchLabels, fetchEmails, enqueueSnackbar, activeFolder]);

  const updateLabel = useCallback(async (id, name, color) => {
    try {
      const res = await QuMailService.updateLabel(id, name, color);
      if (res.success) {
        fetchLabels();
        if (activeFolder === id) {
           fetchEmails(activeFolder);
        }
        enqueueSnackbar('Label updated', { variant: 'success' });
        return true;
      }
    } catch (err) {
      enqueueSnackbar('Failed to update label', { variant: 'error' });
    }
    return false;
  }, [fetchLabels, enqueueSnackbar, fetchEmails, activeFolder]);


  useEffect(() => {
    if (user) {
      fetchLabels();
    }
  }, [user, fetchLabels]);

  const handleDecryptEmail = useCallback(async (emailId, encryptionKey) => {
    try {
      return await QuMailService.decryptEmail(emailId, encryptionKey);
    } catch (error) {
      enqueueSnackbar('Decryption failed', { variant: 'error' });
      return { success: false, message: error.message };
    }
  }, [enqueueSnackbar]);

  return {
    emails,
    folderCounts,
    activeFolder,
    setActiveFolder,
    loading,
    notifications,
    addNotification,
    handleAction,
    handleDecryptEmail,
    markNotificationAsRead,
    deleteNotification,
    setNotifications,
    fetchEmails,
    searchQuery,
    setSearchQuery,
    labels,
    createLabel,
    deleteLabel,
    fetchLabels,
    isSemanticSearch,
    isAiSearchEnabled,
    setIsAiSearchEnabled,
    updateLabel,
    page,
    setPage,
    total,
    limit,
  };
};

export default useDashboardActions;
