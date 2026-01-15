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
import EmailViewer from '../components/EmailViewer';
import EmailRow from '../components/EmailRow';
import DecryptModal from '../components/DecryptModal';
import HelpSupport from "../components/HelpSupport";
import AboutQuMail from "../components/AboutQuMail";
import EmailService from '../services/EmailService';

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
  [NOTIFICATION_TYPES.NEW_EMAIL]: 'Mail',
  [NOTIFICATION_TYPES.ENCRYPTION_SUCCESS]: 'Lock',
  [NOTIFICATION_TYPES.SECURITY_ALERT]: 'Warning',
  [NOTIFICATION_TYPES.SYSTEM_UPDATE]: 'Public',
  [NOTIFICATION_TYPES.ACCOUNT_ACTIVITY]: 'Person',
  [NOTIFICATION_TYPES.EMAIL_READ]: 'MarkEmailRead',
  [NOTIFICATION_TYPES.EMAIL_STARRED]: 'CheckCircle',
  [NOTIFICATION_TYPES.EMAIL_MOVED]: 'Schedule',
  [NOTIFICATION_TYPES.EMAIL_DELETED]: 'Delete',
  [NOTIFICATION_TYPES.DRAFT_SAVED]: 'Mail',
  [NOTIFICATION_TYPES.LOGIN_ATTEMPT]: 'Security',
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: 'Lock',
  [NOTIFICATION_TYPES.ENCRYPTION_KEY_GENERATED]: 'Lock',
  [NOTIFICATION_TYPES.QUANTUM_SECURITY_ACTIVATED]: 'Security'
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

// Helper function to get icon component
const getIconComponent = (iconName) => {
  const iconMap = {
    'Mail': Mail,
    'Lock': Lock,
    'Warning': Warning,
    'Public': Public,
    'Person': Person,
    'MarkEmailRead': MarkEmailRead,
    'CheckCircle': CheckCircle,
    'Schedule': Schedule,
    'Delete': Delete,
    'Security': Security,
    'Info': Info,
    'Error': Error
  };
  
  const IconComponent = iconMap[iconName] || Info;
  return <IconComponent />;
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
  loading,
  emailStats = {},
  onToggleTheme,
  darkMode,
  determineSecurityLevel = () => "none",
  generatePreview = (body) => {
    try {
      if (!body) return "";
      return typeof body === 'string' ? body.substring(0, 100) : "";
    } catch {
      return "";
    }
  },
  formatDate = (date) => {
    try {
      if (!date) return "Unknown";
      if (typeof date === 'string' || date instanceof Date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "Unknown";
        return d.toLocaleDateString();
      }
      return "Unknown";
    } catch {
      return "Unknown";
    }
  }
}) {
  const theme = useTheme();
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
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [decryptModalOpen, setDecryptModalOpen] = useState(false);
  const [emailToDecrypt, setEmailToDecrypt] = useState(null);
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState(0);
  
  // Main content state - tracks what to display in main area
  const [mainContent, setMainContent] = useState({
    type: "inbox",
    data: null
  });
  
  const ITEMS_PER_PAGE = 50;

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Initialize with demo notifications
  useEffect(() => {
    try {
      const savedNotifications = JSON.parse(localStorage.getItem('qumail_notifications') || '[]');
      const savedStarred = JSON.parse(localStorage.getItem('qumail_starred') || '[]');
      const savedImportant = JSON.parse(localStorage.getItem('qumail_important') || '[]');
      const savedSnoozed = JSON.parse(localStorage.getItem('qumail_snoozed') || '[]');
      
      if (savedNotifications.length === 0) {
        const demoNotifications = [
          {
            id: Date.now(),
            type: NOTIFICATION_TYPES.NEW_EMAIL,
            title: 'Welcome to QuMail!',
            message: 'Your secure email journey begins',
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'high',
            icon: 'Mail',
            color: 'primary'
          },
          {
            id: Date.now() + 1,
            type: NOTIFICATION_TYPES.SECURITY_ALERT,
            title: 'Security Activated',
            message: 'Quantum encryption is enabled',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: true,
            priority: 'high',
            icon: 'Security',
            color: 'success'
          }
        ];
        setNotifications(demoNotifications);
        localStorage.setItem('qumail_notifications', JSON.stringify(demoNotifications));
      } else {
        setNotifications(savedNotifications);
      }
      
      setStarredEmails(savedStarred);
      setImportantEmails(savedImportant);
      setSnoozedEmails(savedSnoozed);
      
      updateUnreadCount(savedNotifications.length > 0 ? savedNotifications : []);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setNotifications([]);
      setStarredEmails([]);
      setImportantEmails([]);
      setSnoozedEmails([]);
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qumail_notifications', JSON.stringify(notifications));
      localStorage.setItem('qumail_starred', JSON.stringify(starredEmails));
      localStorage.setItem('qumail_important', JSON.stringify(importantEmails));
      localStorage.setItem('qumail_snoozed', JSON.stringify(snoozedEmails));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [notifications, starredEmails, importantEmails, snoozedEmails]);

  // Update unread notifications count
  const updateUnreadCount = (notificationList = notifications) => {
    try {
      const unreadCount = notificationList.filter(n => n && !n.read).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      setUnreadNotifications(0);
    }
  };

  // Function to add a new notification
  const addNotification = (notification) => {
    try {
      const iconName = notification.icon || NOTIFICATION_ICONS[notification.type] || 'Info';
      
      const newNotification = {
        id: Date.now(),
        type: notification.type || NOTIFICATION_TYPES.SYSTEM_UPDATE,
        title: notification.title || 'Notification',
        message: notification.message || '',
        timestamp: new Date().toISOString(),
        read: false,
        action: notification.action || null,
        priority: notification.priority || 'medium',
        icon: iconName,
        color: notification.color || NOTIFICATION_COLORS[notification.type] || 'info'
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 100));
      updateUnreadCount([newNotification, ...notifications]);
      
      if (notification.priority === 'high') {
        showSnackbar(`${notification.title}: ${notification.message}`, 'info');
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Function to mark notification as read
  const markNotificationAsRead = (notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification && notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      updateUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to mark all notifications as read
  const markAllNotificationsAsRead = () => {
    try {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Function to delete notification
  const deleteNotification = (notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n && n.id !== notificationId));
      updateUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Function to delete all notifications
  const deleteAllNotifications = () => {
    try {
      setNotifications([]);
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
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
      inbox: allEmails.filter(email => 
        email && 
        !email.archived && 
        !email.trash && 
        !email.spam && 
        !email.sent && 
        !email.draft
      ).length,
      
      starred: allEmails.filter(email => 
        email && (starredEmails.includes(email.uid) || starredEmails.includes(email.id) || email.starred)
      ).length,
      
      important: allEmails.filter(email => 
        email && (importantEmails.includes(email.uid) || importantEmails.includes(email.id) || email.important)
      ).length,
      
      snoozed: allEmails.filter(email => 
        email && (snoozedEmails.includes(email.uid) || snoozedEmails.includes(email.id) || email.snoozed)
      ).length,
      
      sent: allEmails.filter(email => email && email.sent).length,
      
      drafts: allEmails.filter(email => email && email.draft).length,
      
      archive: allEmails.filter(email => email && email.archived).length,
      
      trash: allEmails.filter(email => email && email.trash).length,
      
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
    
    switch (activeSection) {
      case "starred":
        filtered = filtered.filter(email => 
          email && (starredEmails.includes(email.uid) || starredEmails.includes(email.id) || email.starred)
        );
        break;
      case "important":
        filtered = filtered.filter(email => 
          email && (importantEmails.includes(email.uid) || importantEmails.includes(email.id) || email.important)
        );
        break;
      case "snoozed":
        filtered = filtered.filter(email => 
          email && (snoozedEmails.includes(email.uid) || snoozedEmails.includes(email.id) || email.snoozed)
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
    
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(email => {
        if (!email) return false;
        return (
          (email.subject || '').toLowerCase().includes(searchLower) ||
          (email.from || '').toLowerCase().includes(searchLower) ||
          (email.body || '').toString().toLowerCase().includes(searchLower) ||
          (email.preview || '').toString().toLowerCase().includes(searchLower)
        );
      });
    }
    
    filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.date || a.timestamp || 0);
        const dateB = new Date(b.date || b.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
    
    const total = filtered.length;
    setTotalEmailsCount(total);
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, total);
    
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
    try {
      showSnackbar("Refreshing emails...", "info");
      
      if (onRefresh) {
        await onRefresh();
      } else {
        // Direct refresh logic
        const result = await EmailService.getFolderCounts();
        if (result.success) {
          setCurrentPage(1);
        }
      }
      
      showSnackbar("Inbox refreshed", "success");
      setCurrentPage(1);
      
      addNotification({
        type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
        title: 'Inbox Refreshed',
        message: 'Your emails have been synced',
        priority: 'low'
      });
    } catch (error) {
      console.error('Error refreshing inbox:', error);
      showSnackbar(`Failed to refresh inbox: ${error.message}`, "error");
    }
  };

  const handleSend = async (to, subject, body, level, draftId = null) => {
    try {
      // Use EmailService to send email
      const result = await EmailService.sendEmail(to, subject, body, level);
      
      if (result.success) {
        showSnackbar("Email sent successfully!", "success");
        setOpenCompose(false);
        
        addNotification({
          type: NOTIFICATION_TYPES.ENCRYPTION_SUCCESS,
          title: 'Email Sent',
          message: `Encrypted with ${level} encryption`,
          priority: 'medium'
        });
        
        // Refresh emails after sending
        await handleRefresh();
      } else {
        showSnackbar(`Failed to send email: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      showSnackbar(`Failed to send email: ${error.message}`, "error");
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle opening different content types
  const handleOpenInbox = () => {
    setMainContent({ type: "inbox", data: null });
    if (isMobile) setMobileOpen(false);
  };

  const handleOpenSettings = () => {
    handleMenuClose();
    setMainContent({ type: "settings", data: null });
    if (isMobile) setMobileOpen(false);
  };

  const handleOpenAccountSettings = () => {
    handleMenuClose();
    setMainContent({ type: "account", data: null });
    if (isMobile) setMobileOpen(false);
  };

  const handleOpenSecuritySettings = () => {
    handleMenuClose();
    setMainContent({ type: "security", data: null });
    if (isMobile) setMobileOpen(false);
    
    addNotification({
      type: NOTIFICATION_TYPES.QUANTUM_SECURITY_ACTIVATED,
      title: 'Security Settings',
      message: 'Opening security configuration',
      priority: 'medium'
    });
  };

  const handleOpenHelp = () => {
    handleMenuClose();
    setMainContent({ type: "help", data: null });
    if (isMobile) setMobileOpen(false);
  };

  const handleOpenAbout = () => {
    handleMenuClose();
    setMainContent({ type: "about", data: null });
    if (isMobile) setMobileOpen(false);
  };

  const handleOpenNotificationsPage = () => {
    handleMenuClose();
    setMainContent({ type: "notifications", data: null });
    if (isMobile) setMobileOpen(false);
  };

  // ✅ FIXED: Handle email actions with EmailService
  const handleUpdateEmail = async (emailId, field, value) => {
    try {
      // Find the email to get the uid
      const email = currentEmails.find(e => e && (e.uid === emailId || e.id === emailId));
      
      if (!email) {
        console.error(`❌ Email not found for ID: ${emailId}`);
        showSnackbar('Email not found', 'error');
        return;
      }

      // ✅ ALWAYS USE email.uid for backend calls, fallback to email.id
      const backendId = email.uid || email.id;
      
      if (!backendId) {
        console.error('❌ No valid backend ID found:', email);
        showSnackbar('Invalid email ID', 'error');
        return;
      }

      console.log(`🔄 Updating email ${backendId}: ${field} = ${value}`);
      
      // Update local state immediately for responsiveness
      switch (field) {
        case 'star':
          setStarredEmails(prev => 
            value 
              ? [...prev, backendId]
              : prev.filter(id => id !== backendId)
          );
          if (email && value) {
            addNotification({
              type: NOTIFICATION_TYPES.EMAIL_STARRED,
              title: 'Email Starred',
              message: `Subject: ${email.subject || 'No Subject'}`,
              priority: 'low'
            });
          }
          break;
        case 'important':
          setImportantEmails(prev => 
            value 
              ? [...prev, backendId]
              : prev.filter(id => id !== backendId)
          );
          break;
        case 'snooze':
          setSnoozedEmails(prev => 
            value 
              ? [...prev, backendId]
              : prev.filter(id => id !== backendId)
          );
          break;
        case 'read':
          setCurrentEmails(prev => 
            prev.map(email => 
              (email.uid === backendId || email.id === backendId) ? { ...email, read: value } : email
            )
          );
          break;
        default:
          break;
      }

      // Make API call to update on server
      try {
        const action = field === 'star' ? 'toggle-star' : 
                      field === 'important' ? 'toggle-important' :
                      field === 'snooze' ? 'snooze' :
                      field === 'read' ? 'mark-read' : field;
        
        const result = await EmailService.updateEmailStatus(backendId, action);
        
        if (result.success) {
          console.log(`✅ Email ${backendId} ${field} updated successfully`);
          showSnackbar(`Email ${field === 'star' ? 'starred' : field} updated`, "success");
          
          // Refresh emails to get updated data from server
          await handleRefresh();
        } else {
          console.error(`❌ Failed to update email ${backendId}:`, result.message);
          showSnackbar(`Failed to update email: ${result.message}`, "error");
        }
      } catch (apiError) {
        console.error(`❌ API error updating email ${backendId}:`, apiError.message);
        showSnackbar(`Failed to update email: ${apiError.message}`, "error");
      }

    } catch (error) {
      console.error('Error updating email:', error);
      showSnackbar(`Failed to update email: ${error.message}`, "error");
    }
  };

  // ✅ FIXED: Bulk actions with EmailService
  const handleBulkActionWrapper = async (emailIds, action, value) => {
    try {
      // Map all IDs to their backend IDs (uid)
      const backendIds = emailIds.map(emailId => {
        const email = currentEmails.find(e => e && (e.uid === emailId || e.id === emailId));
        return email?.uid || email?.id || emailId;
      }).filter(id => id);

      console.log(`🔄 Bulk action: ${action} on ${backendIds.length} emails`);
      
      // First update UI state immediately
      emailIds.forEach(emailId => {
        const backendId = emailId; // Use the ID as passed (could be uid or id)
        switch (action) {
          case 'star':
            setStarredEmails(prev => 
              value 
                ? [...prev, backendId]
                : prev.filter(id => id !== backendId)
            );
            break;
          case 'important':
            setImportantEmails(prev => 
              value 
                ? [...prev, backendId]
                : prev.filter(id => id !== backendId)
            );
            break;
          case 'snooze':
            setSnoozedEmails(prev => 
              value 
                ? [...prev, backendId]
                : prev.filter(id => id !== backendId)
            );
            break;
          case 'read':
            setCurrentEmails(prev => 
              prev.map(email => 
                (emailIds.includes(email.uid) || emailIds.includes(email.id)) ? { ...email, read: value } : email
              )
            );
            break;
        }
      });

      // Make API call
      try {
        let result;
        
        if (action === 'delete' || action === 'archive' || action === 'move') {
          const targetFolder = action === 'delete' ? 'trash' : 
                             action === 'archive' ? 'archive' : value;
          
          result = await EmailService.moveEmailsToFolder(backendIds, targetFolder);
          
          if (result.success && action === 'delete') {
            setStarredEmails(prev => prev.filter(id => !backendIds.includes(id)));
            setImportantEmails(prev => prev.filter(id => !backendIds.includes(id)));
            setSnoozedEmails(prev => prev.filter(id => !backendIds.includes(id)));
          }
        } else {
          result = await EmailService.batchUpdateEmails(backendIds, action);
        }

        if (result.success) {
          console.log(`✅ Bulk action successful`);
          showSnackbar(`${backendIds.length} emails updated`, "success");
          
          // Refresh emails
          await handleRefresh();
          
          addNotification({
            type: NOTIFICATION_TYPES.EMAIL_MOVED,
            title: 'Bulk Action Completed',
            message: `${backendIds.length} emails ${action}ed`,
            priority: 'medium'
          });
        } else {
          console.error('❌ Bulk action failed:', result.message);
          showSnackbar(`Failed to update emails: ${result.message}`, "error");
        }
      } catch (apiError) {
        console.error('❌ API error in bulk action:', apiError.message);
        showSnackbar(`Failed to update emails: ${apiError.message}`, "error");
      }

    } catch (error) {
      console.error('Error in bulk action:', error);
      showSnackbar(`Failed to update emails: ${error.message}`, "error");
    }
  };

  // Handle decrypt modal submit with EmailService
  const handleDecryptModalSubmit = async (emailId, key) => {
    try {
      console.log(`🔓 Decrypting email: ${emailId}`);
      
      const result = await EmailService.decryptEmail(emailId, key);
      
      if (result.success) {
        setDecryptModalOpen(false);
        setEmailToDecrypt(null);
        showSnackbar('Email decrypted successfully', 'success');
        
        // Update the email in state with decrypted content
        setCurrentEmails(prev => 
          prev.map(email => 
            (email.uid === emailId || email.id === emailId)
              ? { ...email, body: result.decryptedContent || email.body, isDecrypted: true }
              : email
          )
        );
        
        if (selectedEmail && (selectedEmail.uid === emailId || selectedEmail.id === emailId)) {
          setSelectedEmail(prev => 
            ({ ...prev, body: result.decryptedContent || prev.body, isDecrypted: true })
          );
        }
        
        return result;
      } else {
        showSnackbar(`Decryption failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error in decrypt modal:', error);
      showSnackbar(`Decryption failed: ${error.message}`, 'error');
    }
  };

  // ✅ FIXED: Handle delete email with EmailService
  const handleDeleteEmail = async (emailId) => {
    try {
      // Find the email to get the uid
      const email = currentEmails.find(e => e && (e.uid === emailId || e.id === emailId));
      
      if (!email) {
        console.error(`❌ Email not found for ID: ${emailId}`);
        showSnackbar('Email not found', 'error');
        return;
      }

      // ✅ ALWAYS USE email.uid for backend calls
      const backendId = email.uid || email.id;
      
      console.log(`🗑️ Deleting email: ${backendId}`);
      
      // Update local state immediately
      setCurrentEmails(prev => prev.filter(email => (email.uid !== backendId && email.id !== backendId)));
      setStarredEmails(prev => prev.filter(id => id !== backendId));
      setImportantEmails(prev => prev.filter(id => id !== backendId));
      setSnoozedEmails(prev => prev.filter(id => id !== backendId));
      
      if (selectedEmail && (selectedEmail.uid === backendId || selectedEmail.id === backendId)) {
        setSelectedEmail(null);
      }

      // Make API call
      try {
        const result = await EmailService.moveEmailsToFolder([backendId], 'trash');
        
        if (result.success) {
          showSnackbar('Email moved to trash', 'success');
          
          addNotification({
            type: NOTIFICATION_TYPES.EMAIL_DELETED,
            title: 'Email Deleted',
            message: 'Email has been moved to trash',
            priority: 'medium'
          });
          
          // Refresh emails
          await handleRefresh();
        } else {
          console.error('Delete failed:', result.message);
          showSnackbar('Failed to delete email', 'error');
        }
      } catch (apiError) {
        console.error('API error deleting email:', apiError.message);
        showSnackbar('Failed to delete email', 'error');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      showSnackbar('Failed to delete email', 'error');
    }
  };

  // ✅ FIXED: Handle move emails with EmailService
  const handleMoveEmails = async (emailIds, folder) => {
    try {
      // Map all IDs to their backend IDs (uid)
      const backendIds = emailIds.map(emailId => {
        const email = currentEmails.find(e => e && (e.uid === emailId || e.id === emailId));
        return email?.uid || email?.id || emailId;
      }).filter(id => id);

      console.log(`📂 Moving ${backendIds.length} emails to ${folder}`);
      
      // Update local state
      if (folder === 'trash') {
        setStarredEmails(prev => prev.filter(id => !backendIds.includes(id)));
        setImportantEmails(prev => prev.filter(id => !backendIds.includes(id)));
        setSnoozedEmails(prev => prev.filter(id => !backendIds.includes(id)));
      }

      // Make API call
      try {
        const result = await EmailService.moveEmailsToFolder(backendIds, folder);
        
        if (result.success) {
          showSnackbar(`${backendIds.length} emails moved to ${folder}`, "success");
          
          // Refresh emails
          await handleRefresh();
          
          addNotification({
            type: NOTIFICATION_TYPES.EMAIL_MOVED,
            title: 'Emails Moved',
            message: `${backendIds.length} emails moved to ${folder}`,
            priority: 'medium'
          });
        } else {
          console.error('Move failed:', result.message);
          showSnackbar(`Failed to move emails: ${result.message}`, "error");
        }
      } catch (apiError) {
        console.error('API error moving emails:', apiError.message);
        showSnackbar(`Failed to move emails: ${apiError.message}`, "error");
      }
    } catch (error) {
      console.error('Error moving emails:', error);
      showSnackbar(`Failed to move emails: ${error.message}`, "error");
    }
  };

  // UPDATED: Open decrypt modal
  const handleOpenDecryptModal = (email) => {
    setEmailToDecrypt(email);
    setDecryptModalOpen(true);
  };

  // Handle get email body with EmailService
  const handleGetEmailBody = async (emailId) => {
    try {
      const result = await EmailService.getEmailById(emailId);
      if (result.success) {
        return result.email.body || '';
      }
      return '';
    } catch (error) {
      console.error('Error getting email body:', error);
      return '';
    }
  };

  // Safe handleFolderChange
  const handleFolderChange = (folder) => {
    try {
      setActiveSection(folder);
      setMainContent({ type: "inbox", data: null });
      setCurrentPage(1);
      setSearchQuery("");
      setSelectedEmail(null);
      
      if (isMobile) {
        setMobileOpen(false);
      }
      
      if (onFolderChange && typeof onFolderChange === 'function') {
        onFolderChange(folder);
      }
    } catch (error) {
      console.error('Error changing folder:', error);
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
    try {
      if (notification && notification.action) {
        switch (notification.action.type) {
          case 'view_email':
            const email = currentEmails.find(e => e.uid === notification.action.emailId);
            if (email) {
              setSelectedEmail(email);
              setMainContent({ type: "inbox", data: null });
            }
            break;
          case 'view_security':
            handleOpenSecuritySettings();
            break;
          case 'view_account':
            handleOpenAccountSettings();
            break;
          default:
            break;
        }
      }
      markNotificationAsRead(notification.id);
      handleNotificationsMenuClose();
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    try {
      if (!timestamp) return 'Just now';
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
    } catch {
      return 'Just now';
    }
  };

  // Filter notifications by tab
  const getFilteredNotifications = () => {
    try {
      switch (activeNotificationTab) {
        case 0: // All
          return notifications.filter(n => n);
        case 1: // Unread
          return notifications.filter(n => n && !n.read);
        case 2: // Important
          return notifications.filter(n => n && n.priority === 'high');
        default:
          return notifications.filter(n => n);
      }
    } catch {
      return [];
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

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {hasNotifications ? (
            <List dense>
              {filteredNotifications.slice(0, 10).map((notification) => (
                notification && (
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
                        {getIconComponent(notification.icon)}
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
                )
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
              notification && (
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
                      {getIconComponent(notification.icon)}
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
              )
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
      darkMode={darkMode}
      onToggleTheme={onToggleTheme}
      onOpenSettings={handleOpenSettings}
      onOpenProfile={handleOpenAccountSettings}
      onOpenNotifications={handleOpenNotificationsPage}
      onOpenSecurity={handleOpenSecuritySettings}
      onOpenHelp={handleOpenHelp}
      onOpenAbout={handleOpenAbout}
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
            sx={{ color: 'text.primary' }}
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
            sx={{ color: 'text.primary' }}
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
            sx={{ color: 'text.primary', borderColor: theme.palette.divider }}
          />
        </Box>
      </Box>
    );
  };

  // Render inbox content
  const renderInboxContent = () => {
    return selectedEmail ? (
      <EmailViewer
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onStarToggle={(emailId, starred) => handleUpdateEmail(emailId, 'star', starred)}
        onImportantToggle={(emailId, important) => handleUpdateEmail(emailId, 'important', important)}
        onDelete={handleDeleteEmail}
        onReply={(email) => {
          setOpenCompose(true);
          showSnackbar('Reply functionality coming soon', 'info');
        }}
        onForward={(email) => {
          setOpenCompose(true);
          showSnackbar('Forward functionality coming soon', 'info');
        }}
        onDecryptEmail={handleOpenDecryptModal}
        isLoading={loading}
      />
    ) : (
      <>
        {/* Search Bar - Mobile */}
        {isMobile && (
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid',
            borderColor: theme.palette.divider,
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
          borderColor: theme.palette.divider,
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
              <Typography variant="h6" fontWeight="600" sx={{ color: theme.palette.primary.main }}>
                {currentEmails.filter(email => email && !email.read).length}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Page
              </Typography>
              <Typography variant="h6" fontWeight="600" sx={{ color: theme.palette.success.main }}>
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
                borderColor: theme.palette.divider,
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
            onCompose={() => setOpenCompose(true)}
            onRefresh={handleRefresh}
            onUpdateEmail={handleUpdateEmail}
            onBulkAction={handleBulkActionWrapper}
            onMoveEmails={handleMoveEmails}
            loading={loading}
            onGetEmailBody={handleGetEmailBody}
            onDecryptEmail={handleOpenDecryptModal}
            determineSecurityLevel={determineSecurityLevel}
            generatePreview={generatePreview}
            formatDate={formatDate}
            onSaveDraft={onSaveDraft}
            onDeleteDraft={onDeleteDraft}
            onSelectEmail={setSelectedEmail}
            emailRowComponent={EmailRow}
          />
        </Box>

        {/* Pagination Controls */}
        {renderPagination()}
      </>
    );
  };

  // Render the current page based on mainContent type
  const renderMainContent = () => {
    switch (mainContent.type) {
      case "inbox":
        return renderInboxContent();
        
      case "account":
        return (
          <AccountSettings
            userEmail={userEmail}
            onUpdateProfile={async (updatedData) => {
              try {
                const result = await EmailService.updateProfile(updatedData.name, updatedData.settings);
                if (result.success) {
                  showSnackbar("Profile updated successfully", "success");
                  addNotification({
                    type: NOTIFICATION_TYPES.ACCOUNT_ACTIVITY,
                    title: 'Profile Updated',
                    message: 'Your account information has been updated',
                    priority: 'medium'
                  });
                } else {
                  showSnackbar(`Failed to update profile: ${result.message}`, "error");
                }
              } catch (error) {
                showSnackbar(`Failed to update profile: ${error.message}`, "error");
              }
            }}
            onBack={handleOpenInbox}
          />
        );
        
      case "security":
        return (
          <SecuritySettings
            user={{ email: userEmail, settings: {} }}
            onUpdateSecurity={async (settings) => {
              try {
                showSnackbar("Security settings saved", "success");
                addNotification({
                  type: NOTIFICATION_TYPES.SECURITY_ALERT,
                  title: 'Security Settings Updated',
                  message: 'Your security preferences have been saved',
                  priority: 'medium'
                });
              } catch (error) {
                showSnackbar(`Failed to save security settings: ${error.message}`, "error");
              }
            }}
            encryptionStatus={{
              hasOTPKey: false,
              hasAESKey: false
            }}
            onBack={handleOpenInbox}
          />
        );
        
      case "settings":
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
            onBack={handleOpenInbox}
          />
        );
        
      case "help":
        return (
          <HelpSupport
            onBack={handleOpenInbox}
          />
        );
        
      case "about":
        return (
          <AboutQuMail
            onBack={handleOpenInbox}
          />
        );
        
      case "notifications":
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Notifications
            </Typography>
            <Typography variant="body1" paragraph>
              Manage your notification preferences and view recent alerts.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleOpenInbox}
              >
                Back to Inbox
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return renderInboxContent();
    }
  };

  // Render page header for non-inbox pages
  const renderPageHeader = () => {
    if (mainContent.type === "inbox") return null;
    
    const pageTitles = {
      "account": "Account Settings",
      "security": "Security Settings",
      "settings": "Application Settings",
      "help": "Help & Support",
      "about": "About QuMail",
      "notifications": "Notifications"
    };
    
    const pageIcons = {
      "account": <Person />,
      "security": <Security />,
      "settings": <Settings />,
      "help": <Info />,
      "about": <Public />,
      "notifications": <Notifications />
    };
    
    return (
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={handleOpenInbox}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {pageIcons[mainContent.type]}
          <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
            {pageTitles[mainContent.type]}
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
          boxShadow: theme.shadows[1],
          borderBottom: '1px solid',
          borderColor: theme.palette.divider,
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
            <Typography variant="h6" noWrap component="div" fontWeight="600" sx={{ color: 'text.primary' }}>
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
          {!isMobile && mainContent.type === "inbox" && (
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
          {mainContent.type === "inbox" && (
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
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                }}>
                  <FiberManualRecord sx={{ fontSize: 12, color: theme.palette.success.main }} />
                  <Typography variant="caption" fontWeight="500" sx={{ color: 'text.primary' }}>
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
                  sx={{ color: 'text.primary' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip title="Toggle theme">
                <IconButton size="small" onClick={onToggleTheme} sx={{ color: 'text.primary' }}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>

              {/* Notifications Button */}
              <Tooltip title="Notifications">
                <IconButton 
                  size="small" 
                  onClick={handleNotificationsMenuOpen}
                  sx={{ color: 'text.primary' }}
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
                  <IconButton size="small" sx={{ color: 'text.primary' }}>
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
                        bgcolor: theme.palette.success.main, 
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
                <Typography variant="body1" fontWeight="600" sx={{ color: 'text.primary' }}>
                  {userEmail?.split('@')[0] || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {userEmail || 'No email'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <FiberManualRecord sx={{ fontSize: 8, color: theme.palette.success.main }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Account Active
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Divider sx={{ borderColor: theme.palette.divider }} />

            {/* Menu Items */}
            <MenuItem onClick={handleOpenAccountSettings}>
              <Person sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>My Account</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Manage your profile
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleOpenSecuritySettings}>
              <Security sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Security Settings</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Encryption preferences
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleOpenSettings}>
              <Settings sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>App Settings</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Customize QuMail
                </Typography>
              </Box>
            </MenuItem>
            
            <Divider sx={{ borderColor: theme.palette.divider }} />
            
            <MenuItem onClick={() => { handleMenuClose(); onLogout(); }}>
              <ExitToApp sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Sign Out</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
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
              borderColor: theme.palette.divider,
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
              borderColor: theme.palette.divider,
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
        {/* Page Header for non-inbox pages */}
        {renderPageHeader()}

        {/* Dynamic Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {renderMainContent()}
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

      {/* Decrypt Modal */}
      <DecryptModal
        open={decryptModalOpen}
        onClose={() => {
          setDecryptModalOpen(false);
          setEmailToDecrypt(null);
        }}
        onDecrypt={handleDecryptModalSubmit}
        email={emailToDecrypt}
        loading={loading}
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
}