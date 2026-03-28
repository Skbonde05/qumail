import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Collapse,
  CircularProgress,
  Badge,
  Alert,
  Stack,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Reply as ReplyIcon,
  ReplyAll as ReplyAllIcon,
  Forward as ForwardIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  LabelImportant as LabelImportantIcon,
  LabelImportantOutlined as LabelImportantOutlinedIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  FlashOn as FlashOnIcon,
  Mail as MailIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  AccessTime as AccessTimeIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
  Print as PrintIcon,
  Key as KeyIcon,
  CopyAll as CopyAllIcon,
  Lock as LucideLock,
  Report as ReportIcon,
  ReportOff as ReportOffIcon,
  Folder as FolderIcon,
  Circle,
  Close,
  AutoFixHigh as SparklesIcon
} from '@mui/icons-material';
import { styled, alpha, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.1); }
`;



// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4, 4, 8, 4),
  overflowY: 'auto',
  backgroundColor: theme.palette.background.default,
}));

const SecurityBadge = styled(Chip)(({ theme, level }) => ({
  fontWeight: 700,
  fontSize: '0.75rem',
  padding: '6px 8px',
  borderRadius: '8px',
  border: 'none',
  ...(level === 'otp' && {
    backgroundColor: alpha(theme.palette.error.main, 0.12),
    color: theme.palette.error.main,
  }),
  ...(level === 'aes' && {
    backgroundColor: alpha(theme.palette.success.main, 0.12),
    color: theme.palette.success.main,
  }),
  ...(level === 'none' && {
    backgroundColor: alpha(theme.palette.text.disabled, 0.12),
    color: theme.palette.text.secondary,
  }),
}));


const AttachmentItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// Helper function to format date safely
const formatDateSafe = (dateInput) => {
  if (!dateInput) return 'Unknown date';
  
  try {
    let date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        const timestamp = parseInt(dateInput);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    const currentYear = now.getFullYear();
    if (year === currentYear) {
      return `${month} ${day}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
    
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Date error';
  }
};

// Format time only
const formatTime = (dateInput) => {
  try {
    let date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) return '';
    
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
};

// Security configuration
const getSecurityConfig = (securityLevel, theme) => {
  const configs = {
    otp: {
      label: 'OTP Encrypted',
      icon: <LockIcon sx={{ fontSize: 16 }} />,
      color: 'error',
      description: 'One-Time Pad - Maximum Security',
      badgeColor: theme.palette.error.main,
      severity: 'info',
      alertIcon: <VerifiedUserIcon />,
    },
    aes: {
      label: 'AES Encrypted',
      icon: <FlashOnIcon sx={{ fontSize: 16 }} />,
      color: 'success',
      description: 'AES-256 - Fast & Secure',
      badgeColor: theme.palette.success.main,
      severity: 'success',
      alertIcon: <SecurityIcon />,
    },
    none: {
      label: 'Standard',
      icon: <MailIcon sx={{ fontSize: 16 }} />,
      color: 'default',
      description: 'No Encryption',
      badgeColor: theme.palette.grey[500],
      severity: 'warning',
      alertIcon: <ErrorIcon />,
    },
  };
  
  return configs[securityLevel.toLowerCase()] || configs.none;
};

// DecryptModal Component
const DecryptModal = ({ open, onClose, email, onDecrypt, loading }) => {
  const [otpKey, setOtpKey] = useState('');
  
  const handleSubmit = () => {
    onDecrypt(email?.uid || email?.id, otpKey);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyIcon color="primary" />
          <Typography variant="h6">Decrypt Email</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          This email is encrypted with {email?.encryptionLevel === 'otp' ? 'Quantum OTP' : 'Quantum AES'} encryption.
        </Typography>
        
        {email?.encryptionLevel === 'otp' ? (
          <>
            <Typography variant="body2" gutterBottom>
              <strong>OTP Decryption Key Required:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" paragraph>
              You need the One-Time Pad key that was shared with you by the sender to decrypt this message.
              The key is typically shared through a secure channel.
            </Typography>
            <TextField
              fullWidth
              label="Enter OTP Key"
              type="password"
              value={otpKey}
              onChange={(e) => setOtpKey(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter hexadecimal OTP key"
              margin="normal"
              variant="outlined"
              helperText="The key should be in hexadecimal format (0-9, a-f)"
              disabled={loading}
            />
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Note:</strong> OTP keys are used only once. If you've used this key before or if it's incorrect, decryption will fail.
              </Typography>
            </Box>
          </>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              AES-256 encrypted emails are automatically decrypted when you open them.
              If you're seeing this message, there might be an issue with the encryption keys.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {email?.encryptionLevel === 'otp' && (
          <Button
            variant="outlined"
            startIcon={<CopyAllIcon />}
            onClick={() => copyToClipboard(otpKey)}
            disabled={!otpKey || loading}
          >
            Copy Key
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || (email?.encryptionLevel === 'otp' && !otpKey)}
          startIcon={loading ? <CircularProgress size={20} /> : <KeyIcon />}
        >
          {loading ? 'Decrypting...' : 'Decrypt Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EMPTY_ARRAY = [];


const EmailViewer = memo(({
  email,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onAction,
  onDecryptEmail,
  isLoading,
  isEncrypting = false,
  labels = [], // Added labels prop
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [expanded, setExpanded] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptionError, setDecryptionError] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [labelAnchorEl, setLabelAnchorEl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Extract email data with safe defaults
  const emailData = email || {};
  const {
    from = '',
    to = '',
    subject = 'No Subject',
    date = new Date(),
    body = '',
    encryptionLevel = 'none',
    cc = EMPTY_ARRAY,
    bcc = EMPTY_ARRAY,
    flags = EMPTY_ARRAY,
    starred = false,
    important = false,
    uid,
    read = false,
    requiresDecryption = false,
    decrypted: alreadyDecrypted = false,
    otpKey = null,
    attachments: initialAttachments = EMPTY_ARRAY
  } = emailData;

  // Parse sender information safely
  const senderName = typeof from === 'string' 
    ? from.split('<')[0].trim() || from 
    : 'Unknown Sender';
  const senderEmail = typeof from === 'string' 
    ? (from.match(/<([^>]+)>/)?.[1] || from)
    : '';
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || '?';

  // Determine security level (handle both encryptionLevel and security props)
  const securityLevel = encryptionLevel || 'none';
  
  // Get security configuration
  const currentSecurity = getSecurityConfig(securityLevel, theme);

  // Format dates safely
  const formattedDate = formatDateSafe(date);
  const formattedTime = formatTime(date);

  const handleDownload = (attachment) => {
    if (!attachment.data) return;
    
    try {
      const byteCharacters = atob(attachment.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.contentType });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Initialize content and states
  useEffect(() => {
    if (!email) return;

    // Check if email is already decrypted
    const isAES = securityLevel === 'aes' || securityLevel === 'aes256';
    const emailIsDecrypted = alreadyDecrypted || 
                            (securityLevel === 'none') || 
                            (isAES && body && !body.trim().startsWith('{"iv":'));
    
    // Only update if state actually changed
    setIsDecrypted(prev => prev !== emailIsDecrypted ? emailIsDecrypted : prev);
    
    if (emailIsDecrypted) {
      setDecryptedContent(body || '');
    } else if (isAES) {
      // For AES, we might need to decrypt
      setDecryptedContent(
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LucideLock sx={{ fontSize: 16 }} />
          <span>AES Encrypted content - Click decrypt to view</span>
        </Box>
      );
    } else if (securityLevel === 'otp') {
      // For OTP, definitely encrypted
      setDecryptedContent(
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LucideLock sx={{ fontSize: 16 }} />
          <span>OTP Encrypted content - Requires key to decrypt</span>
        </Box>
      );

    } else {
      setDecryptedContent(body || '');
    }

    
    setIsStarred(prev => prev !== (starred || flags?.includes('starred') || false) ? (starred || flags?.includes('starred') || false) : prev);
    setIsImportant(prev => prev !== (important || flags?.includes('important') || false) ? (important || flags?.includes('important') || false) : prev);
    setAttachments(initialAttachments || []);
  }, [email, body, securityLevel, alreadyDecrypted, starred, important, flags, initialAttachments]);

  // Toggle expanded view
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Handle star toggle
  const handleStarToggle = () => {
    const newStarredState = !isStarred;
    setIsStarred(newStarredState);
    if (onAction && email?.uid) onAction(email.uid, newStarredState ? 'star' : 'unstar');
  };

  // Handle important toggle
  const handleImportantToggle = () => {
    const newImportantState = !isImportant;
    setIsImportant(newImportantState);
    if (onAction && email?.uid) onAction(email.uid, newImportantState ? 'important' : 'unimportant');
  };

  // Handle decrypt
  const handleDecrypt = async (emailId, otpKey = null) => {
    if (!onDecryptEmail) {
      console.error('No decrypt function provided');
      return;
    }
    
    setIsDecrypting(true);
    setDecryptionError('');
    
    try {
      const result = await onDecryptEmail(emailId, otpKey);
      
      if (result.success) {
        setDecryptedContent(result.decrypted || result.body || '');
        if (result.attachments) setAttachments(result.attachments);
        setIsDecrypted(true);
        setShowDecryptModal(false);
      } else {
        setDecryptionError(result.message || 'Decryption failed');
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      setDecryptionError(error.message || 'Failed to decrypt email. Please check your key and try again.');
    } finally {
      setIsDecrypting(false);
    }
  };
  
  const handleSnooze = async (duration) => {
    let date = new Date();
    switch (duration) {
      case 'today':
        date.setHours(18, 0, 0, 0); // Today 6 PM
        if (date < new Date()) date.setTime(date.getTime() + 4 * 60 * 60 * 1000); // If already past, +4h
        break;
      case 'tomorrow':
        date.setDate(date.getDate() + 1);
        date.setHours(8, 0, 0, 0); // Tomorrow 8 AM
        break;
      case 'weekend':
        const day = date.getDay();
        const diff = (day <= 5) ? (6 - day) : (day === 6 ? 1 : 1);
        date.setDate(date.getDate() + diff); // Next Saturday
        date.setHours(8, 0, 0, 0);
        break;
      case 'next_week':
        date.setDate(date.getDate() + 7);
        date.setHours(8, 0, 0, 0);
        break;
      default:
        date = new Date(duration);
    }

    const success = await onAction(email.uid || email.id, 'snooze', { snoozeDate: date.toISOString() });
    if (success) {
      setSnoozeDialogOpen(false);
      onBack(); // Close viewer after snooze
    }
  };

  // Check if we should show decrypt button
  const shouldShowDecryptButton = () => {
    return securityLevel !== 'none' && !isDecrypted;
  };

  // Check if email needs OTP key
  const needsOTPKey = () => {
    return securityLevel === 'otp' && !isDecrypted;
  };

  // --- AI Summarization Logic (Prototype) ---
  const handleSummarize = () => {
    if (!decryptedContent && !body) return;
    
    setIsSummarizing(true);
    setSummary(null);

    // Simulate AI processing delay
    setTimeout(() => {
      const textToSummarize = typeof decryptedContent === 'string' ? decryptedContent : (body || "");
      const sentences = textToSummarize.split(/[.!?]/).filter(s => s.trim().length > 10);
      
      let aiSummary = "";
      if (sentences.length > 2) {
        aiSummary = [
          `• ${sentences[0].trim()}.`,
          `• ${sentences[Math.floor(sentences.length / 2)].trim()}.`,
          `• ${sentences[sentences.length - 1].trim()}.`
        ].join('\n');
      } else {
        aiSummary = "• This email appears to be concise. " + (textToSummarize.substring(0, 100) || "No additional Context.") + "...";
      }

      setSummary(aiSummary);
      setIsSummarizing(false);
    }, 1800);
  };

  // Render encryption notice
  const renderEncryptionNotice = () => {
    if (securityLevel === 'none') return null;

    if (isDecrypted) {
      return (
        <Alert 
          severity="success" 
          icon={<LockOpenIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="600">
            Decryption Successful
          </Typography>
          <Typography variant="body2">
            This email was encrypted with {currentSecurity.description} and has been successfully decrypted.
          </Typography>
        </Alert>
      );
    }

    if (decryptionError) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="600">
            Decryption Failed
          </Typography>
          <Typography variant="body2">
            {decryptionError}
          </Typography>
          {securityLevel === 'otp' && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowDecryptModal(true)}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          )}
        </Alert>
      );
    }

    return (
      <Alert 
        severity="warning" 
        icon={<LockIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="subtitle2" fontWeight="600">
              {securityLevel === 'otp' ? 'OTP Encrypted' : 'AES Encrypted'}
            </Typography>
            <Typography variant="body2">
              This email is encrypted with {currentSecurity.description}.
              {securityLevel === 'otp' ? ' Use the key provided by the sender to decrypt.' : ' Click "Decrypt" to view it.'}
            </Typography>
            {otpKey && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  Key: {otpKey.substring(0, 16)}...
                </Typography>
                <Button size="small" onClick={() => navigator.clipboard.writeText(otpKey)} sx={{ fontSize: '0.65rem' }}>
                  Copy Key
                </Button>
              </Box>
            )}
          </Box>
          {shouldShowDecryptButton() && (
            <Button
              variant="contained"
              color={currentSecurity.color}
              startIcon={<KeyIcon />}
              onClick={() => {
                if (securityLevel === 'otp') {
                  setShowDecryptModal(true);
                } else {
                  handleDecrypt(email?.uid || email?.id);
                }
              }}
              disabled={isDecrypting}
            >
              {isDecrypting ? 'Decrypting...' : 
               securityLevel === 'otp' ? 'Decrypt with OTP Key' : 'Decrypt Email'}
            </Button>
          )}
        </Box>
      </Alert>
    );
  };

  // Render email content
  const renderEmailContent = () => {
    if (isLoading || isDecrypting) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Box textAlign="center">
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDecrypting ? 'Decrypting Email...' : 'Loading Email...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isDecrypting 
                ? 'Please wait while we securely decrypt your message...' 
                : 'Please wait while we load your email...'}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (!isDecrypted && shouldShowDecryptButton()) {
      return (
        <Card variant="outlined" sx={{ bgcolor: 'action.hover', mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" py={4}>
              <LockIcon sx={{ fontSize: 48, color: currentSecurity.badgeColor, mb: 2 }} />
              <Typography variant="h6" gutterBottom align="center">
                {securityLevel === 'otp' ? 'OTP Encrypted' : 'AES Encrypted'}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                This message is encrypted with {currentSecurity.description}.
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" paragraph>
                {securityLevel === 'otp' 
                  ? 'You need the OTP key provided by the sender through a secure channel to decrypt this message.'
                  : 'Click "Decrypt" above to securely view this message.'}
              </Typography>
              
              {securityLevel === 'otp' ? (
                <Button
                  variant="contained"
                  color={currentSecurity.color}
                  startIcon={<KeyIcon />}
                  onClick={() => setShowDecryptModal(true)}
                  sx={{ mt: 2 }}
                >
                  Decrypt with OTP Key
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color={currentSecurity.color}
                  startIcon={<KeyIcon />}
                  onClick={() => handleDecrypt(email?.uid || email?.id)}
                  sx={{ mt: 2 }}
                >
                  Decrypt Email
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Decrypted or standard email
    return (
      <Box>
        {/* AI Summary Panel */}
        <Collapse in={!!summary || isSummarizing}>
          <Card 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: '20px !important' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SparklesIcon sx={{ 
                    color: 'primary.main', 
                    fontSize: 20,
                    animation: isSummarizing ? `${pulse} 1.5s infinite alternate` : 'none'
                  }} />
                  <Typography variant="subtitle2" fontWeight="800" color="primary.main" sx={{ letterSpacing: '0.5px' }}>
                    AI THREAD SUMMARY
                  </Typography>
                </Box>
                {!isSummarizing && (
                   <IconButton size="small" onClick={() => setSummary(null)}>
                     <Close sx={{ fontSize: 16 }} />
                   </IconButton>
                )}
              </Box>
              
              {isSummarizing ? (
                <Box display="flex" alignItems="center" gap={2} py={1}>
                  <CircularProgress size={20} thickness={6} />
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    AI is analyzing thread content and distilling key points...
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  color: 'text.primary', 
                  lineHeight: 1.7,
                  fontWeight: 500
                }}>
                  {summary}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Collapse>

        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {decryptedContent || body || 'No content available'}
          </Typography>
        </Paper>
      </Box>
    );
  };

  // Render attachments
  const renderAttachments = () => {
    if (!attachments || !attachments.length) return null;

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          Attachments ({attachments.length})
        </Typography>
        <List disablePadding>
          {attachments.map((attachment, index) => (
            <AttachmentItem key={index}>
              <ListItemIcon>
                <Badge color="primary">
                  <AttachFileIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={attachment.filename || `Attachment ${index + 1}`}
                secondary={attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ''}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <Tooltip title="Download">
                <IconButton size="small" onClick={() => handleDownload(attachment)}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </AttachmentItem>
          ))}
        </List>
      </Box>
    );
  };

  // Render loading state
  if (isLoading && !email) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary'
      }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Loading email...
        </Typography>
      </Box>
    );
  }

  if (!email) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary'
      }}>
        <MailIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          Select an email to read
        </Typography>
        <Typography variant="body2">
          Choose an email from the list to view its contents
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <StyledPaper>
        {/* Header with navigation */}
        <HeaderContainer>
          {/* Top toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {onBack && (
                <Tooltip title="Back to inbox">
                  <IconButton onClick={onBack} size="small">
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              <Typography variant="body2" color="text.secondary">
                {isMobile ? '' : 'Reading email'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={isStarred ? "Unstar" : "Star"}>
                <IconButton size="small" onClick={handleStarToggle}>
                  {isStarred ? <StarIcon sx={{ color: theme.palette.warning.main }} /> : <StarBorderIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title={isImportant ? "Mark as not important" : "Mark as important"}>
                <IconButton size="small" onClick={handleImportantToggle}>
                  {isImportant ? <LabelImportantIcon sx={{ color: theme.palette.warning.main }} /> : <LabelImportantOutlinedIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="AI Summarize Thread">
                <IconButton 
                  size="small" 
                  onClick={handleSummarize} 
                  disabled={isSummarizing || !isDecrypted}
                  sx={{ 
                    color: (summary || isSummarizing) ? 'primary.main' : 'inherit',
                    animation: isSummarizing ? `${pulse} 1.5s infinite alternate` : 'none'
                  }}
                >
                  <SparklesIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Snooze">
                <IconButton size="small" onClick={() => setSnoozeDialogOpen(true)}>
                  <AccessTimeIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={email?.folder === 'spam' ? "Not Spam" : "Report Spam"}>
                <IconButton size="small" onClick={() => {
                  const action = email?.folder === 'spam' ? 'not-spam' : 'spam';
                  onAction(email?.uid || email?.id, action);
                  onBack();
                }}>
                  {email?.folder === 'spam' ? <ReportOffIcon /> : <ReportIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Move to Label">
                <IconButton size="small" onClick={(e) => setLabelAnchorEl(e.currentTarget)}>
                  <FolderIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="More options">
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Subject and security badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" fontWeight="600" sx={{ flex: 1, mr: 2 }}>
              {subject}
            </Typography>
            
            <SecurityBadge
              icon={currentSecurity.icon}
              label={currentSecurity.label}
              level={securityLevel.toLowerCase()}
              size="small"
            />
          </Box>

          {/* Sender info and date */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box sx={{ 
                    width: 14, 
                    height: 14, 
                    borderRadius: '50%', 
                    bgcolor: currentSecurity.badgeColor,
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {React.cloneElement(currentSecurity.icon, { sx: { fontSize: 10 } })}
                  </Box>
                }
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '1rem',
                  }}
                >
                  {initials}
                </Avatar>
              </Badge>
              
              <Box>
                <Typography variant="subtitle1" fontWeight="600">
                  {senderName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  to me <Box component="span" sx={{ mx: 0.8, opacity: 0.5 }}>|</Box> {formattedDate}
                </Typography>
              </Box>
            </Box>

            {formattedTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formattedTime}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Recipient info (expandable) */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                <strong>From:</strong> {from}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                <strong>To:</strong> {to}
              </Typography>
              {Array.isArray(cc) && cc.length > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  <strong>Cc:</strong> {cc.join(', ')}
                </Typography>
              )}
              {Array.isArray(bcc) && bcc.length > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  <strong>Bcc:</strong> {bcc.join(', ')}
                </Typography>
              )}
            </Box>
          </Collapse>

          {/* Expand button */}
          <Button
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={handleToggleExpand}
            sx={{ mt: 1 }}
          >
            {expanded ? 'Show less' : 'Show details'}
          </Button>

          {/* Encryption notice */}
          {renderEncryptionNotice()}

          {/* Action buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={isSummarizing ? <CircularProgress size={16} color="inherit" /> : <SparklesIcon />}
              onClick={handleSummarize}
              disabled={isSummarizing || !isDecrypted}
              size="small"
              sx={{ 
                borderRadius: '20px',
                px: 2,
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderWidth: '2px',
                '&:hover': { borderWidth: '2px' }
              }}
            >
              {isSummarizing ? 'Analyzing...' : 'AI Summarize'}
            </Button>

            <Button
              variant="contained"
              startIcon={<ReplyIcon />}
              onClick={() => onReply && onReply(email)}
              size="small"
              disabled={isDecrypting || !isDecrypted}
            >
              Reply
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReplyAllIcon />}
              onClick={() => onReplyAll && onReplyAll(email)}
              size="small"
              disabled={isDecrypting || !isDecrypted}
            >
              Reply All
            </Button>
            <Button
              variant="outlined"
              startIcon={<ForwardIcon />}
              onClick={() => onForward && onForward(email)}
              size="small"
              disabled={isDecrypting || !isDecrypted}
            >
              Forward
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArchiveIcon />}
              onClick={() => onAction && email?.uid && onAction(email.uid, 'archive')}
              size="small"
              disabled={isDecrypting}
            >
              Archive
            </Button>
            <Button
              variant="outlined"
              startIcon={email?.folder === 'spam' ? <ReportOffIcon /> : <ReportIcon />}
              onClick={() => {
                const action = email?.folder === 'spam' ? 'not-spam' : 'spam';
                onAction(email?.uid || email?.id, action);
                onBack();
              }}
              size="small"
              disabled={isDecrypting}
            >
              {email?.folder === 'spam' ? 'Not Spam' : 'Report Spam'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => {
                if (onAction && email?.uid) {
                  const isTrash = email.trash || email.folder === 'trash';
                  onAction(email.uid, isTrash ? 'delete' : 'trash');
                }
              }}
              size="small"
              color="error"
              disabled={isDecrypting}
            >
              {email?.trash || email?.folder === 'trash' ? 'Delete Forever' : 'Delete'}
            </Button>
          </Stack>
        </HeaderContainer>

        {/* Content area */}
        <ContentContainer>
          {/* Email content */}
          {renderEmailContent()}

          {/* Attachments */}
          {renderAttachments()}
        </ContentContainer>

        {/* Bottom action bar */}
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="caption" color="text.secondary">
            Message ID: {email?.uid || 'N/A'} • {currentSecurity.label.toUpperCase()}
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<ReplyIcon />}
              onClick={() => onReply && onReply(email)}
              size="small"
              disabled={!isDecrypted}
            >
              Reply
            </Button>
            <Button
              variant="outlined"
              startIcon={<ForwardIcon />}
              onClick={() => onForward && onForward(email)}
              size="small"
              disabled={!isDecrypted}
            >
              Forward
            </Button>
          </Stack>
        </Box>

        {/* Encryption in progress overlay */}
        {isEncrypting && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: theme.zIndex.modal,
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 3 }}>
              Encrypting Message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Securing your content with {currentSecurity.label}...
            </Typography>
          </Box>
        )}
      </StyledPaper>

      {/* Snooze Dialog */}
      <Dialog open={snoozeDialogOpen} onClose={() => setSnoozeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Snooze until...</DialogTitle>
        <List sx={{ pt: 0 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleSnooze('today')}>
              <ListItemText primary="Later today" secondary="6:00 PM" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleSnooze('tomorrow')}>
              <ListItemText primary="Tomorrow" secondary="8:00 AM" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleSnooze('weekend')}>
              <ListItemText primary="This weekend" secondary={new Date().getDay() >= 5 ? "Next Sat 8:00 AM" : "Sat 8:00 AM"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleSnooze('next_week')}>
              <ListItemText primary="Next week" secondary="Mon 8:00 AM" />
            </ListItemButton>
          </ListItem>
        </List>
      </Dialog>

      {/* Decrypt Modal */}
      <DecryptModal
        open={showDecryptModal}
        onClose={() => setShowDecryptModal(false)}
        email={email}
        onDecrypt={handleDecrypt}
        loading={isDecrypting}
      />

      <Menu
        anchorEl={labelAnchorEl}
        open={Boolean(labelAnchorEl)}
        onClose={() => setLabelAnchorEl(null)}
      >
        <Typography variant="overline" sx={{ px: 2, display: 'block', fontWeight: 700 }}>
          Move to Label
        </Typography>
        {labels.map((label) => (
          <MenuItem 
            key={label.id} 
            onClick={() => {
              onAction(email.uid || email.id, 'move', { folder: label.id });
              setLabelAnchorEl(null);
              onBack();
            }}
          >
            <ListItemIcon>
              <Circle sx={{ color: label.color, fontSize: 12 }} />
            </ListItemIcon>
            <ListItemText primary={label.name} />
          </MenuItem>
        ))}
        {labels.length === 0 && (
          <MenuItem disabled>No custom labels</MenuItem>
        )}
      </Menu>
    </>
  );
});

export default EmailViewer;