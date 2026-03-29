import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import QuMailService from '../services/QuMailService';
import { useSnackbar } from 'notistack';
import { 
  useEmailsQuery, 
  useFolderCountsQuery, 
  useNotificationsQuery, 
  useLabelsQuery,
  useEmailActionMutation,
  useLabelMutation,
  useNotificationMutation,
  queryKeys
} from './useQuMailQueries';
import { useQueryClient } from '@tanstack/react-query';

export const useDashboardActions = (user, initialFolder = 'inbox') => {
  const [activeFolder, setActiveFolder] = useState(initialFolder);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  
  const lastNotifId = useRef(null);
  const emailEmbeddings = useRef({});
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const isAiSearchEnabled = true;
  const [semanticEmails, setSemanticEmails] = useState(null);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('qumail_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // Queries
  const { 
    data: emailData, 
    isLoading: emailsLoading, 
    isFetching: emailsFetching 
  } = useEmailsQuery(activeFolder, page, limit, !!user && !searchQuery);

  const { 
    data: folderCounts = { inbox: 0, sent: 0, drafts: 0, trash: 0, archive: 0, unread: 0 },
    isLoading: countsLoading 
  } = useFolderCountsQuery(!!user);

  const { 
    data: notifications = [],
    isLoading: notificationsLoading 
  } = useNotificationsQuery(!!user);

  const { 
    data: labels = [],
    isLoading: labelsLoading 
  } = useLabelsQuery(!!user);

  // Mutations
  const emailActionMutation = useEmailActionMutation();
  const labelMutation = useLabelMutation();
  const notificationMutation = useNotificationMutation();

  useEffect(() => {
    const handleUpdate = (e) => setSettings(e.detail || {});
    window.addEventListener('qumail-settings-updated', handleUpdate);
    return () => window.removeEventListener('qumail-settings-updated', handleUpdate);
  }, []);

  // System Notification Handler
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest.id !== lastNotifId.current && latest.status === 'unread') {
        if (settings.pushNotifications && Notification.permission === 'granted') {
          try {
             new Notification(latest.title, { 
                body: latest.message,
                icon: '/logo192.png'
             });
          } catch (e) { console.error("Notification trigger failed", e); }
        }

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
          chime.play().catch(() => {});
        }
        lastNotifId.current = latest.id;
      }
    }
  }, [notifications, settings]);

  // Semantic search logic
  const generateMockEmbedding = useCallback((text) => {
    if (!text) return new Array(32).fill(0);
    const words = text.toLowerCase().match(/\w+/g) || [];
    const vector = new Array(32).fill(0);
    words.forEach(word => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) hash = (hash << 5) - hash + word.charCodeAt(i);
      vector[Math.abs(hash) % 32] += 1;
    });
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / magnitude);
  }, []);

  const calculateCosineSimilarity = useCallback((vecA, vecB) => {
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) dotProduct += vecA[i] * vecB[i];
    return dotProduct;
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setIsSemanticSearch(false);
      setSemanticEmails(null);
      return; 
    }

    const timer = setTimeout(async () => {
      try {
        let results = await QuMailService.searchEmails(searchQuery, activeFolder);
        
        if (isAiSearchEnabled) {
          const queryVector = generateMockEmbedding(searchQuery);
          const semanticResults = results.map(email => {
            const id = email.id || email.uid;
            let emailVector = emailEmbeddings.current[id];
            if (!emailVector) {
              const textToIndex = `${email.subject} ${email.from} ${email.preview || (email.body?.substring(0, 100))}`;
              emailVector = generateMockEmbedding(textToIndex);
              emailEmbeddings.current[id] = emailVector;
            }
            const similarity = calculateCosineSimilarity(queryVector, emailVector);
            return { ...email, similarity };
          });
          const sorted = semanticResults.sort((a, b) => b.similarity - a.similarity);
          setSemanticEmails(sorted);
          setIsSemanticSearch(true);
        } else {
          setSemanticEmails(results);
          setIsSemanticSearch(false);
        }
      } catch (err) {
        enqueueSnackbar('Search failed', { variant: 'error' });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFolder, isAiSearchEnabled, enqueueSnackbar, generateMockEmbedding, calculateCosineSimilarity]);

  // Public methods
  const fetchEmails = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['emails'] });
  }, [queryClient]);

  const addNotification = useCallback((title, message, type = 'info', icon = 'Info') => {
    // This adds a local notification. In a real app, you'd push to server then invalidate.
    // For now, we'll just show the snackbar and assume server handles the persistent part.
    enqueueSnackbar(`${title}: ${message}`, { variant: type });
  }, [enqueueSnackbar]);

  const handleAction = useCallback(async (mailId, action, extra = {}) => {
    try {
      await emailActionMutation.mutateAsync({ mailId, action, extra });
      return true;
    } catch (error) {
      enqueueSnackbar('Action failed', { variant: 'error' });
      return false;
    }
  }, [emailActionMutation, enqueueSnackbar]);

  const markNotificationAsRead = useCallback(async (id) => {
    try {
      await notificationMutation.mutateAsync({ id, action: 'read' });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }, [notificationMutation]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationMutation.mutateAsync({ id, action: 'delete' });
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }, [notificationMutation]);

  const createLabel = useCallback(async (name, color) => {
    try {
      await labelMutation.mutateAsync({ name, color, action: 'create' });
      enqueueSnackbar('Label created', { variant: 'success' });
      return true;
    } catch (err) {
      enqueueSnackbar('Failed to create label', { variant: 'error' });
      return false;
    }
  }, [labelMutation, enqueueSnackbar]);

  const deleteLabel = useCallback(async (id) => {
    try {
      await labelMutation.mutateAsync({ id, action: 'delete' });
      if (activeFolder === id) setActiveFolder('inbox');
      enqueueSnackbar('Label deleted', { variant: 'success' });
      return true;
    } catch (err) {
      enqueueSnackbar('Failed to delete label', { variant: 'error' });
      return false;
    }
  }, [labelMutation, enqueueSnackbar, activeFolder]);

  const updateLabel = useCallback(async (id, name, color) => {
    try {
      await labelMutation.mutateAsync({ id, name, color, action: 'update' });
      enqueueSnackbar('Label updated', { variant: 'success' });
      return true;
    } catch (err) {
      enqueueSnackbar('Failed to update label', { variant: 'error' });
      return false;
    }
  }, [labelMutation, enqueueSnackbar]);

  const handleDecryptEmail = useCallback(async (emailId, encryptionKey) => {
    try {
      return await QuMailService.decryptEmail(emailId, encryptionKey);
    } catch (error) {
      enqueueSnackbar('Decryption failed', { variant: 'error' });
      return { success: false, message: error.message };
    }
  }, [enqueueSnackbar]);

  const finalEmails = useMemo(() => {
    if (searchQuery) return semanticEmails || [];
    return emailData?.emails || [];
  }, [searchQuery, semanticEmails, emailData]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => n.status !== 'read').map(n => n.id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map(id => notificationMutation.mutateAsync({ id, action: 'read' })));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }, [notifications, notificationMutation]);


  return {
    emails: finalEmails,
    folderCounts,
    activeFolder,
    setActiveFolder,
    loading: emailsLoading || emailsFetching || countsLoading || notificationsLoading || labelsLoading,
    notifications,
    addNotification,
    handleAction,
    handleDecryptEmail,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    fetchEmails,
    searchQuery,
    setSearchQuery,
    labels,
    createLabel,
    deleteLabel,
    fetchLabels: () => queryClient.invalidateQueries({ queryKey: queryKeys.labels }),
    isSemanticSearch,
    isAiSearchEnabled,
    updateLabel,
    page,
    setPage,
    total: searchQuery ? (semanticEmails?.length || 0) : (emailData?.total || 0),
    limit,
  };
};


export default useDashboardActions;

