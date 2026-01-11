import React, { useState, useEffect } from 'react';
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
  ListItemIcon,
  ListItemText,
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
  CopyAll as CopyAllIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  overflowY: 'auto',
  backgroundColor: theme.palette.background.default,
}));

const SecurityBadge = styled(Chip)(({ theme, level }) => ({
  fontWeight: 600,
  borderWidth: 2,
  ...(level === 'otp' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
    borderColor: theme.palette.error.main,
  }),
  ...(level === 'aes' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
    borderColor: theme.palette.success.main,
  }),
  ...(level === 'none' && {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    borderColor: theme.palette.grey[400],
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
      label: 'Quantum OTP',
      icon: <LockIcon sx={{ fontSize: 16 }} />,
      color: 'error',
      description: 'One-Time Pad - Maximum Security',
      badgeColor: theme.palette.error.main,
      severity: 'info',
      alertIcon: <VerifiedUserIcon />,
    },
    aes: {
      label: 'Quantum AES',
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

export default function EmailViewer({
  email,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onToggleStar,
  onToggleImportant,
  onDecryptEmail,
  isLoading,
  isEncrypting = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [expanded, setExpanded] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [attachments] = useState([]);
  const [isStarred, setIsStarred] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptionError, setDecryptionError] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);

  // Extract email data with safe defaults
  const emailData = email || {};
  const {
    from = '',
    to = '',
    subject = 'No Subject',
    date = new Date(),
    body = '',
    encryptionLevel = 'none',
    cc = [],
    bcc = [],
    flags = [],
    starred = false,
    important = false,
    uid,
    read = false,
    requiresDecryption = false,
    decrypted: alreadyDecrypted = false,
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

  // Initialize content and states
  useEffect(() => {
    if (!email) return;

    // Check if email is already decrypted
    const emailIsDecrypted = alreadyDecrypted || 
                            (securityLevel === 'none') || 
                            (securityLevel === 'aes' && body && !body.includes('[') && !body.includes('ENCRYPTED'));
    
    setIsDecrypted(emailIsDecrypted);
    
    if (emailIsDecrypted) {
      setDecryptedContent(body || '');
    } else if (securityLevel === 'aes') {
      // For AES, we might need to decrypt
      setDecryptedContent('🔒 Encrypted content - Click decrypt to view');
    } else if (securityLevel === 'otp') {
      // For OTP, definitely encrypted
      setDecryptedContent('🔒 OTP Encrypted content - Requires key to decrypt');
    } else {
      setDecryptedContent(body || '');
    }
    
    setIsStarred(starred || flags?.includes('starred') || false);
    setIsImportant(important || flags?.includes('important') || false);
  }, [email, body, securityLevel, alreadyDecrypted, starred, important, flags]);

  // Toggle expanded view
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Handle star toggle
  const handleStarToggle = () => {
    const newStarredState = !isStarred;
    setIsStarred(newStarredState);
    if (onToggleStar && email?.uid) onToggleStar(email.uid, newStarredState);
  };

  // Handle important toggle
  const handleImportantToggle = () => {
    const newImportantState = !isImportant;
    setIsImportant(newImportantState);
    if (onToggleImportant && email?.uid) onToggleImportant(email.uid, newImportantState);
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

  // Check if we should show decrypt button
  const shouldShowDecryptButton = () => {
    return securityLevel !== 'none' && !isDecrypted;
  };

  // Check if email needs OTP key
  const needsOTPKey = () => {
    return securityLevel === 'otp' && !isDecrypted;
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
              {securityLevel === 'otp' ? 'OTP Encrypted Email' : 'AES Encrypted Email'}
            </Typography>
            <Typography variant="body2">
              This email is encrypted with {currentSecurity.description}.
              {securityLevel === 'otp' ? ' You need the OTP key to decrypt it.' : ' Click "Decrypt" to view it.'}
            </Typography>
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
                {securityLevel === 'otp' ? 'OTP Encrypted Content' : 'AES Encrypted Content'}
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
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {decryptedContent || body || 'No content available'}
        </Typography>
      </Paper>
    );
  };

  // Render attachments
  const renderAttachments = () => {
    if (!attachments.length) return null;

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
                primary={attachment.name || `Attachment ${index + 1}`}
                secondary={attachment.size || ''}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <Tooltip title="Download">
                <IconButton size="small">
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
                  to me • {formattedDate}
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
              onClick={() => onArchive && email?.uid && onArchive(email.uid)}
              size="small"
              disabled={isDecrypting}
            >
              Archive
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete && email?.uid && onDelete(email.uid)}
              size="small"
              color="error"
              disabled={isDecrypting}
            >
              Delete
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
            Message ID: {email?.uid || 'N/A'} • {securityLevel.toUpperCase()}
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

      {/* Decrypt Modal */}
      <DecryptModal
        open={showDecryptModal}
        onClose={() => setShowDecryptModal(false)}
        email={email}
        onDecrypt={handleDecrypt}
        loading={isDecrypting}
      />
    </>
  );
}