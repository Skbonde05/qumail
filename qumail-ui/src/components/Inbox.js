import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Checkbox,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Badge,
  CircularProgress,
  Paper,
  Button,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Star,
  StarBorder,
  LabelImportant,
  LabelImportantOutlined,
  Delete,
  Archive,
  MarkEmailRead,
  MarkEmailUnread,
  FilterList,
  MoreVert,
  Search,
  Refresh,
  KeyboardArrowDown,
  Drafts,
  Send,
  Inbox as InboxIcon,
  ChevronRight,
  ArrowBack,
  Report,
  Schedule
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import EmailViewer from "./EmailViewer";

// Styled Components
const EmailListItem = styled(ListItem, {
  shouldForwardProp: (prop) => !['unread', 'selected'].includes(prop)
})(({ theme, unread, selected }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.08)
    : unread 
      ? alpha(theme.palette.primary.main, 0.04)
      : theme.palette.background.paper,
  '&:hover': {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.12)
      : alpha(theme.palette.action.hover, 0.04),
    boxShadow: theme.shadows[1]
  },
  transition: theme.transitions.create(['background-color', 'box-shadow'], {
    duration: theme.transitions.duration.shortest,
  }),
  cursor: 'pointer',
  position: 'relative',
  '&::after': selected ? {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.palette.primary.main,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3
  } : undefined
}));

const SenderAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'security'
})(({ theme, security }) => ({
  backgroundColor: 
    security === "otp" ? theme.palette.error.main :
    security === "aes" ? theme.palette.success.main : 
    theme.palette.primary.main,
  color: theme.palette.getContrastText(
    security === "otp" ? theme.palette.error.main :
    security === "aes" ? theme.palette.success.main :
    theme.palette.primary.main
  ),
  fontSize: theme.typography.pxToRem(14),
  fontWeight: 600,
  width: 36,
  height: 36,
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 24,
    backgroundColor: alpha(theme.palette.common.white, 0.95),
    transition: theme.transitions.create(['background-color', 'box-shadow']),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.98),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.common.white,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: theme.spacing(1.25, 1.5),
  }
}));

const EmptyState = ({ onCompose, activeFolder }) => {
  const theme = useTheme();
  
  const folderMessages = {
    inbox: {
      title: "Your inbox is empty",
      message: "When you receive emails, they'll appear here. Try composing a new message or check back later."
    },
    sent: {
      title: "No sent messages",
      message: "Sent emails will appear here once you start sending messages."
    },
    drafts: {
      title: "No drafts",
      message: "Save emails as drafts while composing to see them here."
    },
    trash: {
      title: "Trash is empty",
      message: "Deleted emails will appear here."
    },
    spam: {
      title: "No spam",
      message: "Emails marked as spam will appear here."
    },
    archive: {
      title: "Archive is empty",
      message: "Archived emails will appear here."
    },
    starred: {
      title: "No starred emails",
      message: "Star important emails to see them here."
    },
    important: {
      title: "No important emails",
      message: "Mark emails as important to see them here."
    },
    snoozed: {
      title: "No snoozed emails",
      message: "Snooze emails to see them here."
    }
  };
  
  const message = folderMessages[activeFolder] || folderMessages.inbox;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: theme.palette.text.secondary,
        padding: theme.spacing(4)
      }}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <InboxIcon sx={{ fontSize: 120, mb: 2, opacity: 0.3 }} />
      </motion.div>
      <Typography variant="h5" gutterBottom fontWeight="600">
        {message.title}
      </Typography>
      <Typography variant="body1" align="center" sx={{ maxWidth: 400, mb: 3 }}>
        {message.message}
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<Send />}
        sx={{ borderRadius: 20 }}
        onClick={onCompose}
      >
        Compose Email
      </Button>
    </motion.div>
  );
};

const LoadingSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 1,
              borderRadius: 2,
              backgroundColor: theme.palette.background.default,
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 0.8 },
                '100%': { opacity: 0.6 }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'action.disabled' }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ width: '40%', height: 20, bgcolor: 'action.disabled', borderRadius: 1, mb: 1 }} />
                <Box sx={{ width: '60%', height: 16, bgcolor: 'action.disabled', borderRadius: 1 }} />
              </Box>
            </Box>
          </Paper>
        </motion.div>
      ))}
    </Box>
  );
};

export default function Inbox({ 
  emails = [], // Default to empty array
  activeFolder = "inbox",
  onFolderChange,
  userEmail,
  userPassword,
  onCompose,
  onRefresh,
  onUpdateEmail,
  onBulkAction,
  onMoveEmails,
  loading: globalLoading,
  onGetEmailBody,
  onDecryptEmail,
  determineSecurityLevel,
  generatePreview,
  formatDate,
  onSaveDraft,
  onDeleteDraft,
  onSelectEmail
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [starredEmails, setStarredEmails] = useState([]);
  const [importantEmails, setImportantEmails] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [emailBodyCache, setEmailBodyCache] = useState({});
  const [bulkActionMenu, setBulkActionMenu] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [viewMode, setViewMode] = useState(isMobile ? "list" : "split");

  // Ensure emails is always an array
  const safeEmails = Array.isArray(emails) ? emails : [];

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedStarred = localStorage.getItem('qumail_starred');
      const savedImportant = localStorage.getItem('qumail_important');
      if (savedStarred) setStarredEmails(JSON.parse(savedStarred));
      if (savedImportant) setImportantEmails(JSON.parse(savedImportant));
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qumail_starred', JSON.stringify(starredEmails));
      localStorage.setItem('qumail_important', JSON.stringify(importantEmails));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [starredEmails, importantEmails]);

  // Handle responsive view mode
  useEffect(() => {
    if (isMobile) {
      setViewMode("list");
      if (selectedEmail) {
        setShowEmailViewer(true);
      }
    } else {
      setViewMode("split");
    }
  }, [isMobile, selectedEmail]);

  // Filter emails - SAFELY with useMemo
  const filteredEmails = useMemo(() => {
    // Ensure we're working with an array
    if (!Array.isArray(safeEmails)) {
      return [];
    }

    let filtered = safeEmails.filter(email => email && (email.uid || email.id));

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(email => {
        if (!email) return false;
        return (
          (email.subject || '').toLowerCase().includes(term) ||
          (email.from || '').toLowerCase().includes(term) ||
          (email.preview || '').toLowerCase().includes(term) ||
          (email.body || '').toLowerCase().includes(term)
        );
      });
    }

    // Apply type filter
    switch (filter) {
      case "unread":
        filtered = filtered.filter(email => !email.read);
        break;
      case "starred":
        filtered = filtered.filter(email => 
          starredEmails.includes(email.uid || email.id) || email.starred
        );
        break;
      case "important":
        filtered = filtered.filter(email => 
          importantEmails.includes(email.uid || email.id) || email.important
        );
        break;
      case "encrypted":
        filtered = filtered.filter(email => 
          (email.body && (
            email.body.includes('[otp|') || 
            email.body.includes('[aes|')
          ))
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [safeEmails, searchTerm, filter, starredEmails, importantEmails]);

  // Get email ID (uid or id)
  const getEmailId = useCallback((email) => {
    return email?.uid || email?.id || null;
  }, []);

  // Handlers
  const toggleStar = useCallback((emailId, event) => {
    if (event) event.stopPropagation();
    const isStarred = starredEmails.includes(emailId);
    setStarredEmails(prev => 
      isStarred
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
    if (onUpdateEmail) {
      onUpdateEmail(emailId, 'star', !isStarred);
    }
    showSnackbar(
      isStarred 
        ? "Email unstarred" 
        : "Email starred",
      "success"
    );
  }, [onUpdateEmail, starredEmails]);

  const toggleImportant = useCallback((emailId, event) => {
    if (event) event.stopPropagation();
    const isImportant = importantEmails.includes(emailId);
    setImportantEmails(prev => 
      isImportant
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
    if (onUpdateEmail) {
      onUpdateEmail(emailId, 'important', !isImportant);
    }
    showSnackbar(
      isImportant 
        ? "Email marked as not important" 
        : "Email marked as important",
      "success"
    );
  }, [onUpdateEmail, importantEmails]);

  const toggleSelectEmail = useCallback((emailId, event) => {
    if (event) event.stopPropagation();
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  }, []);

  const selectAllEmails = useCallback(() => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(
        filteredEmails
          .map(email => getEmailId(email))
          .filter(Boolean)
      );
    }
  }, [filteredEmails, selectedEmails.length, getEmailId]);

  const openEmail = useCallback(async (email) => {
    const emailId = getEmailId(email);
    if (!emailId) {
      showSnackbar("Invalid email", "error");
      return;
    }

    // Don't reload if same email is already selected
    if (selectedEmail && (getEmailId(selectedEmail) === emailId)) {
      if (isMobile) {
        setShowEmailViewer(true);
      }
      return;
    }

    setSelectedEmail(email);
    if (onSelectEmail) {
      onSelectEmail(email);
    }
    
    if (isMobile) {
      setShowEmailViewer(true);
    }

    // Check if email body is already cached
    if (emailBodyCache[emailId]) {
      return;
    }

    setLoading(true);
    try {
      // Use the prop function to get email body
      let emailBody = '';
      if (onGetEmailBody && typeof onGetEmailBody === 'function') {
        emailBody = await onGetEmailBody(emailId);
      } else {
        emailBody = email.body || '';
      }
      
      // Determine security level
      const securityLevel = determineSecurityLevel ? 
        determineSecurityLevel(emailBody) : 'none';
      
      // Extract key and encrypted content if needed
      let decryptedBody = emailBody;
      if (securityLevel !== 'none' && onDecryptEmail) {
        const match = emailBody.match(/\[(.*?)\|(.*?)\]:(.*)/s);
        if (match) {
          const [, level, key, encryptedContent] = match;
          decryptedBody = await onDecryptEmail(encryptedContent, level, key);
        }
      }

      const cachedEmail = {
        ...email,
        body: emailBody,
        decryptedBody: decryptedBody,
        security: securityLevel,
        preview: generatePreview ? generatePreview(decryptedBody) : decryptedBody?.substring(0, 100) || ''
      };

      setEmailBodyCache(prev => ({
        ...prev,
        [emailId]: cachedEmail
      }));
      
    } catch (err) {
      console.error("Failed to load email:", err);
      showSnackbar("Failed to load email content", "error");
    } finally {
      setLoading(false);
    }
  }, [
    selectedEmail, 
    isMobile, 
    emailBodyCache, 
    onGetEmailBody, 
    determineSecurityLevel, 
    generatePreview, 
    onDecryptEmail,
    onSelectEmail,
    getEmailId
  ]);

  const getSecurityColor = (level) => {
    switch (level) {
      case "otp": return "error";
      case "aes": return "success";
      default: return "default";
    }
  };

  const getSecurityIcon = (level) => {
    switch (level) {
      case "otp": return "🔒";
      case "aes": return "⚡";
      default: return "✉️";
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleBulkAction = useCallback((action) => {
    if (!onBulkAction || selectedEmails.length === 0) return;
    
    switch (action) {
      case "mark-read":
        onBulkAction(selectedEmails, 'read', true);
        showSnackbar(`Marked ${selectedEmails.length} emails as read`, "success");
        break;
      case "mark-unread":
        onBulkAction(selectedEmails, 'read', false);
        showSnackbar(`Marked ${selectedEmails.length} emails as unread`, "success");
        break;
      case "archive":
        if (onMoveEmails) {
          onMoveEmails(selectedEmails, 'archive');
        }
        showSnackbar(`Archived ${selectedEmails.length} emails`, "success");
        break;
      case "delete":
        if (onMoveEmails) {
          onMoveEmails(selectedEmails, 'trash');
        }
        showSnackbar(`Deleted ${selectedEmails.length} emails`, "success");
        setSelectedEmails([]);
        break;
      case "spam":
        if (onMoveEmails) {
          onMoveEmails(selectedEmails, 'spam');
        }
        showSnackbar(`Marked ${selectedEmails.length} emails as spam`, "success");
        break;
    }
    setBulkActionMenu(null);
  }, [onBulkAction, selectedEmails, onMoveEmails]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Render components
  const renderToolbar = () => (
    <Paper 
      elevation={0}
      sx={{
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        backgroundColor: theme.palette.background.paper,
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      <Checkbox
        indeterminate={selectedEmails.length > 0 && selectedEmails.length < filteredEmails.length}
        checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
        onChange={selectAllEmails}
        disabled={filteredEmails.length === 0}
      />
      
      {selectedEmails.length > 0 ? (
        <>
          <Tooltip title="Mark as read">
            <IconButton size="small" onClick={() => handleBulkAction("mark-read")}>
              <MarkEmailRead />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Mark as unread">
            <IconButton size="small" onClick={() => handleBulkAction("mark-unread")}>
              <MarkEmailUnread />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Archive">
            <IconButton size="small" onClick={() => handleBulkAction("archive")}>
              <Archive />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleBulkAction("delete")} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Report spam">
            <IconButton size="small" onClick={() => handleBulkAction("spam")}>
              <Report />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="More actions">
            <IconButton size="small" onClick={(e) => setBulkActionMenu(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {selectedEmails.length} selected
          </Typography>
        </>
      ) : (
        <>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleRefresh} disabled={globalLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <SearchField
            size="small"
            placeholder="Search emails..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <KeyboardArrowDown />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ maxWidth: 400 }}
          />
          
          <Box sx={{ display: "flex", gap: 0.5, ml: "auto" }}>
            <Chip
              label="All"
              size="small"
              variant={filter === "all" ? "filled" : "outlined"}
              onClick={() => setFilter("all")}
              clickable
            />
            <Chip
              label="Unread"
              size="small"
              variant={filter === "unread" ? "filled" : "outlined"}
              onClick={() => setFilter("unread")}
              clickable
            />
            <Chip
              icon={<Star fontSize="small" />}
              size="small"
              variant={filter === "starred" ? "filled" : "outlined"}
              onClick={() => setFilter("starred")}
              clickable
            />
          </Box>
        </>
      )}
    </Paper>
  );

  const renderEmailList = () => (
    <Box sx={{ flex: 1, overflowY: "auto", position: "relative" }}>
      <AnimatePresence>
        {globalLoading ? (
          <LoadingSkeleton />
        ) : filteredEmails.length === 0 ? (
          <EmptyState onCompose={onCompose} activeFolder={activeFolder} />
        ) : (
          <List disablePadding>
            {filteredEmails.map((email, index) => {
              if (!email) return null;
              
              const emailId = getEmailId(email);
              const cachedEmail = emailBodyCache[emailId] || email;
              const isStarred = starredEmails.includes(emailId) || email.starred;
              const isImportant = importantEmails.includes(emailId) || email.important;
              const isSelected = selectedEmails.includes(emailId);
              const isUnread = !email.read;
              const securityLevel = cachedEmail.security || "none";

              return (
                <motion.div
                  key={emailId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <EmailListItem
                    unread={isUnread}
                    selected={selectedEmail && (getEmailId(selectedEmail) === emailId)}
                    onClick={() => openEmail(email)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onClick={(e) => toggleSelectEmail(emailId, e)}
                      />
                    </ListItemIcon>
                    
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconButton 
                        size="small"
                        onClick={(e) => toggleStar(emailId, e)}
                        sx={{ color: isStarred ? theme.palette.warning.main : undefined }}
                      >
                        {isStarred ? <Star /> : <StarBorder />}
                      </IconButton>
                    </ListItemIcon>
                    
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconButton 
                        size="small"
                        onClick={(e) => toggleImportant(emailId, e)}
                        sx={{ color: isImportant ? theme.palette.warning.main : undefined }}
                      >
                        {isImportant ? <LabelImportant /> : <LabelImportantOutlined />}
                      </IconButton>
                    </ListItemIcon>
                    
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box sx={{ 
                            fontSize: "0.5rem",
                            bgcolor: "white",
                            borderRadius: "50%",
                            p: 0.2,
                            border: `1px solid ${theme.palette.divider}`
                          }}>
                            {getSecurityIcon(securityLevel)}
                          </Box>
                        }
                      >
                        <SenderAvatar security={securityLevel}>
                          {email.from?.charAt(0).toUpperCase() || "?"}
                        </SenderAvatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={isUnread ? "600" : "400"}
                            sx={{ flex: 1 }}
                            noWrap
                          >
                            {email.from?.split("<")[0].trim() || "Unknown Sender"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate ? formatDate(email.date) : new Date(email.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="body2"
                              fontWeight={isUnread ? "600" : "400"}
                              color={isUnread ? "text.primary" : "text.secondary"}
                              sx={{ flex: 1 }}
                              noWrap
                            >
                              {email.subject || "(No Subject)"}
                            </Typography>
                            {securityLevel !== "none" && (
                              <Chip
                                label={securityLevel === "otp" ? "OTP" : "AES"}
                                size="small"
                                color={getSecurityColor(securityLevel)}
                                sx={{ height: 18, fontSize: "0.6rem" }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}
                          >
                            {cachedEmail.preview || email.preview || "No preview available"}
                          </Typography>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />
                    
                    <ChevronRight sx={{ color: "action.active", ml: 1 }} />
                  </EmailListItem>
                </motion.div>
              );
            })}
          </List>
        )}
      </AnimatePresence>
    </Box>
  );

  const renderEmailViewer = () => {
    if (!selectedEmail) return null;

    const emailId = getEmailId(selectedEmail);
    const cachedEmail = emailBodyCache[emailId] || selectedEmail;

    return (
      <EmailViewer
        email={cachedEmail}
        onBack={() => {
          setSelectedEmail(null);
          if (isMobile) setShowEmailViewer(false);
          if (onSelectEmail) {
            onSelectEmail(null);
          }
        }}
        onReply={(email) => {
          if (onCompose) onCompose();
        }}
        onReplyAll={(email) => {
          if (onCompose) onCompose();
        }}
        onForward={(email) => {
          if (onCompose) onCompose();
        }}
        onDelete={(emailId) => {
          if (onMoveEmails) {
            onMoveEmails([emailId], 'trash');
          }
          showSnackbar("Email moved to trash", "success");
          setSelectedEmail(null);
          if (isMobile) setShowEmailViewer(false);
        }}
        onArchive={(emailId) => {
          if (onMoveEmails) {
            onMoveEmails([emailId], 'archive');
          }
          showSnackbar("Email archived", "success");
        }}
        onStarToggle={(emailId, starred) => {
          toggleStar(emailId);
        }}
        onImportantToggle={(emailId, important) => {
          toggleImportant(emailId);
        }}
        userEmail={userEmail}
        userPassword={userPassword}
        isLoading={loading}
        onDecryptEmail={onDecryptEmail}
      />
    );
  };

  const renderSplitView = () => (
    <Box sx={{ 
      display: "flex", 
      height: "100%", 
      backgroundColor: theme.palette.background.default 
    }}>
      {/* Email List Panel */}
      <Box sx={{ 
        width: isTablet ? "45%" : "40%",
        minWidth: 350,
        maxWidth: 600,
        display: "flex", 
        flexDirection: "column",
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1]
      }}>
        {renderToolbar()}
        {renderEmailList()}
      </Box>

      {/* Email Viewer Panel */}
      <Box sx={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        backgroundColor: theme.palette.background.paper,
        position: "relative"
      }}>
        {selectedEmail ? renderEmailViewer() : (
          <Box sx={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            justifyContent: "center",
            color: theme.palette.text.secondary,
            p: 4
          }}>
            <InboxIcon sx={{ fontSize: 96, mb: 2, opacity: 0.2 }} />
            <Typography variant="h5" gutterBottom fontWeight="500">
              Select an email to read
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
              Choose an email from the list to view its full contents here
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderListView = () => (
    <Box sx={{ 
      height: "100%", 
      backgroundColor: theme.palette.background.paper 
    }}>
      {showEmailViewer ? (
        <>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: "flex", 
              alignItems: "center",
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <IconButton onClick={() => {
              setShowEmailViewer(false);
              setSelectedEmail(null);
              if (onSelectEmail) {
                onSelectEmail(null);
              }
            }} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flex: 1 }}>
              {selectedEmail?.subject || "Email"}
            </Typography>
          </Paper>
          {renderEmailViewer()}
        </>
      ) : (
        <>
          {renderToolbar()}
          {renderEmailList()}
        </>
      )}
    </Box>
  );

  return (
    <>
      <Box sx={{ 
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        position: "relative"
      }}>
        {viewMode === "split" ? renderSplitView() : renderListView()}
        
        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: theme.zIndex.modal + 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionMenu}
        open={Boolean(bulkActionMenu)}
        onClose={() => setBulkActionMenu(null)}
      >
        <MenuItem onClick={() => handleBulkAction("mark-read")}>
          <MarkEmailRead sx={{ mr: 2 }} />
          Mark as read
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("mark-unread")}>
          <MarkEmailUnread sx={{ mr: 2 }} />
          Mark as unread
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction("archive")}>
          <Archive sx={{ mr: 2 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("delete")}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("spam")}>
          <Report sx={{ mr: 2 }} />
          Report spam
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}