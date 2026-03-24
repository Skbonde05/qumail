import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton, TextField, Grid, List, ListItem, ListItemText, Snackbar
} from '@mui/material';
import {
  Key, Refresh, Visibility, VisibilityOff, ContentCopy, History
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

export default function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [keysInfo, setKeysInfo] = useState({ otp: null, aes256: null });
  const [fullKeys, setFullKeys] = useState({ otp: '', aes256: '' });
  const [showKey, setShowKey] = useState({ otp: false, aes256: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const logsData = await QuMailService.getSecurityLogs();
      const keysData = await QuMailService.getEncryptionKeys();
      setLogs(logsData.logs || []);
      setKeysInfo(keysData.keys || {});
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

  return (
    <Box key="security-center" sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight="700" gutterBottom color="primary">Security Center</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Manage your encryption keys and monitor account activity.</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <StyledCard>
            <CardContent>
              <SectionHeader>
                <Key color="primary" />
                <Typography variant="h6" fontWeight="600">Encryption Keys</Typography>
              </SectionHeader>
              
              {['otp', 'aes256'].map(algo => (
                <Box key={algo} sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="subtitle2" fontWeight="700" sx={{ textTransform: 'uppercase' }}>{algo === 'otp' ? 'Quantum OTP' : 'AES-256-GCM'}</Typography>
                     <Chip label={keysInfo[algo]?.exists ? "Active" : "Not Set"} size="small" color={keysInfo[algo]?.exists ? "success" : "default"} />
                   </Box>
                   
                   <TextField
                      fullWidth
                      size="small"
                      type={showKey[algo] ? "text" : "password"}
                      value={showKey[algo] ? fullKeys[algo] : (keysInfo[algo]?.preview || '••••••••••••')}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" onClick={() => handleToggleShowKey(algo)}>{showKey[algo] ? <VisibilityOff /> : <Visibility />}</IconButton>
                            <IconButton size="small" onClick={() => copyToClipboard(fullKeys[algo] || keysInfo[algo]?.preview)}><ContentCopy sx={{ fontSize: 'small' }} /></IconButton>
                          </Box>
                        )
                      }}
                   />
                   
                   <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                     <Button size="small" startIcon={<Refresh />} onClick={() => handleRegenerate(algo)} disabled={loading}>Regenerate</Button>
                   </Box>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <StyledCard sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <SectionHeader>
                <History color="primary" />
                <Typography variant="h6" fontWeight="600">Security Logs</Typography>
              </SectionHeader>
              <List sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 400 }}>
                {logs.length === 0 ? (
                  <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 4 }}>No activity found</Typography>
                ) : (
                  logs.map((log, i) => (
                    <ListItem key={i} divider={i < logs.length - 1}>
                      <ListItemText 
                        primary={<Typography variant="body2" fontWeight="600">{log.action}</Typography>}
                        secondary={
                          <>
                            <Typography variant="caption" display="block">{log.details}</Typography>
                            <Typography variant="caption" color="text.disabled">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</Typography>
                          </>
                        }
                      />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: log.type === 'error' ? 'error.main' : log.type === 'warning' ? 'warning.main' : 'success.main' }} />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
}