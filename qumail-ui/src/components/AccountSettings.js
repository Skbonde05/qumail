import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Card,
  CardContent
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  CalendarToday,
  Edit,
  Save,
  Cancel,
  VerifiedUser,
  Storage,
  Badge
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

export default function AccountSettings({ user, onUpdateProfile, onUpdatePassword, loading = false }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    autoSaveDrafts: true,
    signature: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        emailNotifications: user.settings?.emailNotifications || true,
        autoSaveDrafts: user.settings?.autoSaveDrafts || true,
        signature: user.settings?.signature || ''
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (editing) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const updates = {
        name: formData.name.trim(),
        settings: {
          emailNotifications: formData.emailNotifications,
          autoSaveDrafts: formData.autoSaveDrafts,
          signature: formData.signature
        }
      };
      
      if (formData.newPassword) {
        updates.currentPassword = formData.currentPassword;
        updates.newPassword = formData.newPassword;
      }
      
      if (onUpdateProfile) {
        await onUpdateProfile(updates);
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: user?.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      emailNotifications: user?.settings?.emailNotifications || true,
      autoSaveDrafts: user?.settings?.autoSaveDrafts || true,
      signature: user?.settings?.signature || ''
    });
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          My Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your profile, security, and account preferences
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

      {/* Profile Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Person fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Profile Information
            </Typography>
            {!editing && (
              <Tooltip title="Edit Profile">
                <IconButton 
                  size="small" 
                  onClick={() => setEditing(true)}
                  sx={{ ml: 'auto' }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </SectionHeader>

          <Grid container spacing={3}>
            {/* Avatar Section */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '2.5rem',
                    bgcolor: 'primary.main',
                    mb: 2
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="body2" color="text.secondary" align="center">
                  {user?.email || 'No email'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <VerifiedUser fontSize="small" sx={{ color: 'success.main' }} />
                  <Typography variant="caption" color="success.main">
                    Account Verified
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Form Section */}
            <Grid item xs={12} md={9}>
              {editing ? (
                <>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={!!errors.name}
                    helperText={errors.name}
                    margin="normal"
                    disabled={loading}
                    InputProps={{
                      startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || ''}
                    disabled
                    margin="normal"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    helperText="Email cannot be changed"
                  />

                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'text.secondary' }}>
                    Change Password
                  </Typography>

                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword}
                    margin="normal"
                    disabled={loading}
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword || 'Leave blank to keep current password'}
                    margin="normal"
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    margin="normal"
                    disabled={loading}
                  />
                </>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1">
                      {user?.name || 'Not set'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email Address
                    </Typography>
                    <Typography variant="body1">
                      {user?.email || 'Not set'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account Created
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(user?.createdAt)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Login
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(user?.lastLogin) || 'Never'}
                    </Typography>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>

          {/* Edit Controls */}
          {editing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* Preferences Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <Storage fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Account Preferences
            </Typography>
          </SectionHeader>

          <FormControlLabel
            control={
              <Switch
                checked={formData.emailNotifications}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                disabled={!editing || loading}
              />
            }
            label={
              <Box>
                <Typography>Email Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive email notifications for new messages
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.autoSaveDrafts}
                onChange={(e) => setFormData({ ...formData, autoSaveDrafts: e.target.checked })}
                disabled={!editing || loading}
              />
            }
            label={
              <Box>
                <Typography>Auto-save Drafts</Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically save drafts as you compose
                </Typography>
              </Box>
            }
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Email Signature"
            value={formData.signature}
            onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
            multiline
            rows={3}
            disabled={!editing || loading}
            placeholder="Add a custom signature to your outgoing emails"
            helperText="This will be added to the end of all your outgoing emails"
          />
        </CardContent>
      </StyledCard>

      {/* Account Info Card */}
      <StyledCard>
        <CardContent>
          <SectionHeader>
            <VerifiedUser fontSize="small" />
            <Typography variant="h6" fontWeight="600">
              Account Information
            </Typography>
          </SectionHeader>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {user?.id || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Storage Used
                </Typography>
                <Typography variant="body2">
                  {user?.storageUsed ? `${(user.storageUsed / 1024 / 1024).toFixed(2)} MB` : '0 MB'} / 10 GB
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>
    </Box>
  );
}