import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Edit,
  Save,
  Cancel,
  VerifiedUser,
  Storage,
  CloudUpload,
  Security,
  Notifications,
  Settings,
  Image,
  AddPhotoAlternate,
  Wallpaper,
  ArrowBack as ArrowBackIcon,
  Delete,
  Close
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import QuMailService from '../services/QuMailService';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `2px solid ${theme.palette.primary.light}`,
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  fontSize: '2.5rem',
  border: `3px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[3],
}));

const PasswordStrengthBar = styled(LinearProgress)(({ theme, strength }) => {
  let color = theme.palette.error.main;
  if (strength === 'medium') color = theme.palette.warning.main;
  if (strength === 'strong') color = theme.palette.success.main;
  
  return {
    height: 4,
    borderRadius: 2,
    marginTop: theme.spacing(0.5),
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
      backgroundColor: color,
    },
  };
});

// Auto-save preferences after 1 second of inactivity
// Stable Auto-save Hook
const useAutoSave = (saveFunction, delay = 1000) => {
  const timeoutId = React.useRef(null);
  const saveFnRef = React.useRef(saveFunction);

  // Sync ref with function
  React.useEffect(() => {
    saveFnRef.current = saveFunction;
  }, [saveFunction]);

  const autoSave = useCallback((updatedData) => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    
    timeoutId.current = setTimeout(() => {
      saveFnRef.current(updatedData);
    }, delay);
  }, [delay]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  return autoSave;
};

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
  { id: 'dark', name: 'Midnight Blue', color: '#0f172a' },
  { id: 'black', name: 'Solid Black', color: '#000000' },
];

const ThemeOption = memo(({ theme: t, isSelected, onClick }) => (
  <Box
    onClick={() => onClick(t.id)}
    sx={{
      width: 75,
      height: 75,
      borderRadius: 2,
      backgroundColor: t.color,
      cursor: 'pointer',
      border: isSelected ? '3px solid' : '1px solid transparent',
      borderColor: 'primary.main',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'scale(1.08)', boxShadow: '0 6px 15px rgba(0,0,0,0.2)' }
    }}
  >
    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, textAlign: 'center', fontSize: '0.65rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)', p: 0.5, lineHeight: 1.1 }}>
      {t.name}
    </Typography>
    {isSelected && (
      <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'primary.main', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <Save sx={{ fontSize: 12, color: 'white' }} />
      </Box>
    )}
  </Box>
));

const BackgroundOption = memo(({ bg, isSelected, onClick }) => (
  <Box
    onClick={() => onClick(bg.url)}
    sx={{
      width: 75,
      height: 75,
      borderRadius: 2,
      background: bg.url ? `url(${bg.url}) center/cover` : bg.preview,
      cursor: 'pointer',
      border: isSelected ? '3px solid' : '1px solid transparent',
      borderColor: 'primary.main',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'scale(1.08)', boxShadow: '0 6px 15px rgba(0,0,0,0.2)' }
    }}
  >
    {!bg.url && <Wallpaper sx={{ color: 'text.secondary', opacity: 0.5 }} />}
    <Typography 
      variant="caption" 
      sx={{ 
        position: 'absolute', bottom: 0, width: '100%', color: 'white', bgcolor: 'rgba(0,0,0,0.5)', fontWeight: 700, textAlign: 'center', fontSize: '0.65rem', p: 0.2
      }}
    >
      {bg.name}
    </Typography>
  </Box>
));

export default function AccountSettings({ user: initialUser, onUserUpdate, themeName, onUpdateTheme, bgImage, onUpdateBgImage, onBack }) {
  const { t, i18n: i18nInstance } = useTranslation();
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    autoSaveDrafts: true,
    signature: '',
    twoFactorEnabled: false,
    timezone: 'UTC',
    language: 'en',
    theme: themeName || 'default'
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', strength: 'weak' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [preferencesChanged, setPreferencesChanged] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const data = await QuMailService.getProfile();
      if (!data.success || !data.user) {
        throw new Error(data.message || "Failed to load profile");
      }
      const profileData = data.user;
      setUser(profileData);
      
      // Update form data with user data
      setFormData(prev => ({
        ...prev,
        name: profileData.name || '',
        email: profileData.email || '',
        emailNotifications: profileData.settings?.emailNotifications ?? true,
        autoSaveDrafts: profileData.settings?.autoSaveDrafts ?? true,
        signature: profileData.settings?.signature || '',
        twoFactorEnabled: profileData.settings?.twoFactorEnabled || false,
        timezone: profileData.settings?.timezone || 'UTC',
        language: profileData.settings?.language || 'en',
        theme: profileData.settings?.theme || themeName || 'default'
      }));
      
      if (profileData.avatar) {
        setAvatarPreview(profileData.avatar);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load profile. Please login again.' 
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [themeName]);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save preferences function
  const savePreferences = useCallback(async (data) => {
    try {
      setLoading(true);
      await QuMailService.updateProfile({
        name: data.name || formData.name,
        settings: {
          emailNotifications: data.emailNotifications ?? formData.emailNotifications,
          autoSaveDrafts: data.autoSaveDrafts ?? formData.autoSaveDrafts,
          signature: data.signature ?? formData.signature,
          twoFactorEnabled: data.twoFactorEnabled ?? formData.twoFactorEnabled,
          timezone: data.timezone ?? formData.timezone,
          language: data.language ?? formData.language,
          theme: data.theme ?? formData.theme
        }
      });
      
      setUser(prev => ({
        ...prev,
        settings: {
          ...(prev?.settings || {}),
          ...data
        }
      }));
      
      setPreferencesChanged(false);
      
      if (message.text === '') {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Save preferences error:', error);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // Initialize auto-save
  const autoSave = useAutoSave(savePreferences);

  // Handle preferences changes
  const handlePreferenceChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      setPreferencesChanged(true);
      
      if (field === 'language') {
        i18nInstance.changeLanguage(value);
      }

      if (field === 'theme' && onUpdateTheme) {
        onUpdateTheme(value);
      }

      if (!editing) {
        autoSave(updated);
      }
      
      return updated;
    });
  }, [editing, autoSave, i18nInstance, onUpdateTheme]);

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', strength: 'weak' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    
    let strength = 'weak';
    let text = 'Weak password';
    if (score >= 4) {
      strength = 'strong';
      text = 'Strong password';
    } else if (score >= 2) {
      strength = 'medium';
      text = 'Medium strength';
    }
    
    return { score: (score / 5) * 100, text, strength };
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (editing) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      
      if (formData.newPassword) {
        if (formData.newPassword.length < 8) {
          newErrors.newPassword = 'Password must be at least 8 characters';
        }
        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.currentPassword) {
          newErrors.currentPassword = 'Current password is required to change password';
        }
      }
      
      if (formData.currentPassword && !formData.newPassword) {
        newErrors.newPassword = 'Please enter a new password';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await QuMailService.updateProfile({
        name: formData.name.trim(),
        settings: {
          emailNotifications: formData.emailNotifications,
          autoSaveDrafts: formData.autoSaveDrafts,
          signature: formData.signature,
          twoFactorEnabled: formData.twoFactorEnabled,
          timezone: formData.timezone,
          language: formData.language
        }
      });
      
      if (!res.success) {
        setMessage({ type: 'error', text: res.message || 'Update failed' });
        setLoading(false);
        return;
      }
      
      if (formData.newPassword) {
        const passRes = await QuMailService.changePassword(formData.currentPassword, formData.newPassword);
        if (!passRes.success) {
          setMessage({ type: 'error', text: passRes.message || 'Change failed' });
          setLoading(false);
          return;
        }
      }
      
      await fetchProfile();
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
      setEditing(false);
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error(' Save error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await QuMailService.deleteAvatar();
      if (res.success) {
        setAvatarPreview(null);
        await fetchProfile();
        if (onUserUpdate) onUserUpdate({ ...user, avatar: '' });
        setMessage({ type: "success", text: "Profile photo removed!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to remove photo" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Delete failed" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be < 5MB" });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        const res = await QuMailService.uploadAvatar(base64Image);
        if (res.success) {
          setAvatarPreview(res.avatarUrl || base64Image);
          await fetchProfile();
          if (onUserUpdate) onUserUpdate({ ...user, avatar: res.avatarUrl || base64Image });
          setMessage({ type: "success", text: "Profile photo updated!" });
        } else {
          setMessage({ type: "error", text: res.message || "Avatar upload failed" });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setMessage({ type: "error", text: "Avatar upload failed" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        emailNotifications: user.settings?.emailNotifications ?? true,
        autoSaveDrafts: user.settings?.autoSaveDrafts ?? true,
        signature: user.settings?.signature || '',
        twoFactorEnabled: user.settings?.twoFactorEnabled || false,
        timezone: user.settings?.timezone || 'UTC',
        language: user.settings?.language || 'en',
        theme: user.settings?.theme || 'default'
      });
    }
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatStorage = (bytes) => {
  if (!bytes && bytes !== 0) return '0.00 GB';

  const GB = 1024 * 1024 * 1024;

  if (bytes >= GB) {
    const val = (bytes / GB);
    return `${val % 1 === 0 ? val : val.toFixed(2)} GB`;
  }

  const MB = 1024 * 1024;
  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(1)} MB`;
  }

  const KB = 1024;
  if (bytes >= KB) {
    return `${(bytes / KB).toFixed(1)} KB`;
  }

  return `${bytes} B`;
};


  const rawPercentage = user?.storageLimit 
    ? (user.storageUsed / user.storageLimit) * 100 
    : 0;
  const storagePercentage = (user?.storageUsed > 0 && rawPercentage < 2) ? 2 : rawPercentage;

  // Manual save preferences button
  const handleSavePreferences = async () => {
    await savePreferences(formData);
  };

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading profile...</Typography>
      </Box>
    );
  }

  // Show error state if no user data
  if (!user) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
        {onBack && (
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={onBack} 
            sx={{ mb: 2, borderRadius: 2 }}
            color="primary"
          >
            Back to Dashboard
          </Button>
        )}
        <Alert severity="error" sx={{ mt: 3 }}>
          {message.text || 'Failed to load profile data. Please check your connection and try again.'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchProfile}
          sx={{ mt: 2 }}
        >
          Retry Loading Profile
        </Button>
      </Box>
    );
  }



  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onBack && (
            <IconButton onClick={onBack} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }} color="primary">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" fontWeight="700" color="primary">
              {t('settings.account')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('settings.profileSub')}
            </Typography>
          </Box>
        </Box>
        {onBack && (
          <Tooltip title="Close Profile Settings">
            <IconButton onClick={onBack} sx={{ '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
              <Close />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Message Alert */}
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: 1
          }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Profile Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Person color="primary" />
            <Typography variant="h6" fontWeight="600">
              {t('settings.profile')}
            </Typography>
            {!editing ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                  sx={{ ml: 'auto' }}
                >
                  {t('settings.editProfile')}
                </Button>
              ) : (
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? t('common.saving') : t('common.save')}
                  </Button>
                </Box>
              )}
          </SectionHeader>

          <Grid container spacing={4}>
            {/* Avatar Section */}
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <ProfileAvatar
                    src={avatarPreview}
                    alt={user?.name || 'User'}
                  >
                    {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                  </ProfileAvatar>
                  <input
                    accept="image/*"
                    type="file"
                    id="avatar-upload"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar || loading}
                  />
                  <label htmlFor="avatar-upload">
                    <IconButton
                      component="span"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        zIndex: 2,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }}
                      disabled={isUploadingAvatar || loading}
                    >
                      {isUploadingAvatar ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CloudUpload fontSize="small" />
                      )}
                    </IconButton>
                  </label>
                  {avatarPreview && (
                    <IconButton
                      size="small"
                      onClick={handleAvatarDelete}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        bgcolor: 'background.paper',
                        color: 'error.main',
                        border: 1,
                        borderColor: 'divider',
                        zIndex: 2,
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white',
                        }
                      }}
                      disabled={isUploadingAvatar || loading}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" align="center">
                  {user?.email || 'No email'}
                </Typography>
                
                {user?.isVerified && (
                  <Chip
                    icon={<VerifiedUser />}
                    label="Verified"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Click camera to upload new photo
                </Typography>
              </Box>
            </Grid>

            {/* Form Section */}
            <Grid size={{ xs: 12, md: 8, lg: 9 }}>
              {editing ? (
                <>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={t('settings.name')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={!!errors.name}
                        helperText={errors.name}
                        margin="normal"
                        disabled={loading}
                        required
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={t('settings.email')}
                        type="email"
                        value={formData.email}
                        disabled={true}
                        margin="normal"
                        helperText={t('settings.emailLocked')}
                        required
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security fontSize="small" />
                      Change Password (Optional)
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Current Password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handlePasswordChange}
                          error={!!errors.currentPassword}
                          helperText={errors.currentPassword || 'Required only if changing password'}
                          margin="normal"
                          disabled={loading}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          type="password"
                          label="New Password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handlePasswordChange}
                          error={!!errors.newPassword}
                          helperText={errors.newPassword || 'Leave blank to keep current password'}
                          margin="normal"
                          disabled={loading}
                          placeholder="Minimum 8 characters"
                        />
                        {formData.newPassword && (
                          <>
                            <PasswordStrengthBar 
                              variant="determinate" 
                              value={passwordStrength.score} 
                              strength={passwordStrength.strength}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {passwordStrength.text}
                            </Typography>
                          </>
                        )}
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Confirm New Password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handlePasswordChange}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          margin="normal"
                          disabled={loading}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('settings.name')}
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {user?.name || 'Not set'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('settings.email')}
                      </Typography>
                      <Typography variant="body1">
                        {user?.email || 'Not set'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Account Created
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(user?.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Last Login
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(user?.lastLogin)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Preferences & Display Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Settings color="primary" />
            <Typography variant="h6" fontWeight="600">
               Preferences & Display
            </Typography>
            {preferencesChanged && !editing && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Save />}
                onClick={handleSavePreferences}
                disabled={loading}
                sx={{ ml: 'auto' }}
              >
                {loading ? <CircularProgress size={16} /> : t('settings.savePrefs')}
              </Button>
            )}
          </SectionHeader>

          <Grid container spacing={4}>
            {/* Language and Timezone */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" disabled={loading}>
                <InputLabel>{t('settings.language')}</InputLabel>
                <Select
                  value={formData.language}
                  label={t('settings.language')}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                >
                  <MenuItem value="en">English (US)</MenuItem>
                  <MenuItem value="hi">Hindi (हिन्दी)</MenuItem>
                  <MenuItem value="mr">Marathi (मराठी)</MenuItem>
                  <MenuItem value="ar">Arabic (العربية)</MenuItem>
                  <MenuItem value="es">Spanish (Español)</MenuItem>
                  <MenuItem value="fr">French (Français)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" disabled={loading}>
                <InputLabel>{t('settings.timezone')}</InputLabel>
                <Select
                  value={formData.timezone}
                  label={t('settings.timezone')}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="Asia/Kolkata">India Standard Time</MenuItem>
                  <MenuItem value="Europe/London">Greenwich Mean Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Themes Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                Choose Visual Theme
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                {themes.map((t) => (
                  <ThemeOption
                    key={t.id}
                    theme={t}
                    isSelected={formData.theme === t.id}
                    onClick={(id) => handlePreferenceChange('theme', id)}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                Application Background
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {commonBackgrounds.map((bg) => (
                  <BackgroundOption
                    key={bg.id}
                    bg={bg}
                    isSelected={bgImage === bg.url}
                    onClick={onUpdateBgImage}
                  />
                ))}
                
                {/* Custom Upload */}
                <Box
                  component="label"
                  htmlFor="bg-upload"
                  sx={{
                    width: 75,
                    height: 75,
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha(theme.palette.action.hover, 0.05),
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <AddPhotoAlternate fontSize="small" color="primary" />
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.5, fontWeight: 600 }}>
                    Custom
                  </Typography>
                  <input
                    id="bg-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => onUpdateBgImage(ev.target?.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <SectionHeader sx={{ borderBottom: 'none', mb: 1 }}>
                <Notifications color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="600">
                    Notifications & Security
                </Typography>
            </SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                 <FormControlLabel
                  control={
                    <Switch
                      checked={formData.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoSaveDrafts}
                      onChange={(e) => handlePreferenceChange('autoSaveDrafts', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Auto-save Drafts"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.twoFactorEnabled}
                      onChange={(e) => handlePreferenceChange('twoFactorEnabled', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="2FA Security"
                />
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mt: 3 }}>
             <Typography variant="subtitle2" color="text.secondary" gutterBottom>
               Email Signature
             </Typography>
             <TextField
               fullWidth
               multiline
               rows={3}
               variant="outlined"
               value={formData.signature}
               onChange={(e) => handlePreferenceChange('signature', e.target.value)}
               placeholder="Write your email signature here..."
               disabled={loading}
             />
          </Box>
        </CardContent>
      </StyledCard>

      {/* Account Stats Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Storage color="primary" />
            <Typography variant="h6" fontWeight="600">
              Account Statistics
            </Typography>
          </SectionHeader>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {user?.id || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  User Role
                </Typography>
                <Chip
                  label={user?.role || 'User'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Grid>
            
            <Grid size={12}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={storagePercentage} 
                    sx={{ 
                      flexGrow: 1, 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : alpha('#000', 0.05),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        backgroundImage: rawPercentage > 85 ? 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)' : 'none',
                        backgroundSize: '20px 20px'
                      }
                    }}
                    color={rawPercentage > 90 ? 'error' : rawPercentage > 70 ? 'warning' : 'primary'}
                  />
                  <Typography variant="body2" fontWeight="500">
                    {formatStorage(user?.storageUsed || 0)} / {formatStorage(user?.storageLimit || (15 * 1024 * 1024 * 1024))}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {rawPercentage.toFixed(2)}% used
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>
    </Box>
  );
}