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
  ListItemText
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
  VpnKey, // Use VpnKey instead of Encrypted
  History // For Recent Security Activity
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

export default function SecuritySettings({ 
  user, 
  onGenerateKeys, 
  onUpdateSecurity,
  encryptionStatus,
  loading = false 
}) {
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

  useEffect(() => {
    if (user?.settings) {
      setSecuritySettings({
        defaultEncryption: user.settings.defaultEncryption || 'otp',
        requireEncryption: user.settings.requireEncryption || false,
        autoEncryptDrafts: user.settings.autoEncryptDrafts !== false,
        sessionTimeout: user.settings.sessionTimeout || 30,
        twoFactorEnabled: user.settings.twoFactorEnabled || false,
        loginAlerts: user.settings.loginAlerts !== false,
        suspiciousActivityAlerts: user.settings.suspiciousActivityAlerts !== false
      });
    }
  }, [user]);

  const handleRegenerateKey = async () => {
    try {
      if (onGenerateKeys) {
        await onGenerateKeys(selectedAlgorithm);
        setMessage({ 
          type: 'success', 
          text: `${selectedAlgorithm.toUpperCase()} key regenerated successfully!` 
        });
        setRegenerateDialog(false);
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to regenerate key' });
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (onUpdateSecurity) {
        await onUpdateSecurity(securitySettings);
        setMessage({ type: 'success', text: 'Security settings updated successfully!' });
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key)
      .then(() => {
        setMessage({ type: 'success', text: 'Key copied to clipboard!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      })
      .catch(err => {
        setMessage({ type: 'error', text: 'Failed to copy key' });
      });
  };

  const getSecurityScore = () => {
    let score = 0;
    if (encryptionStatus?.hasOTPKey) score += 30;
    if (encryptionStatus?.hasAESKey) score += 20;
    if (securitySettings.requireEncryption) score += 20;
    if (securitySettings.twoFactorEnabled) score += 30;
    
    if (score >= 80) return { level: 'high', label: 'Excellent' };
    if (score >= 60) return { level: 'medium', label: 'Good' };
    return { level: 'low', label: 'Needs Improvement' };
  };

  const securityScore = getSecurityScore();

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
                {securityScore.level === 'high' ? 'A+' : 
                 securityScore.level === 'medium' ? 'B' : 'C'}
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
                    {encryptionStatus?.hasOTPKey ? 
                      <CheckCircle color="success" /> : 
                      <ErrorIcon color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="OTP Key" 
                    secondary={encryptionStatus?.hasOTPKey ? 
                      `Configured (${encryptionStatus.otpKeyLength || 0} chars)` : 
                      "Not configured"
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {encryptionStatus?.hasAESKey ? 
                      <CheckCircle color="success" /> : 
                      <ErrorIcon color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="AES-256 Key" 
                    secondary={encryptionStatus?.hasAESKey ? 
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
                {!encryptionStatus?.hasOTPKey && (
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
                onClick={() => setRegenerateDialog(true)}
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
                  borderColor: encryptionStatus?.hasOTPKey ? 'success.main' : 'divider',
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

                {encryptionStatus?.hasOTPKey ? (
                  <>
                    <TextField
                      fullWidth
                      type={showOTPKey ? 'text' : 'password'}
                      value={encryptionStatus.otpKeyPreview || '••••••••••••••••'}
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
                                onClick={() => handleCopyKey(encryptionStatus.otpKeyFull || '')}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Key length: {encryptionStatus.otpKeyLength || 0} characters
                    </Typography>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      setSelectedAlgorithm('otp');
                      setRegenerateDialog(true);
                    }}
                    sx={{ mt: 1 }}
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
                  borderColor: encryptionStatus?.hasAESKey ? 'success.main' : 'divider',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <VpnKey color="primary" /> {/* Changed from Encrypted to VpnKey */}
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

                {encryptionStatus?.hasAESKey ? (
                  <>
                    <TextField
                      fullWidth
                      type={showAESKey ? 'text' : 'password'}
                      value={encryptionStatus.aesKeyPreview || '••••••••••••••••'}
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
                                onClick={() => handleCopyKey(encryptionStatus.aesKeyFull || '')}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Key length: {encryptionStatus.aesKeyLength || 0} characters
                    </Typography>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      setSelectedAlgorithm('aes256');
                      setRegenerateDialog(true);
                    }}
                    sx={{ mt: 1 }}
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
            <History fontSize="small" /> {/* Changed from Security to History */}
            <Typography variant="h6" fontWeight="600">
              Recent Security Activity
            </Typography>
          </SectionHeader>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your account security events will appear here
          </Typography>

          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No security events to display
            </Typography>
          </Paper>
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
    </Box>
  );
}