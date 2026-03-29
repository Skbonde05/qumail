// src/components/DecryptModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Key as KeyIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  EnhancedEncryption as EnhancedEncryptionIcon
} from '@mui/icons-material';

// Encryption label helper
const getEncryptionLabel = (encryptionLevel) => {
  switch (encryptionLevel) {
    case 'aes256':
      return {
        text: 'AES',
        color: 'primary',
        icon: '',
        description: 'Quantum AES-256 Encrypted',
        fullName: 'Advanced Encryption Standard (AES-256-GCM)'
      };
    case 'otp':
      return {
        text: 'OTP',
        color: 'error',
        icon: '',
        description: 'Quantum OTP Encrypted',
        fullName: 'One-Time Pad Encryption'
      };
    case 'none':
    default:
      return {
        text: 'STANDARD',
        color: 'default',
        icon: '',
        description: 'Standard Email',
        fullName: 'Unencrypted Email'
      };
  }
};

const DecryptModal = ({ open, onClose, email, onDecrypt, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [otpKey, setOtpKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const encryptionLabel = getEncryptionLabel(email?.encryptionLevel);

  const handleDecrypt = () => {
    if (email?.encryptionLevel === 'otp' && !otpKey.trim()) {
      return;
    }
    
    // Call onDecrypt with email ID and key
    onDecrypt(email?.uid, otpKey || null);
  };

  const handleCopyOTPKey = () => {
    // In a real app, this would copy from secure storage
    navigator.clipboard.writeText(otpKey || 'DEMO_OTP_KEY_PLACEHOLDER')
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  const getInstructions = () => {
    switch (email?.encryptionLevel) {
      case 'aes256':
        return "This email is encrypted with AES-256-GCM. Click 'Decrypt' to automatically decrypt and view the original message. Your encryption keys are managed securely by QuMail.";
      case 'otp':
        return "This email is encrypted with One-Time Pad (OTP) - the only mathematically proven unbreakable encryption. You need the OTP key to decrypt it. The sender should have shared this key with you through a secure channel.";
      default:
        return "This email is not encrypted.";
    }
  };

  const getSecurityFeatures = () => {
    switch (email?.encryptionLevel) {
      case 'aes256':
        return [
          "256-bit encryption key",
          "Galois/Counter Mode (GCM) for authentication",
          "Quantum-resistant algorithm",
          "Automatic key management"
        ];
      case 'otp':
        return [
          "Mathematically unbreakable",
          "Key used only once",
          "Perfect secrecy",
          "Key length equals message length"
        ];
      default:
        return ["No encryption applied"];
    }
  };

  if (!email) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                backgroundColor: `${encryptionLabel.color}.light`,
                color: `${encryptionLabel.color}.dark`,
                borderRadius: 1,
                p: 0.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {encryptionLabel.icon === '' ? (
                <EnhancedEncryptionIcon />
              ) : encryptionLabel.icon === '' ? (
                <SecurityIcon />
              ) : (
                <LockIcon />
              )}
            </Box>
            <Box>
              <Typography variant="h6" component="div">
                Decrypt {encryptionLabel.text} Email
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {encryptionLabel.fullName}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {/* Email Info Card */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              EMAIL DETAILS
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {email.subject || '(No Subject)'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  From: {email.from}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date: {email.date}
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: `${encryptionLabel.color}.50`,
                  color: `${encryptionLabel.color}.800`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  border: `1px solid ${encryptionLabel.color}.200`
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {encryptionLabel.text}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert 
          severity="info"
          icon={false}
          sx={{ 
            mb: 3,
            backgroundColor: 'info.50',
            border: '1px solid',
            borderColor: 'info.200'
          }}
        >
          <Typography variant="body2">
            {getInstructions()}
          </Typography>
        </Alert>

        {/* Security Features */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            SECURITY FEATURES
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {getSecurityFeatures().map((feature, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: `${encryptionLabel.color}.100`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckIcon sx={{ fontSize: 12, color: `${encryptionLabel.color}.main` }} />
                </Box>
                <Typography variant="body2">
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* OTP Key Input (only for OTP) */}
        {email.encryptionLevel === 'otp' && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              ENTER OTP KEY
            </Typography>
            <TextField
              fullWidth
              placeholder="Paste the OTP key provided by the sender"
              value={otpKey}
              onChange={(e) => setOtpKey(e.target.value)}
              size="small"
              type={showKey ? "text" : "password"}
              helperText="The OTP key should be exactly as provided by the sender (hex format)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowKey(!showKey)}
                      edge="end"
                    >
                      {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Box mt={1} display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Don't have the key? Contact the sender through a secure channel.
              </Typography>
              <Button
                size="small"
                startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                onClick={handleCopyOTPKey}
                variant="outlined"
                disabled={!otpKey}
              >
                {copied ? 'Copied' : 'Copy Key'}
              </Button>
            </Box>
          </Box>
        )}

        {/* AES Auto-decrypt notice */}
        {email.encryptionLevel === 'aes256' && (
          <Alert 
            severity="success"
            icon={<EnhancedEncryptionIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              AES decryption is automatic. Your keys are securely managed by QuMail's quantum-safe infrastructure.
            </Typography>
          </Alert>
        )}

        {/* Decryption Status */}
        {email.decrypted && (
          <Alert 
            severity="success"
            icon={<CheckIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              This email has already been decrypted. The original message is displayed below.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDecrypt}
          variant={email?.encryptionLevel === 'otp' ? "outlined" : "contained"}
          color={encryptionLabel.color}
          disabled={
            loading || 
            (email?.encryptionLevel === 'otp' && !otpKey.trim()) ||
            email?.decrypted
          }
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <LockOpenIcon />
            )
          }
          sx={{
            minWidth: '120px',
            ...(email?.encryptionLevel === 'otp' && {
              borderWidth: '2px',
              fontWeight: 700,
              '&:hover': { borderWidth: '2px' }
            })
          }}
        >
          {loading ? 'Decrypting...' : 'Decrypt Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DecryptModal;