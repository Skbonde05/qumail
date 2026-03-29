import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Paper,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Badge,
  Alert,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  Close,
  Brightness4,
  Brightness7,
  Wallpaper,
  Palette,
  Person,
  Security,
  Settings as SettingsIcon,
  AlternateEmail,
  Storage,
  VpnKey,
  Translate,
  Notifications,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Refresh,
  CheckCircle,
  Speed,
  VerifiedUser,
  Smartphone,
  Info,
  ExpandMore,
  Save,
  Email,
  Timer,
  Spellcheck,
  AutoFixHigh,
  MarkEmailRead,
  VolumeUp,
  Delete,
  Fingerprint,
  AddPhotoAlternate,
  ColorLens,
  History,
  ReportProblem
} from '@mui/icons-material';
import QuMailService from '../../services/QuMailService';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const commonBackgrounds = [
  { id: 'none', name: 'Default', url: null, preview: '#f1f5f9' },
  { id: 'nature', name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80' },
  { id: 'space', name: 'Deep Space', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80' },
  { id: 'abstract', name: 'Modern Abstract', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80' },
  { id: 'city', name: 'Neon City', url: 'https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?auto=format&fit=crop&q=80' },
  { id: 'forest', name: 'Ancient Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80' },
  { id: 'winter', name: 'Winter Silence', url: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&q=80' },
  { id: 'arch', name: 'Minimalist Arch', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80' },
  { id: 'ocean', name: 'Turquoise Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de4?auto=format&fit=crop&q=80' },
  { id: 'textured', name: 'Dark Texture', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80' },
  { id: 'art', name: 'Canvas Oil', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80' },
  { id: 'dawn', name: 'Golden Dawn', url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80' }
];

const themes = [
  { id: 'default', name: 'Qumail Blue', color: '#1a73e8' },
  { id: 'midnight', name: 'Midnight', color: '#1e293b' },
  { id: 'black', name: 'Solid Black', color: '#000000' },
  { id: 'sunset', name: 'Sunset Amber', color: '#f59e0b' },
  { id: 'forest', name: 'Emerald Forest', color: '#10b981' },
  { id: 'lavender', name: 'Royal Lavender', color: '#8b5cf6' }
];

const QuickSettings = ({
  onClose,
  darkMode,
  onToggleTheme,
  themeName,
  onUpdateTheme,
  bgImage,
  onUpdateBgImage,
  user: initialUser,
  onUserUpdate
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [showKey, setShowKey] = useState({ otp: false, aes256: false });
  const [fullKeys, setFullKeys] = useState({ otp: '', aes256: '' });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [customColor, setCustomColor] = useState(() => (themeName?.startsWith('#') ? themeName : null));

  // Comprehensive App settings state
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('qumail_settings');
    const defaults = {
      language: 'en',
      density: 'comfortable',
      fontSize: 14,
      pushNotifications: true,
      soundNotifications: true,
      notificationSound: 'gentle',
      autoSaveDrafts: true,
      autoSaveInterval: 30,
      sendConfirmation: true,
      spellCheck: true,
      autoCleanup: false,
      maxCacheSize: 500,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      signature: '',
      defaultEncryption: 'aes256',
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProfileUpdate('avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchUserData();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [profileData, keysData, logsData] = await Promise.all([
        QuMailService.getProfile(),
        QuMailService.getEncryptionKeys(),
        QuMailService.getSecurityLogs()
      ]);
      setUser(profileData.user || profileData);
      setSecurityLogs(logsData.logs || []);
    } catch (err) {
      console.error("Failed to sync settings data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppSettingChange = (key, value) => {
    const newSettings = { ...appSettings, [key]: value };
    setAppSettings(newSettings);
    localStorage.setItem('qumail_settings', JSON.stringify(newSettings));

    if (key === 'language') i18n.changeLanguage(value);
    if (key === 'fontSize') document.documentElement.style.fontSize = `${value}px`;

    // Broadcast for components that listen
    window.dispatchEvent(new CustomEvent('qumail-settings-updated', { detail: newSettings }));

    // If it's a server-side preference, save it (mocking server save for prototype)
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('saved'), 1000);
  };

  const handleProfileUpdate = async (field, value) => {
    setSaveStatus('saving');
    try {
      const updatedUser = { ...user, [field]: value };
      setUser(updatedUser);
      if (onUserUpdate) onUserUpdate(updatedUser);
      await QuMailService.updateProfile({ [field]: value });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
    return false;
  };

  const handleRotateKeys = async () => {
    if (!window.confirm("CRITICAL SECURITY ACTION: This will cycle all your master encryption keys. Any emails currently requiring these keys must be re-synced. Proceed?")) return;
    
    setLoading(true);
    setSaveStatus('saving');
    try {
      const res = await QuMailService.rotateKeys();
      if (res.success) {
        setFullKeys({
          otp: res.keys.otp,
          aes256: res.keys.aes256
        });
        setSaveStatus('saved');
        
        // Refresh logs
        const logs = await QuMailService.getSecurityLogs();
        setSecurityLogs(logs.logs || []);
        
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    setSaveStatus('saving');
    try {
      const updatedUser = { ...user, avatar: '' };
      setUser(updatedUser);
      if (onUserUpdate) onUserUpdate(updatedUser);
      await QuMailService.deleteAvatar();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error deleting avatar:', error);
      setSaveStatus('error');
    }
  };

  const handleThemeColorUpload = (e) => {
    const color = e.target.value;
    if (color) {
      setCustomColor(color);
      onUpdateTheme(color);
    }
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Background image must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateBgImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleShowKey = async (algo) => {
    if (!showKey[algo] && !fullKeys[algo]) {
      try {
        const fullKeyData = await QuMailService.getFullEncryptionKey(algo);
        setFullKeys(prev => ({ ...prev, [algo]: fullKeyData.key }));
      } catch (err) {
        return;
      }
    }
    setShowKey(prev => ({ ...prev, [algo]: !prev[algo] }));
  };

  const handleToggle2FA = async () => {
    const isEnabled = user?.settings?.twoFactorEnabled;
    try {
      if (isEnabled) {
        if (window.confirm("Disable 2FA? This will make your account significantly less secure.")) {
          await QuMailService.updateProfile({ settings: { twoFactorEnabled: false } });
          fetchUserData();
        }
      } else {
        alert("Please use the full Security Center for 2FA setup to ensure your TOTP device is correctly linked.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // General / App
        return (
          <Box sx={{ p: 0 }}>
            <Accordion defaultExpanded elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2" fontWeight="700">Language & Region</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={appSettings.language}
                    label="Language"
                    onChange={(e) => handleAppSettingChange('language', e.target.value)}
                    startAdornment={<Translate sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />}
                  >
                    <MenuItem value="en">English (US)</MenuItem>
                    <MenuItem value="es">Español (Spanish)</MenuItem>
                    <MenuItem value="fr">Français (French)</MenuItem>
                    <MenuItem value="de">Deutsch (German)</MenuItem>
                    <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>
                    <MenuItem value="ar">العربية (Arabic)</MenuItem>
                    <MenuItem value="mr">मराठी (Marathi)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={appSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                    label="Timezone"
                    onChange={(e) => handleAppSettingChange('timezone', e.target.value)}
                    startAdornment={<Timer sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />}
                  >
                    <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                    <MenuItem value="America/New_York">EST (Eastern Time)</MenuItem>
                    <MenuItem value="America/Chicago">CST (Central Time)</MenuItem>
                    <MenuItem value="America/Los_Angeles">PST (Pacific Time)</MenuItem>
                    <MenuItem value="Europe/London">GMT (London)</MenuItem>
                    <MenuItem value="Europe/Paris">CET (Paris)</MenuItem>
                    <MenuItem value="Asia/Kolkata">IST (India)</MenuItem>
                    <MenuItem value="Asia/Dubai">GST (Gulf Standard Time)</MenuItem>
                    <MenuItem value="Asia/Singapore">SGT (Singapore)</MenuItem>
                    <MenuItem value="Asia/Tokyo">JST (Tokyo)</MenuItem>
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2" fontWeight="700">Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <FormControlLabel
                  control={<Switch checked={appSettings.pushNotifications} onChange={(e) => handleAppSettingChange('pushNotifications', e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Push Notifications</Typography>}
                  sx={{ width: '100%', mb: 1 }}
                />
                <FormControlLabel
                  control={<Switch checked={appSettings.soundNotifications} onChange={(e) => handleAppSettingChange('soundNotifications', e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Sound Feedback</Typography>}
                  sx={{ width: '100%', mb: 2 }}
                />
                {appSettings.soundNotifications && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Sound Theme</InputLabel>
                    <Select
                      value={appSettings.notificationSound}
                      label="Sound Theme"
                      onChange={(e) => handleAppSettingChange('notificationSound', e.target.value)}
                      startAdornment={<VolumeUp sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />}
                    >
                      <MenuItem value="gentle">Gentle Chime</MenuItem>
                      <MenuItem value="classic">Classic Bell</MenuItem>
                      <MenuItem value="modern">Modern Pulse</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: alpha(theme.palette.divider, 0.5) }}>
                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('qumail-test-notif', {
                        detail: { title: "Notification Test", message: "If you hear a chime or see a popup, real-time alerts are functional!" }
                      }));
                    }}
                  >
                    Send Test Notification
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2" fontWeight="700">Email Composing</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <FormControlLabel
                  control={<Switch checked={appSettings.autoSaveDrafts} onChange={(e) => handleAppSettingChange('autoSaveDrafts', e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Auto-save Drafts</Typography>}
                  sx={{ width: '100%', mb: 1 }}
                />
                <FormControlLabel
                  control={<Switch checked={appSettings.spellCheck} onChange={(e) => handleAppSettingChange('spellCheck', e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Spell Check</Typography>}
                  sx={{ width: '100%', mb: 1 }}
                />
                <FormControlLabel
                  control={<Switch checked={appSettings.sendConfirmation} onChange={(e) => handleAppSettingChange('sendConfirmation', e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Confirm before Sending</Typography>}
                  sx={{ width: '100%', mb: 2 }}
                />

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Default Encryption</InputLabel>
                  <Select
                    value={appSettings.defaultEncryption || 'aes256'}
                    label="Default Encryption"
                    onChange={(e) => handleAppSettingChange('defaultEncryption', e.target.value)}
                    startAdornment={<Security sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />}
                  >
                    <MenuItem value="aes256">AES-256 (Standard)</MenuItem>
                    <MenuItem value="otp">OTP (Quantum Absolute)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth label="Email Signature" size="small" multiline rows={3}
                  placeholder="Sent from my Quantum-Secure Qumail"
                  value={appSettings.signature || ''}
                  onChange={(e) => handleAppSettingChange('signature', e.target.value)}
                  sx={{ mt: 1 }}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2" fontWeight="700">System & Privacy</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <FormControlLabel
                  control={<Switch checked={appSettings.autoCleanup} onChange={(e) => handleAppSettingChange('autoCleanup', e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Auto-cleanup cache</Typography>}
                  sx={{ width: '100%', mb: 1 }}
                />
                <Button fullWidth variant="outlined" color="error" size="small" startIcon={<Refresh />} onClick={() => { localStorage.clear(); window.location.reload(); }}>
                  Reset All Settings
                </Button>
              </AccordionDetails>
            </Accordion>
          </Box>
        );
      case 1: // Account / Profile
        return (
          <Box sx={{ p: 2.5 }}>
            {/* Header Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 90,
                    height: 90,
                    mx: 'auto',
                    mb: 2,
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: theme.shadows[4],
                    fontSize: '2rem',
                    fontWeight: 900
                  }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <Tooltip title="Update Photo">
                  <label htmlFor="avatar-upload-input">
                    <IconButton 
                      size="small" 
                      component="span"
                      sx={{ 
                        position: 'absolute', 
                        bottom: 12, 
                        right: 0, 
                        bgcolor: 'background.paper', 
                        border: 1, 
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'primary.main', color: 'white' }
                      }}
                    >
                      <AutoFixHigh sx={{ fontSize: 14 }} />
                    </IconButton>
                  </label>
                </Tooltip>
                
                {user?.avatar && (
                  <Tooltip title="Remove Photo">
                    <IconButton 
                      size="small" 
                      onClick={handleAvatarDelete}
                      sx={{ 
                        position: 'absolute', 
                        bottom: 12, 
                        left: -8, 
                        bgcolor: 'background.paper', 
                        border: 1, 
                        borderColor: 'divider',
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.main', color: 'white' },
                        zIndex: 1
                      }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
                
                <input
                  id="avatar-upload-input"
                  type="file"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Chip
                  label="Standard Account"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1
                  }}
                />
                <Typography variant="body2" color="text.secondary" fontWeight="600">{user?.email}</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', mb: 2 }}>
              Core Profile Data
            </Typography>

            <TextField
              fullWidth label="Full Name" size="small" variant="outlined"
              value={user?.name || ''}
              onChange={(e) => handleProfileUpdate('name', e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{ startAdornment: <Person sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} /> }}
            />

            <TextField
              fullWidth label="Username" size="small" variant="outlined"
              value={user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleProfileUpdate('username', val.startsWith('@') ? val : `@${val}`);
              }}
              sx={{ mb: 2.5 }}
              InputProps={{ startAdornment: <AlternateEmail sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} /> }}
              placeholder="@username"
            />

            <TextField
              fullWidth label="Bio" size="small" variant="outlined" multiline rows={2}
              value={user?.bio || ''}
              onChange={(e) => handleProfileUpdate('bio', e.target.value)}
              sx={{ mb: 2.5 }}
              placeholder="Short description about yourself..."
            />

          </Box>
        );
      case 2: // SECURITY
        return (
          <Box sx={{ p: 2, pb: 6 }}>
            {/* Encryption Keys Section */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '1px' }}>
              Quantum Encryption Keys
            </Typography>
            <Box sx={{ mt: 1.5, mb: 4 }}>
              {['otp', 'aes256'].map(algo => (
                <Box key={algo} sx={{ 
                  mb: 2, p: 2, borderRadius: 3, border: 1, borderColor: 'divider',
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.03) : 'background.default'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Fingerprint sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight="800" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {algo === 'otp' ? 'Quantum OTP' : 'AES-256-GCM'}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleToggleShowKey(algo)} sx={{ p: 0.5 }}>
                      {showKey[algo] ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontFamily: 'Roboto Mono, monospace', display: 'block', wordBreak: 'break-all', 
                    color: showKey[algo] ? 'text.primary' : 'text.disabled', opacity: showKey[algo] ? 1 : 0.4,
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.text.disabled, 0.05),
                    p: 1, borderRadius: 1.5,
                    border: 1, borderColor: alpha(theme.palette.divider, 0.5)
                  }}>
                    {showKey[algo] ? fullKeys[algo] : '••••••••••••••••••••••••••••••••••••••••'}
                  </Typography>
                  {showKey[algo] && (
                    <Button 
                      size="small" 
                      startIcon={<ContentCopy />} 
                      sx={{ mt: 1.5, fontSize: '0.65rem', fontWeight: 800 }} 
                      onClick={() => { navigator.clipboard.writeText(fullKeys[algo]); }}
                    >
                      Copy Secret key
                    </Button>
                  )}
                </Box>
              ))}
              <Button 
                fullWidth 
                variant="outlined" 
                size="small" 
                startIcon={<Refresh />} 
                onClick={handleRotateKeys}
                disabled={loading}
                sx={{ borderRadius: '12px', py: 1, fontWeight: 700 }}
              >
                {loading ? 'Rotating Keys...' : 'Rotate All Encryption Keys'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Audit Logs */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '1px' }}>
              Recent Login Activity
            </Typography>
            <List sx={{ mt: 1, mb: 4 }}>
              {securityLogs.length > 0 ? securityLogs.slice(0, 5).map((log, idx) => (
                 <ListItem key={idx} disablePadding sx={{ py: 1, borderBottom: idx < 4 ? 1 : 0, borderColor: 'divider' }}>
                   <ListItemIcon sx={{ minWidth: 36 }}><History sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
                   <ListItemText 
                     primary={log.action.replace(/_/g, ' ')} 
                     secondary={`${log.location || 'Unknown Location'} • ${new Date(log.timestamp).toLocaleString()}`}
                     primaryTypographyProps={{ variant: 'caption', fontWeight: 700, textTransform: 'capitalize' }}
                     secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.65rem' } }}
                   />
                 </ListItem>
              )) : (
                <Typography variant="caption" color="text.disabled" sx={{ py: 2, display: 'block' }}>No recent activity to show.</Typography>
              )}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* Danger Zone */}
            <Typography variant="overline" color="error" sx={{ fontWeight: 800, letterSpacing: '1px' }}>
              Danger Zone
            </Typography>
            <Box sx={{ mt: 2, p: 2, borderRadius: 3, border: 1, borderColor: alpha(theme.palette.error.main, 0.4), bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.error.main, 0.02) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ReportProblem color="error" sx={{ fontSize: 18 }} />
                <Typography variant="body2" fontWeight="800" color="error">Permanently Delete Account</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.4 }}>
                This is permanent. All emails, encryption keys, and digital assets will be irrevocably purged from the quantum network.
              </Typography>
              <Button 
                fullWidth 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={async () => {
                  const confirm = window.prompt("To confirm deletion, type: DELETE MY ACCOUNT");
                  if (confirm === "DELETE MY ACCOUNT") {
                    await QuMailService.deleteAccount();
                    window.location.href = '/login';
                  }
                }}
                sx={{ 
                  fontWeight: 800, 
                  borderRadius: '10px',
                  borderWidth: 1.5,
                  '&:hover': { bgcolor: 'error.main', color: 'white', borderWidth: 1.5 } 
                }}
              >
                Final Delete Sequence
              </Button>
            </Box>
          </Box>
        );
      case 3: // Appearance / Design
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              DISPLAY MODE
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Box
                onClick={onToggleTheme}
                sx={{
                  p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05),
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                  border: '1px solid transparent',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), borderColor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                  <Typography variant="body2" fontWeight="600">{darkMode ? 'Dark Mode' : 'Light Mode'}</Typography>
                </Box>
                <Switch checked={darkMode} onChange={onToggleTheme} size="small" />
              </Box>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              LAYOUT DENSITY
            </Typography>
            <Grid container spacing={1} sx={{ mb: 3, mt: 0.5 }}>
              {['compact', 'comfortable', 'spacious'].map(d => (
                <Grid size={4} key={d}>
                  <Box
                    onClick={() => handleAppSettingChange('density', d)}
                    sx={{
                      p: 1, textAlign: 'center', borderRadius: 1.5, border: 1,
                      borderColor: appSettings.density === d ? 'primary.main' : 'divider',
                      bgcolor: appSettings.density === d ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                      cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                    }}
                  >
                    <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 700 }}>{d}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              THEME COLOR
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
              {themes.map((t) => (
                <Box
                  key={t.id}
                  onClick={() => onUpdateTheme(t.id)}
                  sx={{
                    height: 48, borderRadius: 2, bgcolor: t.color, cursor: 'pointer',
                    border: themeName === t.id ? '2.5px solid' : '1px solid transparent',
                    borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.05)', boxShadow: 2 }
                  }}
                >
                  {themeName === t.id && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />}
                </Box>
              ))}
              
              {customColor && (
                <Box
                  onClick={() => onUpdateTheme(customColor)}
                  sx={{
                    height: 48, borderRadius: 2, bgcolor: customColor, cursor: 'pointer',
                    border: themeName === customColor ? '2.5px solid' : '1px solid transparent',
                    borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.05)', boxShadow: 2 }
                  }}
                >
                  {themeName === customColor && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />}
                </Box>
              )}
              
              {/* Custom Color Selector */}
              <label htmlFor="custom-theme-input">
                <Box
                  sx={{
                    height: 48, borderRadius: 2, border: '1px dashed', borderColor: 'text.disabled',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', bgcolor: alpha(theme.palette.text.disabled, 0.05), transition: 'all 0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: 'primary.main', color: 'primary.main' }
                  }}
                >
                  <ColorLens sx={{ fontSize: 18, mb: 0.2 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Custom</Typography>
                </Box>
              </label>
              <input 
                id="custom-theme-input" 
                type="color" 
                onChange={handleThemeColorUpload}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700, mt: 3 }}>
              BACKGROUND ART
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
              {commonBackgrounds.map((bg) => (
                <Tooltip key={bg.id} title={bg.name}>
                  <Box
                    onClick={() => onUpdateBgImage(bg.url)}
                    sx={{
                      height: 54, borderRadius: 2, background: bg.url ? `url(${bg.url}) center/cover` : bg.preview, cursor: 'pointer',
                      border: (bgImage === bg.url || (!bg.url && !bgImage)) ? '2.5px solid' : '1px solid',
                      borderColor: (bgImage === bg.url || (!bg.url && !bgImage)) ? 'primary.main' : (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.15) : 'divider'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                      overflow: 'hidden',
                      '&:hover': { transform: 'scale(1.05)', boxShadow: 3 }
                    }}
                  >
                    {(bgImage === bg.url || (!bg.url && !bgImage)) && (
                       <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                          <CheckCircle sx={{ color: 'white', fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                       </Box>
                    )}
                  </Box>
                </Tooltip>
              ))}
              
              {/* Custom Upload Tile */}
              <label htmlFor="custom-bg-input">
                <Box
                  sx={{
                    height: 54, borderRadius: 2, border: '1px dashed', borderColor: 'text.disabled',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', bgcolor: alpha(theme.palette.text.disabled, 0.05), transition: 'all 0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: 'primary.main', color: 'primary.main' }
                  }}
                >
                  <AddPhotoAlternate sx={{ fontSize: 18, mb: 0.2 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Custom</Typography>
                </Box>
              </label>
              <input 
                id="custom-bg-input" 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={handleBgUpload}
              />
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: 360, p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>Settings</Typography>
          {saveStatus === 'saving' && <CircularProgress size={14} />}
          {saveStatus === 'saved' && <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { minWidth: 0, px: 1, fontSize: '0.7rem', fontWeight: 800 },
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}
      >
        <Tab label="General" />
        <Tab label="Profile" />
        <Tab label="Security" />
        <Tab label="Design" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {renderTabContent()}
      </Box>

      <Divider />
      <Box sx={{ 
        p: 2.5, 
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.primary.main, 0.03), 
        textAlign: 'center',
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
          Qumail Enterprise v2.4.0
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.65rem', mt: 0.5, opacity: 0.7, color: 'text.secondary' }}>
          Your settings are encrypted and synced.
        </Typography>
      </Box>
    </Box>
  );
};

export default QuickSettings;
