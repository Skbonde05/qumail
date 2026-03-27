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

  const fetchEmails = useCallback(async (folder = activeFolder) => {
    setLoading(true);
    try {
      const [emailsData, countsData] = await Promise.all([
        QuMailService.fetchEmails(folder),
        QuMailService.getFolderCounts()
      ]);
      setEmails(emailsData);
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
            setEmails(JSON.parse(cached));
            enqueueSnackbar('Working offline: showing cached emails', { variant: 'info' });
            return;
          } catch(e) {}
        }
      }
      
      enqueueSnackbar('Failed to load emails', { variant: 'error' });
    } finally {
      setLoading(false);
    }

  }, [activeFolder, enqueueSnackbar]);

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
  }, [user, activeFolder, fetchEmails, fetchNotifications, settings.syncFrequency]);


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
  }, [fetchLabels, fetchEmails, enqueueSnackbar]);

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
  };
};

export default useDashboardActions;
