// src/pages/Dashboard.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Drawer,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Snackbar,
  Alert,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  InputBase
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search,
  Refresh,
  Brightness4,
  Brightness7,
  Person,
  ExitToApp,
  Notifications,
  Security,
  FiberManualRecord,
  ChevronLeft,
  ChevronRight,
  Settings,
  ArrowBack,
  CheckCircle,
  Warning,
  Error,
  Info,
  Delete,
  Mail,
  Lock,
  Public,
  Schedule,
  MarkEmailRead,
  Close,
  MarkAsUnread
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import Sidebar from "../components/Sidebar";
import Inbox from "../components/Inbox";
import Compose from "../components/Compose";
import AppSettings from "../components/AppSettings";
import AccountSettings from "../components/AccountSettings";
import SecuritySettings from "../components/SecuritySettings";

// Search bar component
const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '400px',
    },
  },
}));

// Notification Types
const NOTIFICATION_TYPES = {
  NEW_EMAIL: 'new_email',
  ENCRYPTION_SUCCESS: 'encryption_success',
  SECURITY_ALERT: 'security_alert',
  SYSTEM_UPDATE: 'system_update',
  ACCOUNT_ACTIVITY: 'account_activity',
  EMAIL_READ: 'email_read',
  EMAIL_STARRED: 'email_starred',
  EMAIL_MOVED: 'email_moved',
  EMAIL_DELETED: 'email_deleted',
  DRAFT_SAVED: 'draft_saved',
  LOGIN_ATTEMPT: 'login_attempt',
  PASSWORD_CHANGED: 'password_changed',
  ENCRYPTION_KEY_GENERATED: 'encryption_key_generated',
  QUANTUM_SECURITY_ACTIVATED: 'quantum_security_activated'
};

// Notification Icons
const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.NEW_EMAIL]: <Mail />,
  [NOTIFICATION_TYPES.ENCRYPTION_SUCCESS]: <Lock />,
  [NOTIFICATION_TYPES.SECURITY_ALERT]: <Warning />,
  [NOTIFICATION_TYPES.SYSTEM_UPDATE]: <Public />,
  [NOTIFICATION_TYPES.ACCOUNT_ACTIVITY]: <Person />,
  [NOTIFICATION_TYPES.EMAIL_READ]: <MarkEmailRead />,
  [NOTIFICATION_TYPES.EMAIL_STARRED]: <CheckCircle />,
  [NOTIFICATION_TYPES.EMAIL_MOVED]: <Schedule />,
  [NOTIFICATION_TYPES.EMAIL_DELETED]: <Delete />,
  [NOTIFICATION_TYPES.DRAFT_SAVED]: <Mail />,
  [NOTIFICATION_TYPES.LOGIN_ATTEMPT]: <Security />,
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: <Lock />,
  [NOTIFICATION_TYPES.ENCRYPTION_KEY_GENERATED]: <Lock />,
  [NOTIFICATION_TYPES.QUANTUM_SECURITY_ACTIVATED]: <Security />
};

// Notification Colors
const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPES.NEW_EMAIL]: 'primary',
  [NOTIFICATION_TYPES.ENCRYPTION_SUCCESS]: 'success',
  [NOTIFICATION_TYPES.SECURITY_ALERT]: 'error',
  [NOTIFICATION_TYPES.SYSTEM_UPDATE]: 'info',
  [NOTIFICATION_TYPES.ACCOUNT_ACTIVITY]: 'warning',
  [NOTIFICATION_TYPES.EMAIL_READ]: 'info',
  [NOTIFICATION_TYPES.EMAIL_STARRED]: 'warning',
  [NOTIFICATION_TYPES.EMAIL_MOVED]: 'info',
  [NOTIFICATION_TYPES.EMAIL_DELETED]: 'error',
  [NOTIFICATION_TYPES.DRAFT_SAVED]: 'info',
  [NOTIFICATION_TYPES.LOGIN_ATTEMPT]: 'warning',
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: 'success',
  [NOTIFICATION_TYPES.ENCRYPTION_KEY_GENERATED]: 'success',
  [NOTIFICATION_TYPES.QUANTUM_SECURITY_ACTIVATED]: 'success'
};

export default function Dashboard({
  emails = [],
  activeFolder = "inbox",
  onFolderChange,
  userEmail,
  userPassword,
  onSendEmail,
  onSaveDraft,
  onDeleteDraft,
  onLogout,
  onRefresh,
  onUpdateEmail,
  onBulkAction,
  onMoveEmails,
  onGetEmailBody,
  onDecryptEmail,
  loading,
  emailStats = {},
  onToggleTheme,
  darkMode,
  determineSecurityLevel = () => "none",
  generatePreview = (body) => body ? body.substring(0, 100) : "",
  formatDate = (date) => date ? new Date(date).toLocaleDateString() : "",
  onLoadMoreEmails
}) {
  const [openCompose, setOpenCompose] = useState(false);
  const [activeSection, setActiveSection] = useState(activeFolder);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [currentEmails, setCurrentEmails] = useState([]);
  const [starredEmails, setStarredEmails] = useState([]);
  const [importantEmails, setImportantEmails] = useState([]);
  const [snoozedEmails, setSnoozedEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEmailsCount, setTotalEmailsCount] = useState(0);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  
  // NEW: Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState(0);
  
  // Settings pages state
  const [activePage, setActivePage] = useState("inbox");
  
  const ITEMS_PER_PAGE = 50;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = JSON.parse(localStorage.getItem('qumail_notifications') || '[]');
    const savedStarred = JSON.parse(localStorage.getItem('qumail_starred') || '[]');
    const savedImportant = JSON.parse(localStorage.getItem('qumail_important') || '[]');
    const savedSnoozed = JSON.parse(localStorage.getItem('qumail_snoozed') || '[]');
    
    setNotifications(savedNotifications);
    setStarredEmails(savedStarred);
    setImportantEmails(savedImportant);
    setSnoozedEmails(savedSnoozed);
    
    // Calculate initial unread count
    updateUnreadCount(savedNotifications);
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('qumail_notifications', JSON.stringify(notifications));
    localStorage.setItem('qumail_starred', JSON.stringify(starredEmails));
    localStorage.setItem('qumail_important', JSON.stringify(importantEmails));
    localStorage.setItem('qumail_snoozed', JSON.stringify(snoozedEmails));
  }, [notifications, starredEmails, importantEmails, snoozedEmails]);

  // Update unread notifications count
  const updateUnreadCount = (notificationList = notifications) => {
    const unreadCount = notificationList.filter(n => !n.read).length;
    setUnreadNotifications(unreadCount);
  };

  // Function to add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      type: notification.type || NOTIFICATION_TYPES.SYSTEM_UPDATE,
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: new Date().toISOString(),
      read: false,
      action: notification.action || null,
      priority: notification.priority || 'medium',
      icon: notification.icon || NOTIFICATION_ICONS[notification.type] || <Info />,
      color: notification.color || NOTIFICATION_COLORS[notification.type] || 'info'
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100 notifications
    updateUnreadCount([newNotification, ...notifications]);
    
    // Show snackbar for important notifications
    if (notification.priority === 'high') {
      showSnackbar(`${notification.title}: ${notification.message}`, 'info');
    }
  };

  // Function to mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    updateUnreadCount();
  };

  // Function to mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadNotifications(0);
  };

  // Function to delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    updateUnreadCount();
  };

  // Function to delete all notifications
  const deleteAllNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
  };

  // Function to create specific notification types
  const createEmailNotification = (email, action) => {
    let notificationType, title, message;
    
    switch(action) {
      case 'received':
        notificationType = NOTIFICATION_TYPES.NEW_EMAIL;
        title = 'New Email Received';
        message = `From: ${email.from}`;
        break;
      case 'sent':
        notificationType = NOTIFICATION_TYPES.NEW_EMAIL;
        title = 'Email Sent Successfully';
        message = `To: ${email.to}`;
        break;
      case 'encrypted':
        notificationType = NOTIFICATION_TYPES.ENCRYPTION_SUCCESS;
        title = 'Email Encrypted Securely';
        message = `Sent with ${email.encryptionLevel || 'AES-256'} encryption`;
        break;
      case 'starred':
        notificationType = NOTIFICATION_TYPES.EMAIL_STARRED;
        title = 'Email Starred';
        message = `Subject: ${email.subject || 'No Subject'}`;
        break;
      default:
        notificationType = NOTIFICATION_TYPES.SYSTEM_UPDATE;
        title = 'Email Action';
        message = `Action performed on email`;
    }

    addNotification({
      type: notificationType,
      title,
      message,
      priority: action === 'received' ? 'high' : 'medium',
      action: {
        type: 'view_email',
        emailId: email.id
      }
    });
  };

  // Function to create security notification
  const createSecurityNotification = (action, details = {}) => {
    let title, message, notificationType;
    
    switch(action) {
      case 'login':
        notificationType = NOTIFICATION_TYPES.LOGIN_ATTEMPT;
        title = 'New Login Detected';
        message = `Logged in from ${details.location || 'unknown location'}`;
        break;
      case 'encryption_key_generated':
        notificationType = NOTIFICATION_TYPES.ENCRYPTION_KEY_GENERATED;
        title = 'New Encryption Key Generated';
        message = `Quantum ${details.algorithm || 'AES-256'} key created`;
        break;
      case 'quantum_security_activated':
        notificationType = NOTIFICATION_TYPES.QUANTUM_SECURITY_ACTIVATED;
        title = 'Quantum Security Activated';
        message = 'Your emails are now quantum-resistant';
        break;
      default:
        notificationType = NOTIFICATION_TYPES.SECURITY_ALERT;
        title = 'Security Event';
        message = details.message || 'Security-related activity detected';
    }

    addNotification({
      type: notificationType,
      title,
      message,
      priority: 'high'
    });
  };

  // CALCULATE REAL FOLDER COUNTS
  const folderCounts = useMemo(() => {
    if (!Array.isArray(emails)) {
      return {
        inbox: 0,
        starred: 0,
        important: 0,
        snoozed: 0,
        sent: 0,
        drafts: 0,
        archive: 0,
        trash: 0,
        spam: 0
      };
    }

    const allEmails = emails || [];
    
    return {
      // Inbox: emails that are not archived, not in trash, not spam, not sent, not draft
      inbox: allEmails.filter(email => 
        email && 
        !email.archived && 
        !email.trash && 
        !email.spam && 
        !email.sent && 
        !email.draft
      ).length,
      
      // Starred: emails marked as starred in localStorage OR have starred: true
      starred: allEmails.filter(email => 
        email && (starredEmails.includes(email.uid) || email.starred)
      ).length,
      
      // Important: emails marked as important in localStorage OR have important: true
      important: allEmails.filter(email => 
        email && (importantEmails.includes(email.uid) || email.important)
      ).length,
      
      // Snoozed: emails marked as snoozed in localStorage OR have snoozed: true
      snoozed: allEmails.filter(email => 
        email && (snoozedEmails.includes(email.uid) || email.snoozed)
      ).length,
      
      // Sent: emails with sent: true flag
      sent: allEmails.filter(email => email && email.sent).length,
      
      // Drafts: emails with draft: true flag
      drafts: allEmails.filter(email => email && email.draft).length,
      
      // Archive: emails with archived: true flag
      archive: allEmails.filter(email => email && email.archived).length,
      
      // Trash: emails with trash: true flag
      trash: allEmails.filter(email => email && email.trash).length,
      
      // Spam: emails with spam: true flag
      spam: allEmails.filter(email => email && email.spam).length
    };
  }, [emails, starredEmails, importantEmails, snoozedEmails]);

  // Filter emails based on active folder AND paginate
  useEffect(() => {
    if (!Array.isArray(emails)) {
      setCurrentEmails([]);
      setTotalEmailsCount(0);
      return;
    }

    let filtered = [...emails];
    
    // Apply folder-specific filtering
    switch (activeSection) {
      case "starred":
        filtered = filtered.filter(email => 
          email && (starredEmails.includes(email.uid) || email.starred)
        );
        break;
      case "important":
        filtered = filtered.filter(email => 
          email && (importantEmails.includes(email.uid) || email.important)
        );
        break;
      case "snoozed":
        filtered = filtered.filter(email => 
          email && (snoozedEmails.includes(email.uid) || email.snoozed)
        );
        break;
      case "inbox":
        filtered = filtered.filter(email => 
          email && 
          !email.archived && 
          !email.trash && 
          !email.spam && 
          !email.sent && 
          !email.draft
        );
        break;
      case "sent":
        filtered = filtered.filter(email => email && email.sent);
        break;
      case "drafts":
        filtered = filtered.filter(email => email && email.draft);
        break;
      case "archive":
        filtered = filtered.filter(email => email && email.archived);
        break;
      case "trash":
        filtered = filtered.filter(email => email && email.trash);
        break;
      case "spam":
        filtered = filtered.filter(email => email && email.spam);
        break;
      default:
        break;
    }
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(email => 
        (email.subject || '').toLowerCase().includes(searchLower) ||
        (email.from || '').toLowerCase().includes(searchLower) ||
        (email.body || '').toLowerCase().includes(searchLower) ||
        (email.preview || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
    
    // Calculate pagination
    const total = filtered.length;
    setTotalEmailsCount(total);
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, total);
    
    // Get emails for current page
    const paginatedEmails = filtered.slice(startIndex, endIndex);
    
    setCurrentEmails(paginatedEmails);
  }, [activeSection, emails, starredEmails, importantEmails, snoozedEmails, currentPage, searchQuery]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
      showSnackbar("Inbox refreshed", "success");
      setCurrentPage(1);
      
      // Add notification for refresh
      addNotification({
        type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
        title: 'Inbox Refreshed',
        message: 'Your emails have been synced',
        priority: 'low'
      });
    }
  };

  const handleSend = async (to, subject, body, level, draftId = null) => {
    try {
      await onSendEmail(to, subject, body, level, draftId);
      showSnackbar("Email sent successfully!", "success");
      setOpenCompose(false);
      
      // Create notification for sent email
      const emailData = { to, subject, encryptionLevel: level };
      createEmailNotification(emailData, 'sent');
      
      if (level !== 'none') {
        createEmailNotification(emailData, 'encrypted');
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      showSnackbar("Failed to send email: " + error.message, "error");
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle email actions with notifications
  const handleUpdateEmail = (emailId, field, value) => {
    const email = currentEmails.find(e => e.uid === emailId);
    
    // Update local state
    switch (field) {
      case 'star':
        setStarredEmails(prev => 
          value 
            ? [...prev, emailId]
            : prev.filter(id => id !== emailId)
        );
        if (email) {
          createEmailNotification(email, 'starred');
        }
        break;
      case 'important':
        setImportantEmails(prev => 
          value 
            ? [...prev, emailId]
            : prev.filter(id => id !== emailId)
        );
        addNotification({
          type: NOTIFICATION_TYPES.EMAIL_STARRED,
          title: 'Email Marked as Important',
          message: email ? `Subject: ${email.subject || 'No Subject'}` : 'Email marked',
          priority: 'medium'
        });
        break;
      case 'snooze':
        setSnoozedEmails(prev => 
          value 
            ? [...prev, emailId]
            : prev.filter(id => id !== emailId)
        );
        break;
      default:
        break;
    }
    
    // Call parent handler if provided
    if (onUpdateEmail) {
      onUpdateEmail(emailId, field, value);
    }
  };

  const handleBulkActionWrapper = (emailIds, action, value) => {
    // Update local state for starred/important/snoozed
    if (action === 'star' || action === 'important' || action === 'snooze') {
      emailIds.forEach(emailId => {
        const email = currentEmails.find(e => e.uid === emailId);
        switch (action) {
          case 'star':
            setStarredEmails(prev => 
              value 
                ? [...prev, emailId]
                : prev.filter(id => id !== emailId)
            );
            if (email && value) {
              createEmailNotification(email, 'starred');
            }
            break;
          case 'important':
            setImportantEmails(prev => 
              value 
                ? [...prev, emailId]
                : prev.filter(id => id !== emailId)
            );
            break;
          case 'snooze':
            setSnoozedEmails(prev => 
              value 
                ? [...prev, emailId]
                : prev.filter(id => id !== emailId)
            );
            break;
        }
      });
    }
    
    // Call parent handler
    if (onBulkAction) {
      onBulkAction(emailIds, action, value);
    }
    
    // Add notification for bulk action
    addNotification({
      type: NOTIFICATION_TYPES.EMAIL_MOVED,
      title: 'Bulk Action Completed',
      message: `${emailIds.length} emails ${action}ed`,
      priority: 'medium'
    });
  };

  const handleMoveEmails = (emailIds, folder) => {
    // If moving to trash, remove from starred/important/snoozed
    if (folder === 'trash') {
      setStarredEmails(prev => prev.filter(id => !emailIds.includes(id)));
      setImportantEmails(prev => prev.filter(id => !emailIds.includes(id)));
      setSnoozedEmails(prev => prev.filter(id => !emailIds.includes(id)));
      
      // Add notification for deletion
      addNotification({
        type: NOTIFICATION_TYPES.EMAIL_DELETED,
        title: 'Emails Moved to Trash',
        message: `${emailIds.length} emails moved to trash`,
        priority: 'medium'
      });
    } else {
      // Add notification for moving emails
      addNotification({
        type: NOTIFICATION_TYPES.EMAIL_MOVED,
        title: 'Emails Moved',
        message: `${emailIds.length} emails moved to ${folder}`,
        priority: 'medium'
      });
    }
    
    // Call parent handler
    if (onMoveEmails) {
      onMoveEmails(emailIds, folder);
    }
  };

  // Safe handleFolderChange
  const handleFolderChange = (folder) => {
    setActiveSection(folder);
    setActivePage("inbox");
    setCurrentPage(1);
    setSearchQuery("");
    
    if (isMobile) {
      setMobileOpen(false);
    }
    
    if (onFolderChange && typeof onFolderChange === 'function') {
      onFolderChange(folder);
    }
  };

  // Load more emails function
  const loadMoreEmails = async () => {
    if (!onLoadMoreEmails || loadingMore) return;
    
    setLoadingMore(true);
    try {
      await onLoadMoreEmails(activeSection, currentEmails.length);
      showSnackbar("Loaded more emails", "success");
    } catch (error) {
      console.error("Failed to load more emails:", error);
      showSnackbar("Failed to load more emails", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalEmailsCount / ITEMS_PER_PAGE);

  // Calculate showing range
  const startRange = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRange = Math.min(currentPage * ITEMS_PER_PAGE, totalEmailsCount);

  // Handle notifications menu open/close
  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Handle notification action
  const handleNotificationAction = (notification) => {
    if (notification.action) {
      switch (notification.action.type) {
        case 'view_email':
          // Navigate to email view
          showSnackbar(`Opening email ${notification.action.emailId}`, 'info');
          break;
        case 'view_security':
          setActivePage("security");
          break;
        case 'view_account':
          setActivePage("account");
          break;
        default:
          break;
      }
    }
    markNotificationAsRead(notification.id);
    handleNotificationsMenuClose();
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  // Filter notifications by tab
  const getFilteredNotifications = () => {
    switch (activeNotificationTab) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(n => !n.read);
      case 2: // Important
        return notifications.filter(n => n.priority === 'high');
      default:
        return notifications;
    }
  };

  // Notification dropdown content
  const renderNotificationsMenu = () => {
    const filteredNotifications = getFilteredNotifications();
    const hasNotifications = filteredNotifications.length > 0;

    return (
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsMenuClose}
        PaperProps={{
          sx: { 
            width: 380, 
            maxHeight: 500,
            mt: 1.5,
            bgcolor: 'background.paper',
            color: 'text.primary'
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Notifications Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
              Notifications
            </Typography>
            {unreadNotifications > 0 && (
              <Chip 
                label={`${unreadNotifications} unread`} 
                size="small" 
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          {/* Notification Tabs */}
          <Tabs 
            value={activeNotificationTab} 
            onChange={(e, newValue) => setActiveNotificationTab(newValue)}
            variant="fullWidth"
            sx={{ minHeight: 36 }}
          >
            <Tab label="All" />
            <Tab label="Unread" />
            <Tab label="Important" />
          </Tabs>
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {hasNotifications ? (
            <List dense>
              {filteredNotifications.slice(0, 10).map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  button
                  onClick={() => handleNotificationAction(notification)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: `${notification.color}.main`,
                        color: `${notification.color}.contrastText`
                      }}
                    >
                      {notification.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatTimeAgo(notification.timestamp)}
                        </Typography>
                      </>
                    }
                    sx={{ ml: 1 }}
                  />
                  <ListItemSecondaryAction>
                    <MuiIconButton 
                      size="small" 
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Close fontSize="small" />
                    </MuiIconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No notifications to display
              </Typography>
            </Box>
          )}
        </Box>

        {/* Notifications Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                setShowAllNotifications(true);
                handleNotificationsMenuClose();
              }}
              disabled={!hasNotifications}
            >
              View All
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadNotifications > 0 && (
                <Button
                  size="small"
                  onClick={markAllNotificationsAsRead}
                  startIcon={<MarkAsUnread />}
                >
                  Mark All Read
                </Button>
              )}
              {hasNotifications && (
                <Button
                  size="small"
                  color="error"
                  onClick={deleteAllNotifications}
                  startIcon={<Delete />}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Menu>
    );
  };

  // All Notifications Dialog
  const renderAllNotificationsDialog = () => (
    <Dialog
      open={showAllNotifications}
      onClose={() => setShowAllNotifications(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'background.paper', color: 'text.primary' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <Typography variant="h6" fontWeight="600">
          All Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {unreadNotifications > 0 && (
            <Button
              size="small"
              onClick={markAllNotificationsAsRead}
              startIcon={<MarkAsUnread />}
            >
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              size="small"
              color="error"
              onClick={deleteAllNotifications}
              startIcon={<Delete />}
            >
              Clear All
            </Button>
          )}
          <IconButton onClick={() => setShowAllNotifications(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Tabs 
          value={activeNotificationTab} 
          onChange={(e, newValue) => setActiveNotificationTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label={`All (${notifications.length})`} />
          <Tab label={`Unread (${unreadNotifications})`} />
          <Tab label="Important" />
        </Tabs>
        
        {getFilteredNotifications().length > 0 ? (
          <List>
            {getFilteredNotifications().map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                button
                onClick={() => handleNotificationAction(notification)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: `${notification.color}.main`,
                      color: `${notification.color}.contrastText`
                    }}
                  >
                    {notification.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatTimeAgo(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {notification.message}
                    </Typography>
                  }
                  sx={{ ml: 1 }}
                />
                <ListItemSecondaryAction>
                  <MuiIconButton 
                    size="small" 
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Close fontSize="small" />
                  </MuiIconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }} gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              You're all caught up!
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Total notifications: {notifications.length}
        </Typography>
        <Button onClick={() => setShowAllNotifications(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const drawer = (
    <Sidebar
      onCompose={() => setOpenCompose(true)}
      activeSection={activeSection}
      setActiveSection={handleFolderChange}
      emailStats={folderCounts}
      userEmail={userEmail}
      userAvatar={userEmail?.charAt(0).toUpperCase() || 'U'}
      onLogout={onLogout}
      activePage={activePage}
      onPageChange={setActivePage}
    />
  );

  // Render pagination controls
  const renderPagination = () => {
    if (totalEmailsCount <= ITEMS_PER_PAGE) return null;
    
    return (
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Showing {startRange}-{endRange} of {totalEmailsCount}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            size="small"
            startIcon={<ChevronLeft />}
            disabled={currentPage === 1 || loadingMore}
            onClick={() => handlePageChange(null, currentPage - 1)}
          >
            Previous
          </Button>
          
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            size="small"
            siblingCount={1}
            boundaryCount={1}
            disabled={loadingMore}
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'text.primary'
              },
              '& .MuiPaginationItem-root.Mui-selected': {
                color: 'primary.contrastText'
              }
            }}
          />
          
          <Button
            size="small"
            endIcon={<ChevronRight />}
            disabled={currentPage === totalPages || loadingMore}
            onClick={() => handlePageChange(null, currentPage + 1)}
          >
            Next
          </Button>
          
          {loadingMore && <CircularProgress size={20} />}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Emails per page:
          </Typography>
          <Chip 
            label={ITEMS_PER_PAGE} 
            size="small" 
            variant="outlined"
            sx={{ color: 'text.primary', borderColor: 'divider' }}
          />
        </Box>
      </Box>
    );
  };

  // Handle opening settings pages
  const handleOpenAccountSettings = () => {
    handleMenuClose();
    setActivePage("account");
    if (isMobile) setMobileOpen(false);
  };

  const handleOpenSecuritySettings = () => {
    handleMenuClose();
    setActivePage("security");
    if (isMobile) setMobileOpen(false);
    
    // Add security notification
    createSecurityNotification('quantum_security_activated');
  };

  const handleOpenAppSettings = () => {
    handleMenuClose();
    setActivePage("app");
    if (isMobile) setMobileOpen(false);
  };

  // Render the current page
  const renderCurrentPage = () => {
    switch (activePage) {
      case "account":
        return (
          <AccountSettings
            userEmail={userEmail}
            onUpdateProfile={(updatedData) => {
              showSnackbar("Profile updated successfully", "success");
              addNotification({
                type: NOTIFICATION_TYPES.ACCOUNT_ACTIVITY,
                title: 'Profile Updated',
                message: 'Your account information has been updated',
                priority: 'medium'
              });
            }}
            onBack={() => setActivePage("inbox")}
          />
        );
      case "security":
        return (
          <SecuritySettings
            user={{ email: userEmail, settings: {} }}
            onUpdateSecurity={(settings) => {
              showSnackbar("Security settings saved", "success");
              addNotification({
                type: NOTIFICATION_TYPES.SECURITY_ALERT,
                title: 'Security Settings Updated',
                message: 'Your security preferences have been saved',
                priority: 'medium'
              });
            }}
            encryptionStatus={{
              hasOTPKey: false,
              hasAESKey: false
            }}
            onBack={() => setActivePage("inbox")}
          />
        );
      case "app":
        return (
          <AppSettings
            darkMode={darkMode}
            onToggleTheme={() => {
              onToggleTheme();
              addNotification({
                type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
                title: 'Theme Changed',
                message: `Switched to ${darkMode ? 'light' : 'dark'} mode`,
                priority: 'low'
              });
            }}
            userEmail={userEmail}
            onBack={() => setActivePage("inbox")}
          />
        );
      case "inbox":
      default:
        return (
          <>
            {/* Search Bar - Mobile */}
            {isMobile && (
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}>
                <StyledInputBase
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={handleSearch}
                  fullWidth
                />
              </Box>
            )}

            {/* Stats Bar */}
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Showing
                  </Typography>
                  <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
                    {currentEmails.length} of {folderCounts[activeSection] || 0}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Unread
                  </Typography>
                  <Typography variant="h6" fontWeight="600" sx={{ color: 'primary.main' }}>
                    {currentEmails.filter(email => email && !email.read).length}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Page
                  </Typography>
                  <Typography variant="h6" fontWeight="600" sx={{ color: 'success.main' }}>
                    {currentPage} / {totalPages || 1}
                  </Typography>
                </Box>
              </Box>

              {/* Quick Actions */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ 
                    color: 'primary.main',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setOpenCompose(true)}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  Compose
                </Button>
              </Box>
            </Box>

            {/* Inbox Component */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Inbox
                emails={currentEmails}
                activeFolder={activeSection}
                onFolderChange={handleFolderChange}
                userEmail={userEmail}
                userPassword={userPassword}
                onCompose={() => setOpenCompose(true)}
                onRefresh={handleRefresh}
                onUpdateEmail={handleUpdateEmail}
                onBulkAction={handleBulkActionWrapper}
                onMoveEmails={handleMoveEmails}
                loading={loading}
                onGetEmailBody={onGetEmailBody}
                onDecryptEmail={onDecryptEmail}
                determineSecurityLevel={determineSecurityLevel}
                generatePreview={generatePreview}
                formatDate={formatDate}
                onSaveDraft={onSaveDraft}
                onDeleteDraft={onDeleteDraft}
              />
            </Box>

            {/* Pagination Controls */}
            {renderPagination()}
          </>
        );
    }
  };

  // Render page header for settings pages
  const renderPageHeader = () => {
    if (activePage === "inbox") return null;
    
    const pageTitles = {
      "account": "Account Settings",
      "security": "Security Settings", 
      "app": "App Settings"
    };
    
    const pageIcons = {
      "account": <Person />,
      "security": <Security />,
      "app": <Settings />
    };
    
    return (
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={() => setActivePage("inbox")}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {pageIcons[activePage]}
          <Typography variant="h6" fontWeight="600">
            {pageTitles[activePage]}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and App Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                animation: 'pulse 2s infinite'
              }}
            >
              <Security sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" noWrap component="div" fontWeight="600">
              QuMail
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary', 
              display: { xs: 'none', sm: 'block' } 
            }}>
              Quantum Secure Email
            </Typography>
          </Box>

          {/* Search Bar - Desktop (only show in inbox view) */}
          {!isMobile && activePage === "inbox" && (
            <SearchBar>
              <SearchIconWrapper>
                <Search sx={{ color: 'text.secondary' }} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search emails..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </SearchBar>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Right Side Actions (only show in inbox view) */}
          {activePage === "inbox" && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Security Status */}
              <Tooltip title="Security Status">
                <Box sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  alignItems: 'center', 
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(25, 118, 210, 0.2)' 
                    : 'rgba(25, 118, 210, 0.08)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.3)'
                    : 'rgba(25, 118, 210, 0.2)'
                }}>
                  <FiberManualRecord sx={{ fontSize: 12, color: 'success.main' }} />
                  <Typography variant="caption" fontWeight="500" sx={{ color: 'primary.main' }}>
                    {currentEmails.filter(email => {
                      if (!email || !email.body) return false;
                      return determineSecurityLevel(email.body) !== "none";
                    }).length}/{currentEmails.length} encrypted
                  </Typography>
                </Box>
              </Tooltip>

              {/* Refresh Button */}
              <Tooltip title="Refresh">
                <IconButton 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip title="Toggle theme">
                <IconButton size="small" onClick={onToggleTheme}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>

              {/* Notifications Button */}
              <Tooltip title="Notifications">
                <IconButton 
                  size="small" 
                  onClick={handleNotificationsMenuOpen}
                >
                  <Badge 
                    badgeContent={unreadNotifications} 
                    color="error"
                    max={99}
                  >
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Search - Mobile */}
              {isMobile && (
                <Tooltip title="Search">
                  <IconButton size="small">
                    <Search />
                  </IconButton>
                </Tooltip>
              )}

              {/* User Menu */}
              <Tooltip title="Account">
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Avatar sx={{ 
                        width: 12, 
                        height: 12, 
                        bgcolor: 'success.main', 
                        border: `2px solid ${theme.palette.background.paper}` 
                      }} />
                    }
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                      {userEmail?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { 
                width: 280, 
                mt: 1.5,
                bgcolor: 'background.paper',
                color: 'text.primary'
              }
            }}
          >
            {/* User Info */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                {userEmail?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="600">
                  {userEmail?.split('@')[0] || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {userEmail || 'No email'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <FiberManualRecord sx={{ fontSize: 8, color: 'success.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Account Active
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Divider />

            {/* Menu Items */}
            <MenuItem onClick={handleOpenAccountSettings}>
              <Person sx={{ mr: 2, fontSize: 20 }} />
              <Box>
                <Typography variant="body2">My Account</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Manage your profile
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleOpenSecuritySettings}>
              <Security sx={{ mr: 2, fontSize: 20 }} />
              <Box>
                <Typography variant="body2">Security Settings</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Encryption preferences
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleOpenAppSettings}>
              <Settings sx={{ mr: 2, fontSize: 20 }} />
              <Box>
                <Typography variant="body2">App Settings</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Customize QuMail
                </Typography>
              </Box>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={() => { handleMenuClose(); onLogout(); }}>
              <ExitToApp sx={{ mr: 2, fontSize: 20 }} />
              <Box>
                <Typography variant="body2">Sign Out</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {userEmail || ''}
                </Typography>
              </Box>
            </MenuItem>
          </Menu>

          {/* Notifications Menu */}
          {renderNotificationsMenu()}
        </Toolbar>

        {/* Loading Bar */}
        {loading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0,
              height: 2
            }} 
          />
        )}
      </AppBar>

      {/* Sidebar Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 280,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column'
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          mt: '64px', 
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}
      >
        {/* Page Header for settings pages */}
        {renderPageHeader()}

        {/* Dynamic Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {renderCurrentPage()}
        </Box>
      </Box>

      {/* Compose Modal */}
      <Compose
        open={openCompose}
        onClose={() => setOpenCompose(false)}
        onSend={handleSend}
        onSaveDraft={onSaveDraft}
        userEmail={userEmail}
        darkMode={darkMode}
      />

      {/* All Notifications Dialog */}
      {renderAllNotificationsDialog()}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Demo function to add sample notifications (call this when needed)
export const addDemoNotifications = (addNotification) => {
  const demoNotifications = [
    {
      type: NOTIFICATION_TYPES.NEW_EMAIL,
      title: 'New Secure Email',
      message: 'From: security@qumail.com',
      priority: 'high'
    },
    {
      type: NOTIFICATION_TYPES.ENCRYPTION_SUCCESS,
      title: 'Encryption Activated',
      message: 'Quantum OTP encryption enabled',
      priority: 'high'
    },
    {
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      title: 'Security Scan Complete',
      message: 'No threats detected in your account',
      priority: 'medium'
    },
    {
      type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
      title: 'System Update',
      message: 'QuMail v2.0 is now available',
      priority: 'medium'
    },
    {
      type: NOTIFICATION_TYPES.LOGIN_ATTEMPT,
      title: 'New Login Detected',
      message: 'From: New York, USA',
      priority: 'high'
    }
  ];

  demoNotifications.forEach(notification => addNotification(notification));
};

// Add styles
const styles = `
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
};
