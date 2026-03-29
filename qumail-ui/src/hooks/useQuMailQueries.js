import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QuMailService from '../services/QuMailService';

export const queryKeys = {
  emails: (folder, page, limit) => ['emails', folder || 'inbox', page, limit],
  email: (mailId) => ['email', mailId],
  folderCounts: ['folderCounts'],
  notifications: ['notifications'],
  labels: ['labels'],
  search: (query, folder) => ['search', query, folder],
};

export const useEmailsQuery = (folder, page = 1, limit = 50, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.emails(folder, page, limit),
    queryFn: async () => {
      const data = await QuMailService.fetchEmails(folder, limit, page);
      // Ensure we return an object with emails and total if possible
      // QuMailService.fetchEmails currently returns response.data.emails || []
      // We might need to check if it's an array or object
      return data || { emails: [], total: 0 };
    },
    enabled: !!folder && enabled,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useFolderCountsQuery = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.folderCounts,
    queryFn: () => QuMailService.getFolderCounts(),
    enabled,
    refetchInterval: 1000 * 30, // 30 seconds for real-time feel
  });
};

export const useNotificationsQuery = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const resp = await QuMailService.getNotifications();
      return resp.notifications || [];
    },
    enabled,
    refetchInterval: 1000 * 60, // 1 minute
  });
};

export const useLabelsQuery = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.labels,
    queryFn: () => QuMailService.getLabels(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSearchEmailsQuery = (query, folder, enabled = false) => {
  return useQuery({
    queryKey: queryKeys.search(query, folder),
    queryFn: () => QuMailService.searchEmails(query, folder),
    enabled: !!query && enabled,
  });
};

// Mutations
export const useEmailActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mailId, action, extra }) => {
      const isBatch = Array.isArray(mailId);
      return isBatch 
        ? QuMailService.batchUpdate(mailId, action, extra)
        : QuMailService.updateEmailStatus(mailId, action, extra);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderCounts });
    },
  });
};

export const useLabelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, color, action }) => {
      if (action === 'create') return QuMailService.createLabel(name, color);
      if (action === 'update') return QuMailService.updateLabel(id, name, color);
      if (action === 'delete') return QuMailService.deleteLabel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
};

export const useNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'read') return QuMailService.updateNotificationStatus(id, 'read');
      if (action === 'delete') return QuMailService.deleteNotification(id);
      if (action === 'markAllRead') return QuMailService.markAllNotificationsAsRead();
      if (action === 'deleteAll') return QuMailService.deleteAllNotifications();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

