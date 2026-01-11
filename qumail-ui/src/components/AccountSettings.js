import React, { useState, useEffect, useCallback } from 'react';
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
  Chip
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
  Notifications
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getProfile, updateProfile, changePassword } from '../services/accountApi';
import { uploadAvatar } from "../services/accountApi";
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
const useAutoSave = (saveFunction, delay = 1000) => {
  const [timeoutId, setTimeoutId] = useState(null);

  const autoSave = useCallback((updatedData) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      saveFunction(updatedData);
    }, delay);
    
    setTimeoutId(newTimeoutId);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId, delay, saveFunction]);

  return autoSave;
};

export default function AccountSettings() {
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
    timezone: 'UTC'
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', strength: 'weak' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [preferencesChanged, setPreferencesChanged] = useState(false);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      console.log('🔄 Starting to fetch profile...');
      
      const profileData = await getProfile();
      console.log('✅ Profile data loaded:', profileData);
      
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
        timezone: profileData.settings?.timezone || 'UTC'
      }));
      
      // Set avatar preview
      if (profileData.avatar) {
        setAvatarPreview(profileData.avatar);
      }
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to load profile. Please login again.' 
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Save preferences function
  const savePreferences = async (data) => {
    try {
      setLoading(true);
      await updateProfile({
        name: formData.name,
        settings: {
          emailNotifications: data.emailNotifications,
          autoSaveDrafts: data.autoSaveDrafts,
          signature: data.signature,
          twoFactorEnabled: data.twoFactorEnabled,
          timezone: data.timezone
        }
      });
      
      // Update user data
      const updatedUser = { ...user };
      if (!updatedUser.settings) updatedUser.settings = {};
      updatedUser.settings.emailNotifications = data.emailNotifications;
      updatedUser.settings.autoSaveDrafts = data.autoSaveDrafts;
      updatedUser.settings.signature = data.signature;
      updatedUser.settings.twoFactorEnabled = data.twoFactorEnabled;
      updatedUser.settings.timezone = data.timezone;
      setUser(updatedUser);
      
      setPreferencesChanged(false);
      
      // Show success message only if it's not an auto-save
      if (message.text === '') {
        setMessage({ 
          type: 'success', 
          text: 'Preferences saved successfully!' 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('❌ Save preferences error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save preferences' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize auto-save
  const autoSave = useAutoSave(savePreferences);

  // Handle preferences changes
  const handlePreferenceChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setPreferencesChanged(true);
    
    // Auto-save preferences (except when editing profile)
    if (!editing) {
      autoSave(updated);
    }
  };

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
      console.log('💾 Saving profile updates...');
      
      // Update profile
      await updateProfile({
        name: formData.name.trim(),
        settings: {
          emailNotifications: formData.emailNotifications,
          autoSaveDrafts: formData.autoSaveDrafts,
          signature: formData.signature,
          twoFactorEnabled: formData.twoFactorEnabled,
          timezone: formData.timezone
        }
      });
      
      // Change password if provided
      if (formData.newPassword) {
        console.log('🔐 Changing password...');
        await changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        });
      }
      
      // Refresh user data
      await fetchProfile();
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
      setEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('❌ Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setLoading(false);
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

        // ✅ SEND TO BACKEND
        await uploadAvatar(base64Image);

        setAvatarPreview(base64Image);
        await fetchProfile();

        setMessage({ type: "success", text: "Profile photo updated!" });
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
        timezone: user.settings?.timezone || 'UTC'
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
    return `${(bytes / GB).toFixed(2)} GB`; // ✅ always 2 decimals
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


  const storagePercentage = user?.storageLimit 
    ? (user.storageUsed / user.storageLimit) * 100 
    : 0;

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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom color="primary">
          Account Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your profile, security, and preferences
        </Typography>
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
              Profile Information
            </Typography>
            {!editing ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={() => setEditing(true)}
                sx={{ ml: 'auto' }}
              >
                Edit Profile
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
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            )}
          </SectionHeader>

          <Grid container spacing={4}>
            {/* Avatar Section */}
            <Grid item xs={12} md={4} lg={3}>
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
            <Grid item xs={12} md={8} lg={9}>
              {editing ? (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={!!errors.name}
                        helperText={errors.name}
                        margin="normal"
                        disabled={loading}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        disabled={true}
                        margin="normal"
                        helperText="Email cannot be changed"
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
                      <Grid item xs={12}>
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
                      
                      <Grid item xs={12} md={6}>
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
                      
                      <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Full Name
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {user?.name || 'Not set'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Email Address
                      </Typography>
                      <Typography variant="body1">
                        {user?.email || 'Not set'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
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

      {/* Preferences Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Notifications color="primary" />
            <Typography variant="h6" fontWeight="600">
              Preferences
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
                {loading ? <CircularProgress size={16} /> : 'Save Preferences'}
              </Button>
            )}
          </SectionHeader>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="500">Email Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive email notifications for important updates
                      </Typography>
                    </Box>
                  }
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoSaveDrafts}
                      onChange={(e) => handlePreferenceChange('autoSaveDrafts', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="500">Auto-save Drafts</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically save drafts as you compose
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.twoFactorEnabled}
                      onChange={(e) => handlePreferenceChange('twoFactorEnabled', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="500">Two-Factor Authentication</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add an extra layer of security to your account
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Email Signature
            </Typography>
            <TextField
              fullWidth
              value={formData.signature}
              onChange={(e) => handlePreferenceChange('signature', e.target.value)}
              multiline
              rows={3}
              disabled={loading}
              placeholder="Add a professional signature to your outgoing emails"
              variant="outlined"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Timezone
            </Typography>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="timezone-label">Select Timezone</InputLabel>
              <Select
                labelId="timezone-label"
                value={formData.timezone}
                label="Select Timezone"
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              >
                <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                <MenuItem value="America/New_York">EST (Eastern Time)</MenuItem>
                <MenuItem value="America/Chicago">CST (Central Time)</MenuItem>
                <MenuItem value="America/Denver">MST (Mountain Time)</MenuItem>
                <MenuItem value="America/Los_Angeles">PST (Pacific Time)</MenuItem>
                <MenuItem value="Europe/London">GMT (London)</MenuItem>
                <MenuItem value="Europe/Paris">CET (Central European Time)</MenuItem>
                <MenuItem value="Asia/Tokyo">JST (Japan Standard Time)</MenuItem>
                <MenuItem value="Asia/Kolkata">IST (India Standard Time)</MenuItem>
              </Select>
            </FormControl>
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
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {user?.id || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
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
            
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={storagePercentage} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color={storagePercentage > 90 ? 'error' : storagePercentage > 70 ? 'warning' : 'primary'}
                  />
                  <Typography variant="body2" fontWeight="500">
                    {formatStorage(user?.storageUsed || 0)} / {formatStorage(user?.storageLimit || 0)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {storagePercentage.toFixed(1)}% used
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>
    </Box>
  );
}