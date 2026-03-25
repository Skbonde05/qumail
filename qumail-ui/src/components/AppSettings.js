// src/components/AppSettings.js
import React, { useState, useEffect } from 'react';
import {
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
  CardContent,
  InputAdornment,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  RadioGroup,
  Radio,
  FormLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress
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
  Brightness7 as LightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  Speed as SpeedIcon,
  CloudDownload as CloudDownloadIcon,
  VpnKey as VpnKeyIcon,
  PaletteOutlined as PaletteOutlinedIcon,
  Translate as TranslateIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Memory as MemoryIcon,
  Bolt as BoltIcon,
  DataUsage as DataUsageIcon,
  AutoAwesome as AutoAwesomeIcon,
  Science as ScienceIcon,
  RocketLaunch as RocketLaunchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

// Styled Components
const ProfessionalPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  border: `1px solid ${theme.palette.divider}`,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
    : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.grey[50], 0.8)} 100%)`,
  backdropFilter: 'blur(10px)',
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.light,
    transform: 'translateY(-2px)'
  }
}));

const SectionIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  marginRight: theme.spacing(2)
}));

const PremiumChip = styled(Chip)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
  color: 'white',
  fontWeight: 600,
  fontSize: '0.7rem',
  height: 24,
  '& .MuiChip-label': {
    paddingLeft: 8,
    paddingRight: 8
  }
}));

const SettingItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.light,
    backgroundColor: alpha(theme.palette.primary.main, 0.03)
  }
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: `2px solid ${theme.palette.primary.main}`,
    '&:focus, &:hover, &.Mui-active': {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
    },
  },
  '& .MuiSlider-valueLabel': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    '&:before': {
      content: '""',
      position: 'absolute',
      width: 8,
      height: 8,
      backgroundColor: theme.palette.primary.main,
      bottom: -4,
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
    },
  },
}));

const AppSettings = ({ darkMode, onToggleTheme, userEmail, onBack }) => {
  // Settings state with enhanced defaults
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
    animationLevel: 'normal', // minimal, normal, enhanced
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    soundNotifications: true,
    desktopNotifications: true,
    notificationSound: 'gentle',
    
    // Email settings
    autoSaveDrafts: true,
    autoSaveInterval: 30, // seconds
    sendConfirmation: true,
    spellCheck: true,
    grammarCheck: false,
    signature: `Best regards,\n${userEmail?.split('@')[0] || 'User'}\n\nSent from QuMail - Quantum Secure Email`,
    
    // Security
    autoEncrypt: false,
    defaultEncryptionLevel: 'high',
    sessionTimeout: 30, // minutes
    twoFactorAuth: false,
    autoLogout: true,
    
    // Storage
    syncFrequency: 5, // minutes
    cacheEmails: true,
    maxCacheSize: 1000, // MB
    autoCleanup: true,
    cleanupThreshold: 70, // percentage
    
    // Performance
    hardwareAcceleration: true,
    backgroundSync: true,
    dataSaver: false,
    
    // Advanced
    enableBetaFeatures: false,
    useQuantumEncryption: true,
    performanceMode: false,
    developerMode: false,
    telemetry: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    appearance: false,
    notifications: false,
    email: false,
    security: false,
    storage: false,
    advanced: false
  });

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
      animationLevel: 'normal',
      emailNotifications: true,
      pushNotifications: false,
      soundNotifications: true,
      desktopNotifications: true,
      notificationSound: 'gentle',
      autoSaveDrafts: true,
      autoSaveInterval: 30,
      sendConfirmation: true,
      spellCheck: true,
      grammarCheck: false,
      signature: `Best regards,\n${userEmail?.split('@')[0] || 'User'}\n\nSent from QuMail - Quantum Secure Email`,
      autoEncrypt: false,
      defaultEncryptionLevel: 'high',
      sessionTimeout: 30,
      twoFactorAuth: false,
      autoLogout: true,
      syncFrequency: 5,
      cacheEmails: true,
      maxCacheSize: 1000,
      autoCleanup: true,
      cleanupThreshold: 70,
      hardwareAcceleration: true,
      backgroundSync: true,
      dataSaver: false,
      enableBetaFeatures: false,
      useQuantumEncryption: true,
      performanceMode: false,
      developerMode: false,
      telemetry: false
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(defaultSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, darkMode, userEmail]);

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call with progress
    setTimeout(() => {
      try {
        localStorage.setItem('qumail_settings', JSON.stringify(settings));
        
        setSaveMessage({
          type: 'success',
          text: 'Settings saved successfully! Your preferences have been updated.'
        });
        
        setHasUnsavedChanges(false);
        
        // Clear message after 4 seconds
        setTimeout(() => {
          setSaveMessage({ type: '', text: '' });
        }, 4000);
      } catch (error) {
        setSaveMessage({
          type: 'error',
          text: `Failed to save settings: ${error.message}. Please try again.`
        });
      } finally {
        setIsSaving(false);
      }
    }, 800);
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
      animationLevel: 'normal',
      emailNotifications: true,
      pushNotifications: false,
      soundNotifications: true,
      desktopNotifications: true,
      notificationSound: 'gentle',
      autoSaveDrafts: true,
      autoSaveInterval: 30,
      sendConfirmation: true,
      spellCheck: true,
      grammarCheck: false,
      signature: `Best regards,\n${userEmail?.split('@')[0] || 'User'}\n\nSent from QuMail - Quantum Secure Email`,
      autoEncrypt: false,
      defaultEncryptionLevel: 'high',
      sessionTimeout: 30,
      twoFactorAuth: false,
      autoLogout: true,
      syncFrequency: 5,
      cacheEmails: true,
      maxCacheSize: 1000,
      autoCleanup: true,
      cleanupThreshold: 70,
      hardwareAcceleration: true,
      backgroundSync: true,
      dataSaver: false,
      enableBetaFeatures: false,
      useQuantumEncryption: true,
      performanceMode: false,
      developerMode: false,
      telemetry: false
    };
    
    setSettings(defaultSettings);
    setSaveMessage({
      type: 'info',
      text: 'All settings have been reset to their default values.'
    });
    
    setTimeout(() => {
      setSaveMessage({ type: '', text: '' });
    }, 3000);
  };

  // Enhanced settings sections with more detail
  const settingsSections = [
    {
      id: 'general',
      title: 'General',
      icon: <SettingsIcon />,
      description: 'Basic application preferences and regional settings',
      badge: 'updated',
      fields: [
        {
          key: 'language',
          label: 'Language',
          type: 'select',
          icon: <TranslateIcon />,
          options: [
            { value: 'en', label: 'US English', flag: '' },
            { value: 'en-gb', label: 'UK English', flag: '' },
            { value: 'es', label: 'Español', flag: '' },
            { value: 'fr', label: 'Français', flag: '' },
            { value: 'de', label: 'Deutsch', flag: '' },
            { value: 'zh', label: '中文', flag: '' },
            { value: 'ja', label: '日本語', flag: '' },
            { value: 'ko', label: '한국어', flag: '' },
            { value: 'ru', label: 'Русский', flag: '' }
          ],
          description: 'Interface language for QuMail'
        },
        {
          key: 'timezone',
          label: 'Timezone',
          type: 'select',
          icon: <ScheduleIcon />,
          options: [
            { value: 'America/New_York', label: 'Eastern Time (ET)' },
            { value: 'America/Chicago', label: 'Central Time (CT)' },
            { value: 'America/Denver', label: 'Mountain Time (MT)' },
            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
            { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
            { value: 'Europe/London', label: 'GMT (London)' },
            { value: 'Europe/Paris', label: 'CET (Paris)' },
            { value: 'Europe/Berlin', label: 'CET (Berlin)' },
            { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
            { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
            { value: 'Asia/Kolkata', label: 'IST (India)' },
            { value: 'Australia/Sydney', label: 'AEST (Sydney)' }
          ],
          description: 'Your local timezone for email timestamps'
        },
        {
          key: 'dateFormat',
          label: 'Date Format',
          type: 'select',
          options: [
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
          ],
          description: 'How dates are displayed in the interface'
        },
        {
          key: 'timeFormat',
          label: 'Time Format',
          type: 'select',
          options: [
            { value: '12h', label: '12-hour (AM/PM)' },
            { value: '24h', label: '24-hour' }
          ],
          description: 'Clock format used throughout the app'
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <PaletteIcon />,
      description: 'Customize the visual style and layout',
      badge: 'Premium',
      fields: [
        {
          key: 'theme',
          label: 'Theme',
          type: 'select',
          icon: darkMode ? <DarkIcon /> : <LightIcon />,
          options: [
            { value: 'light', label: 'Light Mode', icon: <LightIcon />, description: 'Clean and bright' },
            { value: 'dark', label: 'Dark Mode', icon: <DarkIcon />, description: 'Easy on the eyes' },
            { value: 'auto', label: 'Auto (System)', icon: <SettingsIcon />, description: 'Follows system preference' }
          ],
          description: 'Color theme for the application interface'
        },
        {
          key: 'density',
          label: 'Interface Density',
          type: 'select',
          options: [
            { value: 'compact', label: 'Compact', description: 'More content, less space' },
            { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
            { value: 'spacious', label: 'Spacious', description: 'Breathing room for content' }
          ],
          description: 'Spacing between interface elements'
        },
        {
          key: 'fontSize',
          label: 'Font Size',
          type: 'slider',
          icon: <Typography fontSize="small" />,
          min: 12,
          max: 20,
          step: 1,
          unit: 'px',
          description: 'Adjust text size for better readability'
        },
        {
          key: 'animationLevel',
          label: 'Animations',
          type: 'select',
          options: [
            { value: 'minimal', label: 'Minimal', description: 'Essential animations only' },
            { value: 'normal', label: 'Normal', description: 'Smooth transitions' },
            { value: 'enhanced', label: 'Enhanced', description: 'Rich visual feedback' }
          ],
          description: 'Level of animations and transitions'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <NotificationsIcon />,
      description: 'Manage alerts and notification preferences',
      fields: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          type: 'switch',
          icon: <EmailIcon />,
          description: 'Receive email alerts for new messages and updates'
        },
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          type: 'switch',
          icon: <NotificationsIcon />,
          description: 'Enable browser push notifications for instant alerts'
        },
        {
          key: 'soundNotifications',
          label: 'Sound Alerts',
          type: 'switch',
          icon: <SpeedIcon />,
          description: 'Play sound when new emails arrive'
        },
        {
          key: 'desktopNotifications',
          label: 'Desktop Notifications',
          type: 'switch',
          icon: <CloudIcon />,
          description: 'Show desktop notifications for important events'
        },
        {
          key: 'notificationSound',
          label: 'Alert Sound',
          type: 'select',
          options: [
            { value: 'gentle', label: 'Gentle Chime' },
            { value: 'classic', label: 'Classic Notification' },
            { value: 'modern', label: 'Modern Tone' },
            { value: 'custom', label: 'Custom Sound' }
          ],
          description: 'Sound played for notifications'
        }
      ]
    },
    {
      id: 'email',
      title: 'Email',
      icon: <EmailIcon />,
      description: 'Email composition and sending preferences',
      fields: [
        {
          key: 'autoSaveDrafts',
          label: 'Auto-save Drafts',
          type: 'switch',
          icon: <SaveIcon />,
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
          icon: <CheckCircleIcon />,
          description: 'Ask for confirmation before sending emails'
        },
        {
          key: 'spellCheck',
          label: 'Spell Check',
          type: 'switch',
          icon: <Typography fontSize="small" />,
          description: 'Check spelling while composing emails'
        },
        {
          key: 'grammarCheck',
          label: 'Grammar Check',
          type: 'switch',
          icon: <VerifiedIcon />,
          description: 'Check grammar and writing style'
        },
        {
          key: 'signature',
          label: 'Email Signature',
          type: 'textarea',
          rows: 4,
          description: 'Signature automatically added to outgoing emails'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      icon: <SecurityIcon />,
      description: 'Security, privacy, and encryption settings',
      badge: 'High Security',
      fields: [
        {
          key: 'autoEncrypt',
          label: 'Auto-encrypt Sensitive Emails',
          type: 'switch',
          icon: <LockIcon />,
          description: 'Automatically encrypt emails containing sensitive content'
        },
        {
          key: 'defaultEncryptionLevel',
          label: 'Default Encryption',
          type: 'select',
          icon: <VpnKeyIcon />,
          options: [
            { value: 'low', label: 'AES-128', description: 'Fast encryption' },
            { value: 'medium', label: 'AES-256', description: 'Strong encryption' },
            { value: 'high', label: 'Quantum OTP', description: 'Maximum security' }
          ],
          description: 'Default encryption level for new emails'
        },
        {
          key: 'sessionTimeout',
          label: 'Session Timeout',
          type: 'slider',
          min: 5,
          max: 120,
          step: 5,
          unit: 'minutes',
          icon: <ScheduleIcon />,
          description: 'Automatic logout after inactivity'
        },
        {
          key: 'twoFactorAuth',
          label: 'Two-Factor Authentication',
          type: 'switch',
          icon: <SecurityIcon />,
          description: 'Require 2FA for login (recommended)'
        },
        {
          key: 'autoLogout',
          label: 'Auto-logout on Close',
          type: 'switch',
          description: 'Automatically log out when closing browser'
        }
      ]
    },
    {
      id: 'storage',
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
          icon: <CloudDownloadIcon />,
          description: 'How often to sync emails with server'
        },
        {
          key: 'cacheEmails',
          label: 'Cache Emails',
          type: 'switch',
          icon: <StorageIcon />,
          description: 'Store emails locally for offline access'
        },
        {
          key: 'maxCacheSize',
          label: 'Maximum Cache Size',
          type: 'slider',
          min: 100,
          max: 5000,
          step: 100,
          unit: 'MB',
          icon: <DataUsageIcon />,
          description: 'Maximum storage for cached emails'
        },
        {
          key: 'autoCleanup',
          label: 'Automatic Cleanup',
          type: 'switch',
          description: 'Automatically remove old cached emails'
        },
        {
          key: 'cleanupThreshold',
          label: 'Cleanup Threshold',
          type: 'slider',
          min: 50,
          max: 95,
          step: 5,
          unit: '%',
          description: 'Clean cache when this percentage is reached'
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: <ScienceIcon />,
      description: 'Experimental features and developer options',
      badge: 'Beta',
      fields: [
        {
          key: 'enableBetaFeatures',
          label: 'Beta Features',
          type: 'switch',
          icon: <RocketLaunchIcon />,
          description: 'Enable experimental features (may be unstable)'
        },
        {
          key: 'useQuantumEncryption',
          label: 'Quantum Encryption',
          type: 'switch',
          icon: <AutoAwesomeIcon />,
          description: 'Use quantum-safe encryption algorithms (experimental)'
        },
        {
          key: 'performanceMode',
          label: 'Performance Mode',
          type: 'switch',
          icon: <BoltIcon />,
          description: 'Optimize for speed over visual effects'
        },
        {
          key: 'hardwareAcceleration',
          label: 'Hardware Acceleration',
          type: 'switch',
          icon: <MemoryIcon />,
          description: 'Use GPU acceleration for better performance'
        },
        {
          key: 'backgroundSync',
          label: 'Background Sync',
          type: 'switch',
          description: 'Sync emails in background (recommended)'
        },
        {
          key: 'dataSaver',
          label: 'Data Saver Mode',
          type: 'switch',
          description: 'Reduce data usage for mobile connections'
        },
        {
          key: 'developerMode',
          label: 'Developer Mode',
          type: 'switch',
          description: 'Enable debugging tools and advanced options'
        },
        {
          key: 'telemetry',
          label: 'Anonymous Telemetry',
          type: 'switch',
          description: 'Help improve QuMail by sharing anonymous usage data'
        }
      ]
    }
  ];

  const renderField = (field) => {
    const value = settings[field.key];
    
    switch (field.type) {
      case 'switch':
        return (
          <SettingItem>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  {field.icon && (
                    <Box sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {field.icon}
                    </Box>
                  )}
                  <Typography variant="body1" fontWeight="600">
                    {field.label}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  {field.description}
                </Typography>
              </Box>
              <Switch
                checked={value}
                onChange={(e) => handleSettingChange(field.key, e.target.checked)}
                color="primary"
                sx={{ ml: 2 }}
              />
            </Box>
          </SettingItem>
        );
        
      case 'select':
        return (
          <SettingItem>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                {field.icon && (
                  <Box sx={{ color: 'primary.main' }}>
                    {field.icon}
                  </Box>
                )}
                <Typography variant="body1" fontWeight="600">
                  {field.label}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {field.description}
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={value}
                onChange={(e) => handleSettingChange(field.key, e.target.value)}
                sx={{
                  borderRadius: 2,
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                {field.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      {option.flag && <span>{option.flag}</span>}
                      {option.icon && option.icon}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{option.label}</Typography>
                        {option.description && (
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </SettingItem>
        );
        
      case 'slider':
        return (
          <SettingItem>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {field.icon && (
                    <Box sx={{ color: 'primary.main' }}>
                      {field.icon}
                    </Box>
                  )}
                  <Typography variant="body1" fontWeight="600">
                    {field.label}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="600" color="primary">
                  {value} {field.unit}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {field.description}
              </Typography>
            </Box>
            <StyledSlider
              value={value}
              onChange={(e, newValue) => handleSettingChange(field.key, newValue)}
              min={field.min}
              max={field.max}
              step={field.step}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} ${field.unit}`}
            />
          </SettingItem>
        );
        
      case 'textarea':
        return (
          <SettingItem>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="600" gutterBottom>
                {field.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {field.description}
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={field.rows || 3}
              value={value}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'background.default'
                }
              }}
              placeholder="Enter your email signature here..."
            />
          </SettingItem>
        );
        
      default:
        return null;
    }
  };

  // Calculate settings statistics
  const settingsStats = React.useMemo(() => {
    const changedCount = Object.keys(settings).filter(key => {
      const defaultValue = {
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        theme: darkMode ? 'dark' : 'light',
        density: 'comfortable',
        fontSize: 14,
        animationLevel: 'normal',
        emailNotifications: true,
        pushNotifications: false,
        soundNotifications: true,
        desktopNotifications: true,
        notificationSound: 'gentle',
        autoSaveDrafts: true,
        autoSaveInterval: 30,
        sendConfirmation: true,
        spellCheck: true,
        grammarCheck: false,
        signature: `Best regards,\n${userEmail?.split('@')[0] || 'User'}\n\nSent from QuMail - Quantum Secure Email`,
        autoEncrypt: false,
        defaultEncryptionLevel: 'high',
        sessionTimeout: 30,
        twoFactorAuth: false,
        autoLogout: true,
        syncFrequency: 5,
        cacheEmails: true,
        maxCacheSize: 1000,
        autoCleanup: true,
        cleanupThreshold: 70,
        hardwareAcceleration: true,
        backgroundSync: true,
        dataSaver: false,
        enableBetaFeatures: false,
        useQuantumEncryption: true,
        performanceMode: false,
        developerMode: false,
        telemetry: false
      };
      
      return JSON.stringify(settings[key]) !== JSON.stringify(defaultValue[key]);
    }).length;
    
    const totalCount = Object.keys(settings).length;
    const changedPercentage = Math.round((changedCount / totalCount) * 100);
    
    return { changedCount, totalCount, changedPercentage };
  }, [settings, darkMode, userEmail]);

  return (
    <Box sx={{ 
      height: '100%',
      overflow: 'auto',
      bgcolor: 'background.default',
      p: { xs: 2, md: 3 }
    }}>
      {/* Page Header */}
      <Box sx={{ 
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasUnsavedChanges && (
            <Chip
              label={`${settingsStats.changedCount} changes`}
              color="warning"
              size="small"
              variant="outlined"
              icon={<WarningIcon />}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>
      
      {/* Stats Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 3, 
        mb: 4,
        p: 3,
        borderRadius: 2,
        backgroundColor: alpha(darkMode ? '#fff' : '#000', 0.05),
        border: `1px solid ${alpha(darkMode ? '#fff' : '#000', 0.1)}`
      }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Settings Modified
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight="700">
              {settingsStats.changedPercentage}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={settingsStats.changedPercentage} 
              sx={{ 
                width: 100, 
                height: 8, 
                borderRadius: 4,
                backgroundColor: alpha('#ccc', 0.2),
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)`,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Current Theme
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {darkMode ? <DarkIcon color="primary" /> : <LightIcon color="primary" />}
            <Typography variant="body1" fontWeight="600">
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </Typography>
          </Box>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Account
          </Typography>
          <Typography variant="body1" fontWeight="600" sx={{ 
            color: 'primary.main',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 200
          }}>
            {userEmail || 'Not signed in'}
          </Typography>
        </Box>
      </Box>
      
      {saveMessage.text && (
        <Alert 
          severity={saveMessage.type} 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: `1px solid ${alpha(saveMessage.type === 'success' ? '#4caf50' : saveMessage.type === 'error' ? '#f44336' : '#2196f3', 0.2)}`
          }}
          icon={saveMessage.type === 'success' ? <CheckCircleIcon /> : saveMessage.type === 'error' ? <WarningIcon /> : <InfoIcon />}
          onClose={() => setSaveMessage({ type: '', text: '' })}
        >
          <Typography fontWeight="600">{saveMessage.text}</Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Left Navigation */}
        <Box sx={{ 
          width: { xs: '100%', lg: 300 }, 
          border: `1px solid ${alpha(darkMode ? '#333' : '#e0e0e0', 0.3)}`,
          p: 3,
          borderRadius: 2,
          height: 'fit-content',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="subtitle2" sx={{ 
            color: 'text.secondary', 
            mb: 2, 
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 600 
          }}>
            Settings Categories
          </Typography>
          
          <List disablePadding>
            {settingsSections.map((section) => (
              <ListItem
                key={section.id}
                button
                onClick={() => toggleSection(section.id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  py: 1.5,
                  px: 2,
                  backgroundColor: expandedSections[section.id] 
                    ? alpha(darkMode ? '#667eea' : '#4f46e5', 0.1)
                    : 'transparent',
                  border: expandedSections[section.id] 
                    ? `1px solid ${alpha(darkMode ? '#667eea' : '#4f46e5', 0.3)}`
                    : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: alpha(darkMode ? '#667eea' : '#4f46e5', 0.05),
                    borderColor: alpha(darkMode ? '#667eea' : '#4f46e5', 0.2)
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: expandedSections[section.id] 
                      ? darkMode ? '#667eea' : '#4f46e5'
                      : alpha(darkMode ? '#fff' : '#000', 0.1),
                    color: expandedSections[section.id] ? 'white' : 'inherit'
                  }}>
                    {section.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="600">
                        {section.title}
                      </Typography>
                      {section.badge && (
                        <PremiumChip 
                          label={section.badge} 
                          size="small" 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {section.description}
                    </Typography>
                  }
                />
                {expandedSections[section.id] ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Right Content */}
        <Box sx={{ 
          flex: 1,
          borderRadius: 2,
          p: 3,
          bgcolor: 'background.paper',
          border: `1px solid ${alpha(darkMode ? '#333' : '#e0e0e0', 0.3)}`
        }}>
          {settingsSections.map((section) => (
            <Collapse key={section.id} in={expandedSections[section.id]}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 3,
                  p: 2.5,
                  borderRadius: 3,
                  background: darkMode
                    ? `linear-gradient(90deg, ${alpha('#1a1a1a', 0.8)} 0%, ${alpha('#2a2a2a', 0.8)} 100%)`
                    : `linear-gradient(90deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8f9fa', 0.9)} 100%)`,
                  border: `1px solid ${alpha(darkMode ? '#333' : '#e0e0e0', 0.3)}`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}>
                  <SectionIconWrapper>
                    {section.icon}
                  </SectionIconWrapper>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" fontWeight="700">
                        {section.title}
                      </Typography>
                      {section.badge && (
                        <PremiumChip label={section.badge} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {section.description}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {section.fields.map((field) => (
                    <Grid item xs={12} key={field.key}>
                      {renderField(field)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
          ))}
          
          {/* Action Buttons */}
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: `1px solid ${alpha(darkMode ? '#333' : '#e0e0e0', 0.3)}`,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                startIcon={<ResetIcon />}
                onClick={handleReset}
                disabled={isSaving}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  borderColor: alpha(darkMode ? '#fff' : '#000', 0.2),
                  '&:hover': {
                    borderColor: 'error.main',
                    backgroundColor: alpha('#f44336', 0.1)
                  }
                }}
              >
                Reset All
              </Button>
              <Tooltip title="This will reset all settings to their default values">
                <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isSaving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Saving...
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="contained"
                startIcon={isSaving ? null : <SaveIcon />}
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  background: `linear-gradient(45deg, #4f46e5 30%, #7c3aed 90%)`,
                  boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
                  '&:hover': {
                    background: `linear-gradient(45deg, #4338ca 30%, #6d28d9 90%)`,
                    boxShadow: '0 6px 25px rgba(79, 70, 229, 0.4)'
                  },
                  '&:disabled': {
                    background: alpha('#ccc', 0.5),
                    boxShadow: 'none'
                  }
                }}
              >
                {isSaving ? 'Saving Changes...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AppSettings;