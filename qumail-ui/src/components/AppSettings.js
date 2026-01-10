import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Alert,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Keyboard as KeyboardIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  RestartAlt as ResetIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material';

const AppSettings = ({ open, onClose, darkMode, onToggleTheme, userEmail }) => {
  // Settings state
  const [settings, setSettings] = useState({
    // General settings
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    
    // Appearance
    theme: darkMode ? 'dark' : 'light',
    density: 'comfortable', // compact, comfortable, spacious
    fontSize: 14,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    soundNotifications: true,
    desktopNotifications: true,
    
    // Email settings
    autoSaveDrafts: true,
    autoSaveInterval: 30, // seconds
    sendConfirmation: true,
    spellCheck: true,
    signature: `Sent from QuMail`,
    
    // Security
    autoEncrypt: false,
    defaultEncryptionLevel: 'medium',
    sessionTimeout: 30, // minutes
    twoFactorAuth: false,
    
    // Storage
    syncFrequency: 5, // minutes
    cacheEmails: true,
    maxCacheSize: 500, // MB
    autoCleanup: true,
    
    // Experimental
    enableBetaFeatures: false,
    useQuantumEncryption: true,
    performanceMode: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('qumail_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Detect changes
  useEffect(() => {
    const defaultSettings = {
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      theme: darkMode ? 'dark' : 'light',
      density: 'comfortable',
      fontSize: 14,
      emailNotifications: true,
      pushNotifications: false,
      soundNotifications: true,
      desktopNotifications: true,
      autoSaveDrafts: true,
      autoSaveInterval: 30,
      sendConfirmation: true,
      spellCheck: true,
      signature: `Sent from QuMail`,
      autoEncrypt: false,
      defaultEncryptionLevel: 'medium',
      sessionTimeout: 30,
      twoFactorAuth: false,
      syncFrequency: 5,
      cacheEmails: true,
      maxCacheSize: 500,
      autoCleanup: true,
      enableBetaFeatures: false,
      useQuantumEncryption: true,
      performanceMode: false
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(defaultSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, darkMode]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Special handling for theme changes
    if (key === 'theme' && onToggleTheme) {
      if (value === 'dark' && !darkMode) {
        onToggleTheme();
      } else if (value === 'light' && darkMode) {
        onToggleTheme();
      }
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        localStorage.setItem('qumail_settings', JSON.stringify(settings));
        
        setSaveMessage({
          type: 'success',
          text: 'Settings saved successfully!'
        });
        
        setHasUnsavedChanges(false);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setSaveMessage({ type: '', text: '' });
        }, 3000);
      } catch (error) {
        setSaveMessage({
          type: 'error',
          text: 'Failed to save settings: ' + error.message
        });
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleReset = () => {
    const defaultSettings = {
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      theme: darkMode ? 'dark' : 'light',
      density: 'comfortable',
      fontSize: 14,
      emailNotifications: true,
      pushNotifications: false,
      soundNotifications: true,
      desktopNotifications: true,
      autoSaveDrafts: true,
      autoSaveInterval: 30,
      sendConfirmation: true,
      spellCheck: true,
      signature: `Sent from QuMail`,
      autoEncrypt: false,
      defaultEncryptionLevel: 'medium',
      sessionTimeout: 30,
      twoFactorAuth: false,
      syncFrequency: 5,
      cacheEmails: true,
      maxCacheSize: 500,
      autoCleanup: true,
      enableBetaFeatures: false,
      useQuantumEncryption: true,
      performanceMode: false
    };
    
    setSettings(defaultSettings);
    setSaveMessage({
      type: 'info',
      text: 'Settings reset to defaults'
    });
    
    setTimeout(() => {
      setSaveMessage({ type: '', text: '' });
    }, 3000);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Settings sections
  const settingsSections = [
    {
      title: 'General',
      icon: <SettingsIcon />,
      description: 'Basic application settings',
      fields: [
        {
          key: 'language',
          label: 'Language',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
            { value: 'zh', label: 'Chinese' }
          ]
        },
        {
          key: 'timezone',
          label: 'Timezone',
          type: 'select',
          options: [
            { value: 'America/New_York', label: 'Eastern Time (ET)' },
            { value: 'America/Chicago', label: 'Central Time (CT)' },
            { value: 'America/Denver', label: 'Mountain Time (MT)' },
            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            { value: 'Europe/London', label: 'GMT (London)' },
            { value: 'Europe/Paris', label: 'CET (Paris)' },
            { value: 'Asia/Tokyo', label: 'JST (Tokyo)' }
          ]
        },
        {
          key: 'dateFormat',
          label: 'Date Format',
          type: 'select',
          options: [
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
          ]
        },
        {
          key: 'timeFormat',
          label: 'Time Format',
          type: 'select',
          options: [
            { value: '12h', label: '12-hour' },
            { value: '24h', label: '24-hour' }
          ]
        }
      ]
    },
    {
      title: 'Appearance',
      icon: <PaletteIcon />,
      description: 'Customize the look and feel',
      fields: [
        {
          key: 'theme',
          label: 'Theme',
          type: 'select',
          options: [
            { value: 'light', label: 'Light', icon: <LightIcon /> },
            { value: 'dark', label: 'Dark', icon: <DarkIcon /> },
            { value: 'auto', label: 'Auto (System)' }
          ]
        },
        {
          key: 'density',
          label: 'Density',
          type: 'select',
          options: [
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'spacious', label: 'Spacious' }
          ]
        },
        {
          key: 'fontSize',
          label: 'Font Size',
          type: 'slider',
          min: 12,
          max: 20,
          step: 1,
          unit: 'px'
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      description: 'Manage your notification preferences',
      fields: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          type: 'switch',
          description: 'Receive email notifications for new messages'
        },
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          type: 'switch',
          description: 'Enable browser push notifications'
        },
        {
          key: 'soundNotifications',
          label: 'Sound Notifications',
          type: 'switch',
          description: 'Play sound for new emails'
        },
        {
          key: 'desktopNotifications',
          label: 'Desktop Notifications',
          type: 'switch',
          description: 'Show desktop notifications'
        }
      ]
    },
    {
      title: 'Email',
      icon: <EmailIcon />,
      description: 'Email composition and behavior',
      fields: [
        {
          key: 'autoSaveDrafts',
          label: 'Auto-save Drafts',
          type: 'switch',
          description: 'Automatically save drafts while composing'
        },
        {
          key: 'autoSaveInterval',
          label: 'Auto-save Interval',
          type: 'slider',
          min: 5,
          max: 120,
          step: 5,
          unit: 'seconds',
          description: 'How often to auto-save drafts'
        },
        {
          key: 'sendConfirmation',
          label: 'Send Confirmation',
          type: 'switch',
          description: 'Ask for confirmation before sending'
        },
        {
          key: 'spellCheck',
          label: 'Spell Check',
          type: 'switch',
          description: 'Enable spell checking in emails'
        },
        {
          key: 'signature',
          label: 'Email Signature',
          type: 'textarea',
          description: 'Signature added to outgoing emails',
          rows: 3
        }
      ]
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      description: 'Security and privacy settings',
      fields: [
        {
          key: 'autoEncrypt',
          label: 'Auto-encrypt',
          type: 'switch',
          description: 'Automatically encrypt sensitive emails'
        },
        {
          key: 'defaultEncryptionLevel',
          label: 'Default Encryption Level',
          type: 'select',
          options: [
            { value: 'low', label: 'Low (Basic)' },
            { value: 'medium', label: 'Medium (Standard)' },
            { value: 'high', label: 'High (Maximum)' }
          ]
        },
        {
          key: 'sessionTimeout',
          label: 'Session Timeout',
          type: 'slider',
          min: 5,
          max: 120,
          step: 5,
          unit: 'minutes',
          description: 'Automatic logout after inactivity'
        },
        {
          key: 'twoFactorAuth',
          label: 'Two-Factor Authentication',
          type: 'switch',
          description: 'Enable 2FA for added security'
        }
      ]
    },
    {
      title: 'Storage & Sync',
      icon: <StorageIcon />,
      description: 'Data management and synchronization',
      fields: [
        {
          key: 'syncFrequency',
          label: 'Sync Frequency',
          type: 'slider',
          min: 1,
          max: 60,
          step: 1,
          unit: 'minutes',
          description: 'How often to sync with server'
        },
        {
          key: 'cacheEmails',
          label: 'Cache Emails',
          type: 'switch',
          description: 'Store emails locally for offline access'
        },
        {
          key: 'maxCacheSize',
          label: 'Max Cache Size',
          type: 'slider',
          min: 100,
          max: 2000,
          step: 100,
          unit: 'MB',
          description: 'Maximum local storage for emails'
        },
        {
          key: 'autoCleanup',
          label: 'Auto Cleanup',
          type: 'switch',
          description: 'Automatically remove old cached emails'
        }
      ]
    }
  ];

  const renderField = (field) => {
    const value = settings[field.key];
    
    switch (field.type) {
      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value}
                onChange={(e) => handleSettingChange(field.key, e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">{field.label}</Typography>
                {field.description && (
                  <Typography variant="caption" color="text.secondary">
                    {field.description}
                  </Typography>
                )}
              </Box>
            }
            sx={{ width: '100%', ml: 0 }}
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
            >
              {field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {field.description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {field.description}
              </Typography>
            )}
          </FormControl>
        );
        
      case 'slider':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body1">{field.label}</Typography>
              <Typography variant="body2" color="primary">
                {value} {field.unit}
              </Typography>
            </Box>
            <Slider
              value={value}
              onChange={(e, newValue) => handleSettingChange(field.key, newValue)}
              min={field.min}
              max={field.max}
              step={field.step}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} ${field.unit}`}
            />
            {field.description && (
              <Typography variant="caption" color="text.secondary">
                {field.description}
              </Typography>
            )}
          </Box>
        );
        
      case 'textarea':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              {field.label}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={field.rows || 3}
              value={value}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              size="small"
            />
            {field.description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {field.description}
              </Typography>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h6" fontWeight="600">
              App Settings
            </Typography>
            {hasUnsavedChanges && (
              <Chip
                label="Unsaved Changes"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure your QuMail experience
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {saveMessage.text && (
          <Alert 
            severity={saveMessage.type} 
            sx={{ mb: 2 }}
            onClose={() => setSaveMessage({ type: '', text: '' })}
          >
            {saveMessage.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {settingsSections.map((section, index) => (
            <Grid item xs={12} md={6} key={section.title}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'primary.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {section.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {section.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {section.fields.map((field) => (
                    <Box key={field.key}>
                      {renderField(field)}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Advanced Settings Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: 2,
            mt: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <CloudIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="600">
              Advanced Settings
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableBetaFeatures}
                    onChange={(e) => handleSettingChange('enableBetaFeatures', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Beta Features</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable experimental features
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.useQuantumEncryption}
                    onChange={(e) => handleSettingChange('useQuantumEncryption', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Quantum Encryption</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use quantum-safe encryption algorithms
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performanceMode}
                    onChange={(e) => handleSettingChange('performanceMode', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Performance Mode</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Optimize for speed over visual effects
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Current Settings Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Current Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={`Theme: ${settings.theme}`} size="small" variant="outlined" />
            <Chip label={`Language: ${settings.language}`} size="small" variant="outlined" />
            <Chip label={`Timezone: ${settings.timezone}`} size="small" variant="outlined" />
            <Chip label={`Encryption: ${settings.defaultEncryptionLevel}`} size="small" variant="outlined" />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button
            startIcon={<ResetIcon />}
            onClick={handleReset}
            disabled={isSaving}
            variant="outlined"
          >
            Reset to Defaults
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={isSaving ? null : <SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AppSettings;