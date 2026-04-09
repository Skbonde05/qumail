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
  CircularProgress,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import QuMailService from '../services/QuMailService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  ArrowBack as ArrowBackIcon,
  VisibilityOff,
  Visibility as VisibilityIcon,
  ContentCopy
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

// Styled Components
const ProfessionalPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.4)
    : alpha(theme.palette.background.paper, 0.2),
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
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  marginRight: theme.spacing(2)
}));

const PremiumChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
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
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
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

// Added for 2FA Support
const KeyDisplay = styled(Box)(({ theme }) => ({
  fontFamily: 'Roboto Mono, monospace',
  fontSize: '0.85rem',
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.text.disabled, 0.05),
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  wordBreak: 'break-all',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(1)
}));

const AppSettings = ({ user, darkMode, onToggleTheme, onBack }) => {
  const { t } = useTranslation();
  const theme = useTheme();

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
    signature: '',
    
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
    
    telemetry: false
  });

  // 2FA Setup State
  const [openMfaSetup, setOpenMfaSetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  
  // Encryption Keys State
  const [keysInfo, setKeysInfo] = useState({ otp: null, aes256: null });
  const [showKey, setShowKey] = useState({ otp: false, aes256: false });
  const [fullKeys, setFullKeys] = useState({ otp: '', aes256: '' });

  useEffect(() => {
    if (activeCategory === 'security') {
       fetchSecurityData();
    }
  }, [activeCategory]);

  const fetchSecurityData = async () => {
    try {
      const keysData = await QuMailService.getEncryptionKeys();
      setKeysInfo(keysData.keys || {});
    } catch (err) {
      console.error("Failed to fetch keys info");
    }
  };


  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeCategory, setActiveCategory] = useState('general');

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
            { value: 'en', label: 'US English' },
            { value: 'en-gb', label: 'UK English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
            { value: 'hi', label: 'हिन्दी (Hindi)' },
            { value: 'mr', label: 'मराठी (Marathi)' },
            { value: 'ar', label: 'العربية (Arabic)' },
            { value: 'zh', label: '中文' },
            { value: 'ja', label: '日本語' },
            { value: 'ko', label: '한국어' },
            { value: 'ru', label: 'Русский' }
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
    }
  ];




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
      signature: `Best regards,\n${user?.email?.split('@')[0] || 'User'}`,
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
      telemetry: false
    };


    const hasChanges = JSON.stringify(settings) !== JSON.stringify(defaultSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, darkMode, user]);

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

    // Special handling for language changes
    if (key === 'language') {
      i18n.changeLanguage(value);
    }

    // Global Side Effects for Appearance
    if (key === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
    }

    if (key === 'animationLevel') {
      const duration = value === 'minimal' ? '0s' : value === 'enhanced' ? '0.5s' : '0.3s';
      document.documentElement.style.setProperty('--app-transition-duration', duration);
    }

    // Notifications permission logic
    if (key === 'pushNotifications' && value === true) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission !== 'granted') {
            setSettings(prev => ({ ...prev, pushNotifications: false }));
          }
        });
      }
    }

    // 2FA Trigger Logic
    if (key === 'twoFactorAuth') {
      if (value === true) {
        // User wants to enable 2FA -> Show Setup
        handleStart2FASetup();
      } else {
        // User wants to disable 2FA
        if (window.confirm("Disabling 2FA reduces account security. Proceed?")) {
           QuMailService.updateProfile({ settings: { twoFactorEnabled: false } });
        } else {
           // Revert state
           setSettings(prev => ({ ...prev, twoFactorAuth: true }));
        }
      }
    }
  };

  const handleStart2FASetup = async () => {
    setMfaSetupLoading(true);
    try {
      const res = await QuMailService.setup2FA();
      if (res.success) {
        setMfaQrCode(res.qrCode);
        setMfaSecret(res.secret);
        setOpenMfaSetup(true);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to initialize 2FA setup' });
    } finally {
      setMfaSetupLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setMfaSetupLoading(true);
    setMfaError("");
    try {
      const res = await QuMailService.confirm2FA(mfaCode);
      if (res.success) {
        setOpenMfaSetup(false);
        setSettings(prev => ({ ...prev, twoFactorAuth: true }));
        setMfaCode('');
        setSaveMessage({ type: 'success', text: '2FA enabled successfully!' });
      } else {
        setMfaError(res.message || "Invalid code");
      }
    } catch (err) {
      setMfaError("Verification failed.");
    } finally {
      setMfaSetupLoading(false);
    }
  };

  const handleShowKey = async (algo) => {
    if (showKey[algo]) {
      setShowKey(prev => ({ ...prev, [algo]: false }));
      return;
    }
    try {
      const fullKeyData = await QuMailService.getFullEncryptionKey(algo);
      setFullKeys(prev => ({ ...prev, [algo]: fullKeyData.key }));
      setShowKey(prev => ({ ...prev, [algo]: true }));
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to retrieve key' });
    }
  };

  const currentSection = settingsSections.find(s => s.id === activeCategory);


  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call with progress
    setTimeout(() => {
      try {
        localStorage.setItem('qumail_settings', JSON.stringify(settings));
        
        // Broadcast change globally
        window.dispatchEvent(new CustomEvent('qumail-settings-updated', { detail: settings }));

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
      signature: `Best regards,\n${user?.email?.split('@')[0] || 'User'}`,
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
        signature: `Best regards,\n${user?.email?.split('@')[0] || 'User'}`,
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
        telemetry: false
      };
      
      return JSON.stringify(settings[key]) !== JSON.stringify(defaultValue[key]);
    }).length;
    
    const totalCount = Object.keys(settings).length;
    const changedPercentage = Math.round((changedCount / totalCount) * 100);
    
    return { changedCount, totalCount, changedPercentage };
  }, [settings, darkMode, user]);

  return (
    <Box sx={{ 
      height: '100%',
      overflow: 'auto',
      bgcolor: 'transparent',
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
          {onBack && (
            <IconButton onClick={onBack} sx={{ mr: 1, backgroundColor: alpha(theme.palette.primary.main, 0.05) }} color="primary">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
              App Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personalize your QuMail experience
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          {onBack && (
            <Tooltip title="Close Settings">
              <IconButton onClick={onBack} sx={{ ml: 1, '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
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
                  backgroundColor: '#4f46e5',
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
            {user?.email || 'Not signed in'}
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
          border: `1px solid ${alpha(darkMode ? '#fff' : '#000', 0.1)}`,
          p: 3,
          borderRadius: 2,
          height: 'fit-content',
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(20px)',
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
                onClick={() => setActiveCategory(section.id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  py: 1.5,
                  px: 2,
                  backgroundColor: activeCategory === section.id 
                    ? alpha(darkMode ? '#667eea' : '#4f46e5', 0.1)
                    : 'transparent',
                  border: activeCategory === section.id 
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
                    bgcolor: activeCategory === section.id 
                      ? darkMode ? '#667eea' : '#4f46e5'
                      : alpha(darkMode ? '#fff' : '#000', 0.1),
                    color: activeCategory === section.id ? 'white' : 'inherit'
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
                {activeCategory === section.id && (
                  <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: 'primary.main', ml: 1 }} />
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Right Content */}
        <Box sx={{ 
          flex: 1,
          borderRadius: 2,
          p: 0,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(darkMode ? '#fff' : '#000', 0.1)}`,
          minHeight: '600px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {currentSection && (
            <Box sx={{ p: { xs: 2.5, sm: 4 }, flex: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 4,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                backgroundColor: darkMode
                  ? alpha('#1a1a1a', 0.4)
                  : alpha('#ffffff', 0.5),
                border: `1px solid ${alpha(darkMode ? '#fff' : '#000', 0.1)}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <SectionIconWrapper>
                  {currentSection.icon}
                </SectionIconWrapper>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="h6" fontWeight="700">
                      {currentSection.title}
                    </Typography>
                    {currentSection.badge && (
                      <PremiumChip label={currentSection.badge} />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {currentSection.description}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {currentSection.fields.map((field) => (
                  <Grid size={12} key={field.key}>
                    {renderField(field)}
                    
                    {/* Security Specific Dashboard Inserts */}
                    {/* Standard Security Status */}
                    {activeCategory === 'security' && field.key === 'twoFactorAuth' && (
                      <Alert 
                        severity="success" 
                        sx={{ mt: 1, mb: 3, borderRadius: '12px' }}
                        icon={<VerifiedIcon />}
                      >
                        <Typography variant="subtitle2" fontWeight="700">
                           Cloud Identity Protection Active
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                           Your access is secured via Enterprise Account Management and encrypted sessions.
                        </Typography>
                      </Alert>
                    )}

                    {activeCategory === 'security' && field.key === 'defaultEncryptionLevel' && (
                      <Box sx={{ mt: 1, mb: 3 }}>
                         <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                           <VpnKeyIcon sx={{ fontSize: 20 }} /> Active Encryption Secrets
                         </Typography>
                         {['otp', 'aes256'].map(algo => (
                            <Box key={algo} sx={{ mb: 2 }}>
                               <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                 {algo === 'otp' ? 'Quantum One-Time Pad' : 'AES-256 Secret Key'}
                               </Typography>
                               <KeyDisplay>
                                  <Typography variant="caption" sx={{ opacity: showKey[algo] ? 1 : 0.5, letterSpacing: showKey[algo] ? '0.5px' : '2px', fontWeight: 'bold' }}>
                                    {showKey[algo] ? fullKeys[algo] : (keysInfo[algo]?.preview || '••••••••••••••••••••••••')}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => handleShowKey(algo)}>
                                       {showKey[algo] ? <VisibilityOff sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                    <IconButton size="small" onClick={() => { navigator.clipboard.writeText(fullKeys[algo]); setSaveMessage({ type: 'success', text: 'Key copied to clipboard' }); }}>
                                       <ContentCopy sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Box>
                               </KeyDisplay>
                            </Box>
                         ))}
                         <Button 
                           fullWidth 
                           variant="outlined" 
                           startIcon={<ResetIcon />}
                           sx={{ borderRadius: '12px', py: 1, mt: 1, fontWeight: 700 }}
                           onClick={() => window.dispatchEvent(new Event('rotate-keys'))}
                         >
                           Regenerate All Physical Keys
                         </Button>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Action Buttons always visible at bottom */}
          <Box sx={{ 
            mt: 'auto', 
            p: 3, 
            borderTop: `1px solid ${alpha(darkMode ? '#fff' : '#000', 0.1)}`,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.4)
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
                  backgroundColor: '#4f46e5',
                  boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
                  '&:hover': {
                    backgroundColor: '#4338ca',
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