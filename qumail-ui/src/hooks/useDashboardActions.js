import { useState, useCallback, useEffect } from 'react';
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
      const data = await QuMailService.fetchEmails(folder);
      setEmails(data);
      const counts = await QuMailService.getFolderCounts();
      setFolderCounts(counts);
    } catch (error) {
      console.error('Fetch emails failure:', error);
      enqueueSnackbar('Failed to load emails', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeFolder, enqueueSnackbar]);

  useEffect(() => {
    if (user) {
      fetchEmails();
      fetchNotifications();
      
      // Real-time simulation: poll for new notifications every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, activeFolder, fetchEmails, fetchNotifications]);

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
        fetchLabels();
        fetchEmails(); // Mails might have moved to INBOX
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
