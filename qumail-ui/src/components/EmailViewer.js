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
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  Reply,
  ReplyAll,
  Forward,
  Delete,
  Archive,
  Star,
  StarBorder,
  LabelImportant,
  LabelImportantOutlined,
  MoreVert,
  Person,
  Lock,
  FlashOn,
  Mail,
  AttachFile,
  Download,
  Security,
  VerifiedUser,
  AccessTime,
  Error,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Print
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
    
    // Handle different date formats
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Try parsing as ISO string or timestamp
      date = new Date(dateInput);
      
      // If it's a timestamp string
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
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Relative time
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Format: MMM D, YYYY
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
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
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
  userEmail,
  userPassword,
  isLoading,
  isEncrypting = false,
  onDecryptEmail
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [expanded, setExpanded] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [attachments] = useState([]);
  const [isStarred, setIsStarred] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [showDecrypted, setShowDecrypted] = useState(false);

  // Extract email data with safe defaults
  const emailData = email || {};
  const {
    from = '',
    to = '',
    subject = 'No Subject',
    date = new Date(),
    body = '',
    encryptedBody = '',
    iv = '',
    key = '',
    security = 'none',
    mode = 'none',
    cc = [],
    bcc = [],
    headers = {},
    flags = [],
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

  // Determine security level
  const securityLevel = security || mode || 
    (typeof body === 'string' && body.includes('[otp|') ? 'otp' : 
     typeof body === 'string' && body.includes('[aes|') ? 'aes' : 'none');
  
  // Security configuration
  const securityConfig = {
    otp: {
      label: 'Quantum OTP',
      icon: <Lock sx={{ fontSize: 16 }} />,
      color: 'error',
      description: 'One-Time Pad - Maximum Security',
      badgeColor: theme.palette.error.main,
    },
    aes: {
      label: 'Quantum AES',
      icon: <FlashOn sx={{ fontSize: 16 }} />,
      color: 'success',
      description: 'AES-256 - Fast & Secure',
      badgeColor: theme.palette.success.main,
    },
    AES: {
      label: 'Quantum AES',
      icon: <FlashOn sx={{ fontSize: 16 }} />,
      color: 'success',
      description: 'AES-256 - Fast & Secure',
      badgeColor: theme.palette.success.main,
    },
    none: {
      label: 'Standard',
      icon: <Mail sx={{ fontSize: 16 }} />,
      color: 'default',
      description: 'No Encryption',
      badgeColor: theme.palette.grey[500],
    },
  };

  const currentSecurity = securityConfig[securityLevel.toLowerCase()] || securityConfig.none;

  // Format dates safely
  const formattedDate = formatDateSafe(date);
  const formattedTime = formatTime(date);

  // SIMPLIFIED: Set decrypted content from email body (already decrypted by backend)
  useEffect(() => {
    if (!email) return;

    // Backend already sends decrypted body
    setDecryptedContent(email.body || '');
    setIsDecrypting(false);
  }, [email]);

  // Toggle expanded view
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Handle star toggle
  const handleStarToggle = () => {
    const newStarredState = !isStarred;
    setIsStarred(newStarredState);
    if (onToggleStar && email?.id) onToggleStar(email.id, newStarredState);
  };

  // Handle important toggle
  const handleImportantToggle = () => {
    const newImportantState = !isImportant;
    setIsImportant(newImportantState);
    if (onToggleImportant && email?.id) onToggleImportant(email.id, newImportantState);
  };

  // Initialize starred/important states from email flags
  useEffect(() => {
    if (email) {
      setIsStarred(flags?.includes('starred') || false);
      setIsImportant(flags?.includes('important') || false);
    }
  }, [email, flags]);

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
                  <AttachFile />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={attachment.name || `Attachment ${index + 1}`}
                secondary={attachment.size || ''}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <Tooltip title="Download">
                <IconButton size="small">
                  <Download />
                </IconButton>
              </Tooltip>
            </AttachmentItem>
          ))}
        </List>
      </Box>
    );
  };

  // Render security information
  const renderSecurityInfo = () => (
    <Alert
      severity={securityLevel === 'otp' ? 'info' : securityLevel === 'aes' ? 'success' : 'warning'}
      icon={securityLevel === 'otp' ? <VerifiedUser /> : securityLevel === 'aes' ? <Security /> : <Error />}
      sx={{ mb: 3, borderRadius: 2 }}
    >
      <Typography variant="subtitle2" fontWeight="600">
        {securityLevel === 'otp' ? 'Maximum Security' : securityLevel === 'aes' ? 'Secure Transmission' : 'Unencrypted Message'}
      </Typography>
      <Typography variant="body2">
        {securityLevel === 'otp' 
          ? 'This message was encrypted with Quantum One-Time Pad encryption. The encryption key was used only once and provides perfect secrecy.'
          : securityLevel === 'aes'
          ? 'This message was encrypted with Quantum-resistant AES-256 encryption. Your message was protected during transmission.'
          : 'This message was sent without encryption. Consider using encryption for sensitive information.'}
      </Typography>
    </Alert>
  );

  // Render loading state
  if (isLoading) {
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
        <Mail sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
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
    <StyledPaper>
      {/* Header with navigation */}
      <HeaderContainer>
        {/* Top toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {onBack && (
              <Tooltip title="Back to inbox">
                <IconButton onClick={onBack} size="small">
                  <ArrowBack />
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
                {isStarred ? <Star sx={{ color: theme.palette.warning.main }} /> : <StarBorder />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isImportant ? "Mark as not important" : "Mark as important"}>
              <IconButton size="small" onClick={handleImportantToggle}>
                {isImportant ? <LabelImportant sx={{ color: theme.palette.warning.main }} /> : <LabelImportantOutlined />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More options">
              <IconButton size="small">
                <MoreVert />
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
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
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
          startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          onClick={handleToggleExpand}
          sx={{ mt: 1 }}
        >
          {expanded ? 'Show less' : 'Show details'}
        </Button>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Reply />}
            onClick={() => onReply && onReply(email)}
            size="small"
            disabled={isDecrypting}
          >
            Reply
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReplyAll />}
            onClick={() => onReplyAll && onReplyAll(email)}
            size="small"
            disabled={isDecrypting}
          >
            Reply All
          </Button>
          <Button
            variant="outlined"
            startIcon={<Forward />}
            onClick={() => onForward && onForward(email)}
            size="small"
            disabled={isDecrypting}
          >
            Forward
          </Button>
          <Button
            variant="outlined"
            startIcon={<Archive />}
            onClick={() => onArchive && email?.id && onArchive(email.id)}
            size="small"
            disabled={isDecrypting}
          >
            Archive
          </Button>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={() => onDelete && email?.id && onDelete(email.id)}
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
        {/* Decryption status */}
        {isDecrypting && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Decrypting secure message...
            </Typography>
          </Box>
        )}

        {/* Security info */}
        {securityLevel !== 'none' && renderSecurityInfo()}

        {/* Email body */}
        <Box sx={{ 
          whiteSpace: 'pre-wrap',
          fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          lineHeight: 1.8,
          fontSize: '1rem',
          color: 'text.primary',
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'underline',
          }
        }}>
          {decryptedContent}
        </Box>

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
          Message ID: {email?.id || 'N/A'} • {securityLevel.toUpperCase()}
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Reply />}
            onClick={() => onReply && onReply(email)}
            size="small"
          >
            Reply
          </Button>
          <Button
            variant="outlined"
            startIcon={<Forward />}
            onClick={() => onForward && onForward(email)}
            size="small"
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
  );
}