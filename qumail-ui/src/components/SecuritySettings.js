import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';
import {
  Security,
  Lock,
  Key,
  Refresh,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Delete,
  Add,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  LockReset,
  VpnKey,
  History
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Mock encryption service
const mockEncryptionService = {
  generateKey: async (algorithm, length = 32) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return {
      key,
      algorithm,
      generatedAt: new Date().toISOString(),
      length: key.length
    };
  },
  
  encryptData: async (data, key, algorithm) => {
    // Simulate encryption
    await new Promise(resolve => setTimeout(resolve, 500));
    return `encrypted_${algorithm}_${btoa(data).slice(0, 10)}`;
  },
  
  decryptData: async (encryptedData, key, algorithm) => {
    // Simulate decryption
    await new Promise(resolve => setTimeout(resolve, 500));
    return 'Decrypted content would appear here';
  }
};

// Mock user service
const mockUserService = {
  saveSecuritySettings: async (userId, settings) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Save to localStorage for demo
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.settings = { ...userData.settings, ...settings };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return { success: true, updatedAt: new Date().toISOString() };
  },
  
  getSecurityLogs: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    return logs.filter(log => log.userId === userId);
  },
  
  addSecurityLog: async (log) => {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    logs.unshift({
      ...log,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 logs
    const trimmedLogs = logs.slice(0, 50);
    localStorage.setItem('securityLogs', JSON.stringify(trimmedLogs));
    
    return { success: true };
  }
};

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SecurityBadge = styled(Chip)(({ theme, level }) => ({
  fontWeight: 600,
  ...(level === 'high' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  }),
  ...(level === 'medium' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(level === 'low' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
}));

const ActivityLog = styled(ListItem)(({ theme, type }) => ({
  padding: theme.spacing(1.5),
  borderLeft: `4px solid ${type === 'success' ? theme.palette.success.main : 
    type === 'warning' ? theme.palette.warning.main : 
    type === 'error' ? theme.palette.error.main : 
    theme.palette.info.main}`,
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export default function SecuritySettings({ userId = 'user123' }) {
  const [showOTPKey, setShowOTPKey] = useState(false);
  const [showAESKey, setShowAESKey] = useState(false);
  const [regenerateDialog, setRegenerateDialog] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('otp');
  const [securitySettings, setSecuritySettings] = useState({
    defaultEncryption: 'otp',
    requireEncryption: false,
    autoEncryptDrafts: true,
    sessionTimeout: 30,
    twoFactorEnabled: false,
    loginAlerts: true,
    suspiciousActivityAlerts: true
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [encryptionKeys, setEncryptionKeys] = useState({
    otp: null,
    aes256: null
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadUserData();
    loadSecurityLogs();
  }, []);

  const loadUserData = async () => {
    try {
      // Load from localStorage for demo
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (userData.settings) {
        setSecuritySettings(prev => ({
          ...prev,
          ...userData.settings
        }));
      }

      // Load encryption keys
      const storedKeys = JSON.parse(localStorage.getItem(`encryptionKeys_${userId}`) || '{}');
      setEncryptionKeys(storedKeys);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const logs = await mockUserService.getSecurityLogs(userId);
      setSecurityLogs(logs);
    } catch (error) {
      console.error('Failed to load security logs:', error);
    }
  };

  const addSecurityLog = async (action, details, type = 'info') => {
    await mockUserService.addSecurityLog({
      userId,
      action,
      details,
      type
    });
    loadSecurityLogs(); // Refresh logs
  };

  const handleRegenerateKey = async () => {
    setLoading(true);
    try {
      // Generate new key
      const result = await mockEncryptionService.generateKey(
        selectedAlgorithm,
        selectedAlgorithm === 'otp' ? 64 : 32
      );

      // Save key to state and localStorage
      const newKeys = {
        ...encryptionKeys,
        [selectedAlgorithm]: {
          key: result.key,
          algorithm: result.algorithm,
          generatedAt: result.generatedAt,
          length: result.length,
          preview: '••••••••••••••••' // Never store full key in preview
        }
      };
      
      setEncryptionKeys(newKeys);
      localStorage.setItem(`encryptionKeys_${userId}`, JSON.stringify(newKeys));

      // Log the action
      await addSecurityLog(
        'KEY_REGENERATED',
        `${selectedAlgorithm.toUpperCase()} key regenerated`,
        'warning'
      );

      // Show success message
      setMessage({ 
        type: 'success', 
        text: `${selectedAlgorithm.toUpperCase()} key regenerated successfully!` 
      });
      setRegenerateDialog(false);
      setShowSnackbar(true);
      setSnackbarMessage('Key regenerated successfully!');
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to regenerate key' });
      setSnackbarMessage('Failed to regenerate key');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (algorithm) => {
    setLoading(true);
    try {
      const result = await mockEncryptionService.generateKey(
        algorithm,
        algorithm === 'otp' ? 64 : 32
      );

      const newKeys = {
        ...encryptionKeys,
        [algorithm]: {
          key: result.key,
          algorithm: result.algorithm,
          generatedAt: result.generatedAt,
          length: result.length,
          preview: '••••••••••••••••'
        }
      };
      
      setEncryptionKeys(newKeys);
      localStorage.setItem(`encryptionKeys_${userId}`, JSON.stringify(newKeys));

      await addSecurityLog(
        'KEY_GENERATED',
        `${algorithm.toUpperCase()} key generated`,
        'success'
      );

      setMessage({ 
        type: 'success', 
        text: `${algorithm.toUpperCase()} key generated successfully!` 
      });
      setShowSnackbar(true);
      setSnackbarMessage('Key generated successfully!');
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to generate key' });
      setSnackbarMessage('Failed to generate key');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await mockUserService.saveSecuritySettings(userId, securitySettings);
      
      await addSecurityLog(
        'SETTINGS_UPDATED',
        'Security settings updated',
        'info'
      );

      setMessage({ type: 'success', text: 'Security settings updated successfully!' });
      setShowSnackbar(true);
      setSnackbarMessage('Settings saved successfully!');
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
      setSnackbarMessage('Failed to save settings');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setSnackbarMessage('Key copied to clipboard!');
      setShowSnackbar(true);
      
      await addSecurityLog(
        'KEY_COPIED',
        'Encryption key copied to clipboard',
        'warning'
      );
    } catch (err) {
      setSnackbarMessage('Failed to copy key');
      setShowSnackbar(true);
    }
  };

  const handleDeleteKey = async (algorithm) => {
    if (!window.confirm(`Are you sure you want to delete your ${algorithm.toUpperCase()} key? All data encrypted with this key will become unreadable!`)) {
      return;
    }

    setLoading(true);
    try {
      const newKeys = { ...encryptionKeys };
      delete newKeys[algorithm];
      
      setEncryptionKeys(newKeys);
      localStorage.setItem(`encryptionKeys_${userId}`, JSON.stringify(newKeys));

      await addSecurityLog(
        'KEY_DELETED',
        `${algorithm.toUpperCase()} key deleted`,
        'error'
      );

      setMessage({ type: 'success', text: `${algorithm.toUpperCase()} key deleted successfully!` });
      setShowSnackbar(true);
      setSnackbarMessage('Key deleted successfully!');
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete key' });
      setSnackbarMessage('Failed to delete key');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (encryptionKeys.otp) score += 30;
    if (encryptionKeys.aes256) score += 20;
    if (securitySettings.requireEncryption) score += 20;
    if (securitySettings.twoFactorEnabled) score += 30;
    
    if (score >= 80) return { level: 'high', label: 'Excellent', score: 'A+' };
    if (score >= 60) return { level: 'medium', label: 'Good', score: 'B' };
    return { level: 'low', label: 'Needs Improvement', score: 'C' };
  };

  const getEncryptionStatus = () => ({
    hasOTPKey: !!encryptionKeys.otp,
    hasAESKey: !!encryptionKeys.aes256,
    otpKeyLength: encryptionKeys.otp?.length || 0,
    aesKeyLength: encryptionKeys.aes256?.length || 0,
    otpKeyPreview: encryptionKeys.otp?.preview,
    aesKeyPreview: encryptionKeys.aes256?.preview
  });

  const securityScore = getSecurityScore();
  const encryptionStatus = getEncryptionStatus();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <Security color="info" />;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          Security Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage encryption keys and security preferences
        </Typography>
      </Box>

      {/* Message Alert */}
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Security Score Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Security fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Security Overview
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityBadge 
                label={securityScore.label} 
                level={securityScore.level}
              />
              <Typography variant="h4" fontWeight="700">
                {securityScore.score}
              </Typography>
            </Box>
          </SectionHeader>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Encryption Status
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {encryptionStatus.hasOTPKey ? 
                      <CheckCircle color="success" /> : 
                      <ErrorIcon color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="OTP Key" 
                    secondary={encryptionStatus.hasOTPKey ? 
                      `Configured (${encryptionStatus.otpKeyLength || 0} chars)` : 
                      "Not configured"
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {encryptionStatus.hasAESKey ? 
                      <CheckCircle color="success" /> : 
                      <ErrorIcon color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="AES-256 Key" 
                    secondary={encryptionStatus.hasAESKey ? 
                      `Configured (${encryptionStatus.aesKeyLength || 0} chars)` : 
                      "Not configured"
                    }
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recommendations
              </Typography>
              <List dense>
                {!encryptionStatus.hasOTPKey && (
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Generate OTP key" 
                      secondary="For maximum security emails"
                    />
                  </ListItem>
                )}
                {!securitySettings.twoFactorEnabled && (
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Enable 2FA" 
                      secondary="Add an extra layer of security"
                    />
                  </ListItem>
                )}
                {!securitySettings.requireEncryption && (
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Require encryption" 
                      secondary="Ensure all emails are encrypted"
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Encryption Keys Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Key fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Encryption Keys
            </Typography>
            <Tooltip title="Regenerate All Keys">
              <IconButton 
                size="small" 
                onClick={() => {
                  setSelectedAlgorithm('otp');
                  setRegenerateDialog(true);
                }}
                sx={{ ml: 'auto' }}
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </SectionHeader>

          <Grid container spacing={3}>
            {/* OTP Key */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: encryptionStatus.hasOTPKey ? 'success.main' : 'divider',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Lock color="primary" />
                  <Typography variant="subtitle1" fontWeight="600">
                    OTP (One-Time Pad)
                  </Typography>
                  <Chip 
                    label="Maximum Security" 
                    size="small" 
                    color="error" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Perfect secrecy encryption. Each key is used only once.
                </Typography>

                {encryptionStatus.hasOTPKey ? (
                  <>
                    <TextField
                      fullWidth
                      type={showOTPKey ? 'text' : 'password'}
                      value={showOTPKey ? encryptionKeys.otp?.key || '' : encryptionStatus.otpKeyPreview}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Box>
                            <Tooltip title={showOTPKey ? "Hide" : "Show"}>
                              <IconButton 
                                size="small" 
                                onClick={() => setShowOTPKey(!showOTPKey)}
                              >
                                {showOTPKey ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy">
                              <IconButton 
                                size="small"
                                onClick={() => handleCopyKey(encryptionKeys.otp?.key || '')}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small"
                                onClick={() => handleDeleteKey('otp')}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }}
                      size="small"
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Key length: {encryptionStatus.otpKeyLength} characters
                      </Typography>
                      {encryptionKeys.otp?.generatedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Generated: {formatDate(encryptionKeys.otp.generatedAt)}
                        </Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleGenerateKey('otp')}
                    sx={{ mt: 1 }}
                    disabled={loading}
                  >
                    Generate OTP Key
                  </Button>
                )}
              </Paper>
            </Grid>

            {/* AES Key */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: encryptionStatus.hasAESKey ? 'success.main' : 'divider',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <VpnKey color="primary" />
                  <Typography variant="subtitle1" fontWeight="600">
                    AES-256
                  </Typography>
                  <Chip 
                    label="Fast & Secure" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Military-grade encryption. Fast performance for everyday use.
                </Typography>

                {encryptionStatus.hasAESKey ? (
                  <>
                    <TextField
                      fullWidth
                      type={showAESKey ? 'text' : 'password'}
                      value={showAESKey ? encryptionKeys.aes256?.key || '' : encryptionStatus.aesKeyPreview}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Box>
                            <Tooltip title={showAESKey ? "Hide" : "Show"}>
                              <IconButton 
                                size="small" 
                                onClick={() => setShowAESKey(!showAESKey)}
                              >
                                {showAESKey ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy">
                              <IconButton 
                                size="small"
                                onClick={() => handleCopyKey(encryptionKeys.aes256?.key || '')}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small"
                                onClick={() => handleDeleteKey('aes256')}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }}
                      size="small"
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Key length: {encryptionStatus.aesKeyLength} characters
                      </Typography>
                      {encryptionKeys.aes256?.generatedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Generated: {formatDate(encryptionKeys.aes256.generatedAt)}
                        </Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleGenerateKey('aes256')}
                    sx={{ mt: 1 }}
                    disabled={loading}
                  >
                    Generate AES Key
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Security Preferences Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <LockReset fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Security Preferences
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveSettings}
              disabled={loading}
              sx={{ ml: 'auto' }}
            >
              {loading ? <CircularProgress size={20} /> : 'Save Settings'}
            </Button>
          </SectionHeader>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Default Encryption</InputLabel>
                <Select
                  value={securitySettings.defaultEncryption}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings, 
                    defaultEncryption: e.target.value
                  })}
                  label="Default Encryption"
                >
                  <MenuItem value="otp">OTP (Maximum Security)</MenuItem>
                  <MenuItem value="aes256">AES-256 (Fast & Secure)</MenuItem>
                  <MenuItem value="none">None (Unencrypted)</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.requireEncryption}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings, 
                      requireEncryption: e.target.checked
                    })}
                  />
                }
                label={
                  <Box>
                    <Typography>Require Encryption</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Block sending unencrypted emails
                    </Typography>
                  </Box>
                }
                sx={{ mt: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.autoEncryptDrafts}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings, 
                      autoEncryptDrafts: e.target.checked
                    })}
                  />
                }
                label={
                  <Box>
                    <Typography>Auto-encrypt Drafts</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Encrypt drafts automatically
                    </Typography>
                  </Box>
                }
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Session Timeout</InputLabel>
                <Select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings, 
                    sessionTimeout: e.target.value
                  })}
                  label="Session Timeout"
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                  <MenuItem value={0}>Never</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings, 
                      twoFactorEnabled: e.target.checked
                    })}
                  />
                }
                label={
                  <Box>
                    <Typography>Two-Factor Authentication</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Require 2FA for login
                    </Typography>
                  </Box>
                }
                sx={{ mt: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings, 
                      loginAlerts: e.target.checked
                    })}
                  />
                }
                label={
                  <Box>
                    <Typography>Login Alerts</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Email notifications for new logins
                    </Typography>
                  </Box>
                }
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Security History Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <History fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Recent Security Activity
            </Typography>
          </SectionHeader>

          {securityLogs.length > 0 ? (
            <List dense>
              {securityLogs.slice(0, 5).map((log) => (
                <ActivityLog key={log.id} type={log.type}>
                  <ListItemIcon>
                    {getLogIcon(log.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.action.replace(/_/g, ' ')}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {log.details}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDate(log.timestamp)}
                        </Typography>
                      </>
                    }
                  />
                </ActivityLog>
              ))}
            </List>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your account security events will appear here
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  No security events to display
                </Typography>
              </Paper>
            </>
          )}
        </CardContent>
      </StyledCard>

      {/* Regenerate Key Dialog */}
      <Dialog
        open={regenerateDialog}
        onClose={() => setRegenerateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Regenerate Encryption Key
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Warning: Regenerating your {selectedAlgorithm.toUpperCase()} key will make all 
            previously encrypted emails with this key unreadable! This action cannot be undone.
          </Alert>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Algorithm</InputLabel>
            <Select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              label="Select Algorithm"
            >
              <MenuItem value="otp">OTP (One-Time Pad)</MenuItem>
              <MenuItem value="aes256">AES-256</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Make sure you have backed up any important encrypted emails before proceeding.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegenerateKey}
            variant="contained"
            color="warning"
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            disabled={loading}
          >
            {loading ? 'Regenerating...' : 'Regenerate Key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

// Optional: Add default props and propTypes
SecuritySettings.defaultProps = {
  userId: 'user123'
};