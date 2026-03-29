// Login.js - QUMAIL LOGIN COMPONENT
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Mail,
  Lock,
  Security,
  VpnKey,
  History
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import QuMailService from "../services/QuMailService";

import { 
  Tabs, 
  Tab 
} from "@mui/material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2),
  },
  borderRadius: "24px",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  backgroundColor: theme.palette.mode === 'dark' ? alpha("#1a1f2e", 0.75) : alpha("#ffffff", 0.8),
  border: `1px solid ${theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
  boxShadow: theme.palette.mode === 'dark' ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 40px rgba(0, 0, 0, 0.08)",
}));

const ActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1.5),
  borderRadius: "14px",
  fontWeight: 700,
  textTransform: "none",
  fontSize: "1rem",
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  "&:hover": {
    transform: "translateY(-2px)",
    backgroundColor: theme.palette.primary.dark,
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  "&:active": {
    transform: "scale(0.98)",
  }
}));

const BackgroundHero = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
  backgroundColor: theme.palette.mode === 'dark' ? '#0a0e14' : '#f8fafc',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '300px',
    height: '300px',
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    filter: 'blur(120px)',
    borderRadius: '50%',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: '400px',
    height: '400px',
    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
    filter: 'blur(150px)',
    borderRadius: '50%',
  }
}));

export default function Login({ onLogin, onSwitchToRegister, loading }) {
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Forgot password state
  // Forgot password state
  const [openForgot, setOpenForgot] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: Email, 3: Success
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [resetType, setResetType] = useState('email'); // 'email' or 'recovery'
  const [recoveryCode, setRecoveryCode] = useState("");
  
  // MFA flow state
  const [openMfa, setOpenMfa] = useState(false);
  const [currentMfaToken, setCurrentMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your Qumail email and password");
      return;
    }

    if (!email.toLowerCase().endsWith('@qumail.com')) {
      setError("Only @qumail.com addresses are supported");
      return;
    }

    try {
      const result = await onLogin(email, password);
      // If result exists and mfaRequired is true, handle MFA
      if (result && result.mfaRequired) {
        setCurrentMfaToken(result.mfaToken);
        setOpenMfa(true);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  const handleMfaSubmit = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setMfaError("Please enter your 6-digit TOTP code");
      return;
    }

    setMfaLoading(true);
    setMfaError("");
    try {
      const res = await QuMailService.verify2FA(mfaCode, currentMfaToken);
      if (res.success) {
        setOpenMfa(false);
        // QuMailService.verify2FA already handles local storage tokens
        // Now just refresh page or navigate to home
        window.location.reload(); 
      } else {
        setMfaError(res.message || "Invalid code");
      }
    } catch (err) {
      setMfaError("MFA verification failed. Please try again.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail || !forgotEmail.toLowerCase().endsWith('@qumail.com')) {
      setForgotError("Please enter your registered @qumail.com address");
      return;
    }

    setForgotLoading(true);
    try {
      if (resetType === 'email') {
        const res = await QuMailService.forgotPassword(forgotEmail);
        if (res.success) {
          setForgotSuccess(res.message);
          setResetStep(3); // Success/Info message
        } else {
          setForgotError(res.message);
        }
      } else {
        // Recovery Code Flow
        if (!recoveryCode) {
          setForgotError("Please enter your recovery code");
          setForgotLoading(false);
          return;
        }
        const res = await QuMailService.verifyRecoveryCode(forgotEmail, recoveryCode);
        if (res.success && res.resetToken) {
           navigate(`/reset-password/${res.resetToken}`);
           closeForgotDialog();
        } else {
          setForgotError(res.message || "Invalid recovery code");
        }
      }
    } catch (err) {
      setForgotError("Connection error. Is the server running?");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotDialog = () => {
    setOpenForgot(false);
    setTimeout(() => {
      setResetStep(0);
      setForgotEmail("");
      setForgotError("");
      setForgotSuccess("");
    }, 300);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: 'relative', overflow: 'hidden' }}>
      <BackgroundHero />
      <Container maxWidth="sm" sx={{ px: { xs: 2.5, sm: 3 }, position: 'relative', zIndex: 1 }}>

        <StyledPaper>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                margin: "0 auto 20px",
                backgroundColor: theme.palette.primary.main,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Security sx={{ fontSize: 40, color: "white" }} />
            </Avatar>

            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-1.5px', mb: 1, fontSize: { xs: '2.2rem', sm: '3rem' } }}>
              Qumail
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              The future of secure communication
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@qumail.com"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: '12px' },
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 1 }}
              InputProps={{
                sx: { borderRadius: '12px' },
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setOpenForgot(true)}
                sx={{
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            <ActionButton
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign Into Your Account"
              )}
            </ActionButton>
          </form>

          {/* Create Account Section */}
          <Box sx={{ textAlign: "center", mt: 5, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
              Don't have a secure box yet?
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={onSwitchToRegister}
              sx={{
                borderRadius: "14px",
                py: 1.5,
                fontWeight: 700,
                "&:hover": {
                  borderWidth: '1.5px',
                  backgroundColor: theme => alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Create New Account
            </Button>
          </Box>
        </StyledPaper>
      </Container>


      {/* Forgot Password Dialog */}
      <Dialog 
        open={openForgot} 
        onClose={closeForgotDialog}
        PaperProps={{
          sx: { borderRadius: "16px", width: "100%", maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }} component="div">
          <Typography variant="h5" fontWeight="700">
            {resetStep === 3 ? "Account Recovered" : "Password Recovery"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          {resetStep === 0 && (
            <Box>
              <Tabs 
                value={resetType} 
                onChange={(e, val) => setResetType(val)} 
                sx={{ mb: 3, '& .MuiTabs-indicator': { height: 3, borderRadius: '3px' } }}
                variant="fullWidth"
              >
                <Tab icon={<Mail sx={{ fontSize: 20 }} />} label="EMAIL" value="email" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                <Tab icon={<VpnKey sx={{ fontSize: 20 }} />} label="RECOVERY CODE" value="recovery" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
              </Tabs>

              {resetType === 'email' ? (
                <>
                  <DialogContentText sx={{ mb: 3, textAlign: 'center', fontSize: '0.9rem' }}>
                    We'll send a secure link to your @qumail.com address.
                  </DialogContentText>
                  <TextField
                    fullWidth
                    label="Registered Email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@qumail.com"
                    InputProps={{
                      sx: { borderRadius: '12px' },
                      startAdornment: <InputAdornment position="start"><Mail color="primary" sx={{ fontSize: 20 }} /></InputAdornment>
                    }}
                  />
                </>
              ) : (
                <>
                  <DialogContentText sx={{ mb: 3, textAlign: 'center', fontSize: '0.9rem' }}>
                    Enter the master recovery code given during registration.
                  </DialogContentText>
                   <TextField
                    fullWidth
                    label="Email Address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@qumail.com"
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { borderRadius: '12px' },
                      startAdornment: <InputAdornment position="start"><Mail color="primary" sx={{ fontSize: 20 }} /></InputAdornment>
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Recovery Code"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="QU-XXXX-XXXX"
                    InputProps={{
                      sx: { borderRadius: '12px' },
                      startAdornment: <InputAdornment position="start"><VpnKey color="primary" sx={{ fontSize: 20 }} /></InputAdornment>
                    }}
                  />
                </>
              )}
            </Box>
          )}

          {resetStep === 3 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2, boxShadow: `0 4px 12px ${alpha('#10b981', 0.2)}` }}>
                <Mail sx={{ fontSize: 40, color: 'white' }} />
              </Avatar>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                Reset Link Sent
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                We've sent a recovery link to <strong>{forgotEmail}</strong>. 
                Please click the link in the email to set a new password.
              </Typography>
              <Alert severity="info" sx={{ borderRadius: '12px', textAlign: 'left' }}>
                Note: In this development environment, check the backend console logs to see the generated reset URL.
              </Alert>
            </Box>
          )}

          {(forgotError || forgotSuccess) && (
            <Alert 
              severity={forgotError ? "error" : "success"} 
              sx={{ mt: 3, borderRadius: '12px' }}
            >
              {forgotError || forgotSuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, px: 4 }}>
          {resetStep < 3 ? (
            <>
              <Button onClick={closeForgotDialog} color="inherit">Cancel</Button>
              <Box sx={{ flex: 1 }} />
              <Button 
                variant="contained" 
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                sx={{ 
                  borderRadius: "14px", px: 4, py: 1,
                  backgroundColor: theme.palette.primary.main
                }}
              >
                {forgotLoading ? <CircularProgress size={24} color="inherit" /> : (resetStep === 2 ? "Save Password" : "Next")}
              </Button>
            </>
          ) : (
            <Button 
              fullWidth 
              variant="contained" 
              onClick={closeForgotDialog}
              sx={{ borderRadius: "14px", py: 1.5, backgroundColor: theme.palette.primary.main }}
            >
              Back to Login
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* MFA Dialog */}
      <Dialog
        open={openMfa}
        onClose={() => { setOpenMfa(false); setMfaCode(''); setMfaError(''); }}
        PaperProps={{
          sx: { borderRadius: "24px", width: "100%", maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }} component="div">
          <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2, boxShadow: `0 8px 16px ${alpha('#2563eb', 0.2)}` }}>
            <Security sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
            Two-Factor Auth
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          <DialogContentText sx={{ mb: 3, textAlign: 'center', fontWeight: 500 }}>
            Enter the 6-digit code from your linked Authenticator app.
          </DialogContentText>
          <TextField
            fullWidth
            label="Verification Code"
            placeholder="123456"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: '800' } }}
            InputProps={{
              sx: { borderRadius: '14px' },
              startAdornment: <InputAdornment position="start"><VpnKey color="primary" /></InputAdornment>
            }}
            error={!!mfaError}
            helperText={mfaError}
          />

          {(mfaError || mfaLoading) && (
            <Alert
              severity={mfaError ? "error" : "info"}
              sx={{ mt: 3, borderRadius: '12px' }}
            >
              {mfaError || (mfaLoading ? "Verifying..." : "Verifying code...")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button onClick={() => { setOpenMfa(false); setMfaCode(''); setMfaError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={handleMfaSubmit}
            disabled={mfaLoading}
            sx={{
              borderRadius: "14px", px: 4, py: 1,
              backgroundColor: 'primary.main',
              fontWeight: 700
            }}
          >
            {mfaLoading ? <CircularProgress size={24} color="inherit" /> : "Verify & Login"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}