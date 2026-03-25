import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton, TextField, Grid, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import {
  Key, Refresh, Visibility, VisibilityOff, ContentCopy, History, Security, VerifiedUser, Lock, QrCode,
  Laptop, Smartphone, Tablet, Public, Language, Info, Warning, Error as ErrorIcon, CheckCircle
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import QuMailService from '../services/QuMailService';
import { formatDistanceToNow } from 'date-fns';

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

const DeviceIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'mobile': return <Smartphone sx={{ fontSize: 18, color: 'text.secondary' }} />;
    case 'tablet': return <Tablet sx={{ fontSize: 18, color: 'text.secondary' }} />;
    default: return <Laptop sx={{ fontSize: 18, color: 'text.secondary' }} />;
  }
};

const StatusBadge = ({ type }) => {
  switch (type) {
    case 'success': return <Chip size="small" label="Safe" color="success" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} sx={{ height: 20, fontSize: '0.7rem' }} />;
    case 'warning': return <Chip size="small" label="Warning" color="warning" icon={<Warning sx={{ fontSize: '14px !important' }} />} sx={{ height: 20, fontSize: '0.7rem' }} />;
    case 'error': return <Chip size="small" label="Critical" color="error" icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />} sx={{ height: 20, fontSize: '0.7rem' }} />;
    default: return <Chip size="small" label="Info" color="info" icon={<Info sx={{ fontSize: '14px !important' }} />} sx={{ height: 20, fontSize: '0.7rem' }} />;
  }
};

export default function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [keysInfo, setKeysInfo] = useState({ otp: null, aes256: null });
  const [user, setUser] = useState(null);
  const [fullKeys, setFullKeys] = useState({ otp: '', aes256: '' });
  const [showKey, setShowKey] = useState({ otp: false, aes256: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // 2FA Setup State
  const [openMfaSetup, setOpenMfaSetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, keysData, profileData] = await Promise.all([
        QuMailService.getSecurityLogs(),
        QuMailService.getEncryptionKeys(),
        QuMailService.getProfile()
      ]);
      setLogs(logsData.logs || []);
      setKeysInfo(keysData.keys || {});
      setUser(profileData.user || profileData);
    } catch (err) {
      console.error("Failed to fetch security data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowKey = async (algo) => {
    if (!showKey[algo] && !fullKeys[algo]) {
      try {
        const fullKeyData = await QuMailService.getFullEncryptionKey(algo);
        setFullKeys(prev => ({ ...prev, [algo]: fullKeyData.key }));
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to fetch full key' });
        return;
      }
    }
    setShowKey(prev => ({ ...prev, [algo]: !prev[algo] }));
  };

  const handleRegenerate = async (algo) => {
    if (!window.confirm(`Are you sure you want to regenerate your ${algo.toUpperCase()} key? Old content might become unreadable if you lose the old key.`)) return;
    setLoading(true);
    try {
      const result = await QuMailService.regenerateEncryptionKey(algo);
      setSnackbar({ open: true, message: `${algo.toUpperCase()} key regenerated!` });
      setFullKeys(prev => ({ ...prev, [algo]: result.newKey }));
      setShowKey(prev => ({ ...prev, [algo]: true }));
      await fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to regenerate key' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard!' });
  };

  // 2FA Logic
  const handleEnable2FA = async () => {
    setMfaSetupLoading(true);
    try {
      const res = await QuMailService.setup2FA();
      if (res.success) {
        setMfaQrCode(res.qrCode);
        setMfaSecret(res.secret);
        setOpenMfaSetup(true);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to initialize 2FA setup' });
    } finally {
      setMfaSetupLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setMfaError("Enter 6-digit code");
      return;
    }
    setMfaSetupLoading(true);
    setMfaError("");
    try {
      const res = await QuMailService.confirm2FA(mfaCode);
      if (res.success) {
        setOpenMfaSetup(false);
        setSnackbar({ open: true, message: '2FA Enabled successfully!' });
        await fetchData();
      } else {
        setMfaError(res.message || "Verification failed");
      }
    } catch (err) {
      setMfaError("System error. Try again.");
    } finally {
      setMfaSetupLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.")) return;
    setLoading(true);
    try {
      await QuMailService.updateProfile({ settings: { twoFactorEnabled: false } });
      setSnackbar({ open: true, message: '2FA Disabled' });
      await fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to disable 2FA' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box key="security-center" sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight="700" gutterBottom color="primary">Security Center</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Manage your encryption keys and monitor account activity across all devices.</Typography>

      <Grid container spacing={3}>
        {/* Left Column: Settings */}
        <Grid item xs={12} md={5}>
          {/* 2FA Section */}
          <StyledCard sx={{ 
            border: user?.settings?.twoFactorEnabled ? '1px solid #4caf50' : '1px solid #ff9800', 
            bgcolor: user?.settings?.twoFactorEnabled ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Security color={user?.settings?.twoFactorEnabled ? "success" : "warning"} sx={{ fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="600">Two-Factor Auth</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {user?.settings?.twoFactorEnabled 
                    ? "Your account is protected with TOTP." 
                    : "Require a code from your phone to login."}
                </Typography>
                {user?.settings?.twoFactorEnabled ? (
                  <Button variant="outlined" color="error" fullWidth size="small" onClick={handleDisable2FA} disabled={loading}>Disable Protection</Button>
                ) : (
                  <Button variant="contained" color="warning" fullWidth size="small" onClick={handleEnable2FA} disabled={loading}>Setup Secure Login</Button>
                )}
              </Box>
            </CardContent>
          </StyledCard>

          {/* Encryption Keys Section */}
          <StyledCard>
            <CardContent>
              <SectionHeader>
                <Key color="primary" />
                <Typography variant="h6" fontWeight="600">Encryption Keys</Typography>
              </SectionHeader>
              
              {['otp', 'aes256'].map(algo => (
                <Box key={algo} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                     <Typography variant="caption" fontWeight="700" sx={{ textTransform: 'uppercase', color: 'text.secondary' }}>{algo === 'otp' ? 'Quantum OTP' : 'AES-256-GCM'}</Typography>
                     <Chip label={keysInfo[algo]?.exists ? "Active" : "Not Set"} size="small" color={keysInfo[algo]?.exists ? "success" : "default"} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                   </Box>
                   
                   <TextField
                      fullWidth
                      size="small"
                      type={showKey[algo] ? "text" : "password"}
                      value={showKey[algo] ? fullKeys[algo] : (keysInfo[algo]?.preview || '••••••••••••')}
                      InputProps={{
                        readOnly: true,
                        style: { fontSize: '0.85rem', fontFamily: 'monospace' },
                        endAdornment: (
                          <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" onClick={() => handleToggleShowKey(algo)}>{showKey[algo] ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton>
                            <IconButton size="small" onClick={() => copyToClipboard(fullKeys[algo] || keysInfo[algo]?.preview)}><ContentCopy sx={{ fontSize: 16 }} /></IconButton>
                          </Box>
                        )
                      }}
                   />
                   
                   <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                     <Button size="small" startIcon={<Refresh />} onClick={() => handleRegenerate(algo)} disabled={loading} sx={{ fontSize: '0.7rem' }}>Regenerate</Button>
                   </Box>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Right Column: Detailed Activity Table */}
        <Grid item xs={12} md={7}>
          <StyledCard sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
              <Box sx={{ p: 2, pb: 0 }}>
                <SectionHeader>
                  <History color="primary" />
                  <Typography variant="h6" fontWeight="600">Security Activity Dashboard</Typography>
                </SectionHeader>
              </Box>

              <TableContainer sx={{ flexGrow: 1, maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: '700', bgcolor: 'background.paper', fontSize: '0.75rem' }}>EVENT / STATUS</TableCell>
                      <TableCell sx={{ fontWeight: '700', bgcolor: 'background.paper', fontSize: '0.75rem' }}>LOCATION</TableCell>
                      <TableCell sx={{ fontWeight: '700', bgcolor: 'background.paper', fontSize: '0.75rem' }}>DEVICE / BROWSER</TableCell>
                      <TableCell sx={{ fontWeight: '700', bgcolor: 'background.paper', fontSize: '0.75rem' }}>IP ADDRESS</TableCell>
                      <TableCell sx={{ fontWeight: '700', bgcolor: 'background.paper', fontSize: '0.75rem' }} align="right">TIME</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} padding="none">
                          <Box sx={{ py: 8, textAlign: 'center', color: 'text.disabled' }}>
                            <Public sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                            <Typography variant="body2">No security activity found</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, index) => (
                        <TableRow key={log._id || index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>{log.action.replace(/_/g, ' ')}</Typography>
                              <StatusBadge type={log.type} />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Language sx={{ fontSize: 14, color: 'primary.main' }} />
                              <Typography variant="caption" fontWeight="500">{log.location || 'Unknown'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <DeviceIcon type={log.deviceType} />
                                <Typography variant="caption" fontWeight="600">{log.browser || 'Unknown'}</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{log.os || 'Unknown OS'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={log.deviceInfo || 'No extra info'}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                {log.ipAddress || '0.0.0.0'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* MFA Setup Dialog */}
      <Dialog open={openMfaSetup} onClose={() => setOpenMfaSetup(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>Secure Your Mailbox</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom color="text.secondary">
              Scan the QR code with your preferred Authenticator app:
            </Typography>
            {mfaQrCode && (
              <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block', borderRadius: 2, border: 1, borderColor: 'divider', mt: 1 }}>
                <img src={mfaQrCode} alt="2FA QR Code" style={{ width: 180, height: 180 }} />
              </Box>
            )}
            <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
               <Typography variant="caption" color="text.secondary">Manual Key</Typography>
               <Typography variant="body2" fontWeight="700" sx={{ letterSpacing: 1 }}>{mfaSecret}</Typography>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Enter Verification Code</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ style: { textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold' } }}
            />
            {mfaError && <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>{mfaError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setOpenMfaSetup(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirm2FA} disabled={mfaSetupLoading || mfaCode.length < 6}>
            {mfaSetupLoading ? <CircularProgress size={24} color="inherit" /> : "Verify & Enable"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
}