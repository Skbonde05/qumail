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
  VolumeUp
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
  user: initialUser
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  
  const [securityInfo, setSecurityInfo] = useState({ logs: [], keys: { otp: null, aes256: null } });
  const [showKey, setShowKey] = useState({ otp: false, aes256: false });
  const [fullKeys, setFullKeys] = useState({ otp: '', aes256: '' });

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
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchUserData();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [profileData, keysData] = await Promise.all([
        QuMailService.getProfile(),
        QuMailService.getEncryptionKeys()
      ]);
      setUser(profileData.user || profileData);
      setSecurityInfo(prev => ({ ...prev, keys: keysData.keys || {} }));
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
      await QuMailService.updateProfile({ [field]: value });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
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
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  fullWidth label="Timezone" size="small" value={appSettings.timezone}
                  InputProps={{ startAdornment: <Timer sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} /> }}
                  disabled
                />
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
                  sx={{ width: '100%' }}
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
          <Box sx={{ p: 2 }}>
             <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar 
                    src={user?.avatar} 
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 1.5, border: `2px solid ${theme.palette.primary.main}`, boxShadow: theme.shadows[2] }}
                  >
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <IconButton size="small" sx={{ position: 'absolute', bottom: 10, right: 0, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <AutoFixHigh sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" fontWeight="700">{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
             </Box>

             <Divider sx={{ mb: 2 }} />

             <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              PROFILE INFO
             </Typography>
             <TextField 
                fullWidth label="Display Name" size="small" value={user?.name || ''} 
                onChange={(e) => handleProfileUpdate('name', e.target.value)}
                sx={{ mb: 2 }} 
             />
             <TextField 
                fullWidth label="Avatar URL" size="small" value={user?.avatar || ''} 
                onChange={(e) => handleProfileUpdate('avatar', e.target.value)}
                sx={{ mb: 2 }} 
             />
             <TextField 
                fullWidth label="Email Signature" size="small" multiline rows={3}
                placeholder="Sent from my Quantum-Secure Qumail"
                value={appSettings.signature || ''} 
                onChange={(e) => handleAppSettingChange('signature', e.target.value)}
                sx={{ mb: 3 }} 
             />

             <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              SECURITY ACTIONS
             </Typography>
             <List size="small" disablePadding>
               <ListItem button sx={{ px: 1, borderRadius: 1 }} onClick={() => alert("Redirecting to password update...")}>
                 <ListItemIcon><Lock fontSize="small" /></ListItemIcon>
                 <ListItemText primary={<Typography variant="body2">Change Password</Typography>} />
               </ListItem>
               <ListItem button sx={{ px: 1, borderRadius: 1 }}>
                 <ListItemIcon><MarkEmailRead fontSize="small" /></ListItemIcon>
                 <ListItemText primary={<Typography variant="body2">Email Preferences</Typography>} />
               </ListItem>
             </List>
          </Box>
        );
      case 2: // Security
        return (
          <Box sx={{ p: 2 }}>
             <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              ACCOUNT PROTECTION
            </Typography>
            <Box 
              sx={{ 
                p: 1.5, mb: 3, 
                borderRadius: 2, 
                bgcolor: user?.settings?.twoFactorEnabled ? alpha('#4caf50', 0.05) : alpha('#ff9800', 0.05),
                border: 1,
                borderColor: user?.settings?.twoFactorEnabled ? alpha('#4caf50', 0.2) : alpha('#ff9800', 0.2)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security color={user?.settings?.twoFactorEnabled ? "success" : "warning"} fontSize="small" />
                  <Typography variant="body2" fontWeight="700">2-Factor Auth (2FA)</Typography>
                </Box>
                <Switch checked={!!user?.settings?.twoFactorEnabled} onChange={handleToggle2FA} size="small" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {user?.settings?.twoFactorEnabled ? "Your account is high-security protected." : "Your account is vulnerable to password theft."}
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              QUANTUM ENCRYPTION
            </Typography>
            {['otp', 'aes256'].map(algo => (
              <Box key={algo} sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" fontWeight="700" sx={{ textTransform: 'uppercase' }}>{algo === 'otp' ? 'Quantum OTP' : 'AES-256-GCM'}</Typography>
                  <IconButton size="small" onClick={() => handleToggleShowKey(algo)} sx={{ p: 0.5 }}>{showKey[algo] ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton>
                </Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all', color: showKey[algo] ? 'text.primary' : 'text.disabled', opacity: showKey[algo] ? 1 : 0.5 }}>
                  {showKey[algo] ? fullKeys[algo] : '••••••••••••••••••••'}
                </Typography>
                {showKey[algo] && (
                  <Button size="small" startIcon={<ContentCopy />} sx={{ mt: 1, fontSize: '0.6rem' }} onClick={() => { navigator.clipboard.writeText(fullKeys[algo]); alert("Key copied!"); }}>Copy Key</Button>
                )}
              </Box>
            ))}
            <Button fullWidth variant="outlined" size="small" startIcon={<Refresh />} sx={{ mt: 1 }}>Rotate Encryption Keys</Button>
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
                <Grid item xs={4} key={d}>
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
            <Grid container spacing={1} sx={{ mb: 3 }}>
              {themes.map((t) => (
                <Grid item xs={4} key={t.id}>
                  <Box
                    onClick={() => onUpdateTheme(t.id)}
                    sx={{
                      height: 48, borderRadius: 2, bgcolor: t.color, cursor: 'pointer',
                      border: themeName === t.id ? '2px solid' : '1px solid transparent',
                      borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                      '&:hover': { transform: 'scale(1.05)', boxShadow: 2 }
                    }}
                  >
                    {themeName === t.id && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
              BACKGROUND ART
            </Typography>
            <Grid container spacing={1}>
              {commonBackgrounds.map((bg) => (
                <Grid item xs={4} key={bg.id}>
                  <Box
                    onClick={() => onUpdateBgImage(bg.url)}
                    sx={{
                      height: 60, borderRadius: 2, background: bg.url ? `url(${bg.url}) center/cover` : bg.preview, cursor: 'pointer',
                      border: bgImage === bg.url ? '2px solid' : '1px solid transparent',
                      borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                      '&:hover': { transform: 'scale(1.02)', boxShadow: 2 }
                    }}
                  >
                    {bgImage === bg.url && <CheckCircle sx={{ color: 'white', fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />}
                  </Box>
                </Grid>
              ))}
            </Grid>
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
        <Tab icon={<SettingsIcon sx={{ fontSize: 18 }} />} label="General" />
        <Tab icon={<Person sx={{ fontSize: 18 }} />} label="Profile" />
        <Tab icon={<Security sx={{ fontSize: 18 }} />} label="Security" />
        <Tab icon={<Palette sx={{ fontSize: 18 }} />} label="Design" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {renderTabContent()}
      </Box>

      <Divider />
      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Qumail Enterprise v2.4.0
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.65rem', mt: 0.5, opacity: 0.6 }}>
           Your settings are synced across all secure devices.
        </Typography>
      </Box>
    </Box>
  );
};

export default QuickSettings;
