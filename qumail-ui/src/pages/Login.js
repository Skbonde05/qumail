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
  DialogContentText
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
  borderRadius: "24px",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  backgroundColor: theme.palette.mode === 'dark' ? alpha("#1a1f2e", 0.75) : alpha("#ffffff", 0.8),
  border: `1px solid ${theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
  boxShadow: theme.palette.mode === 'dark' ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 40px rgba(0, 0, 0, 0.08)",
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: "white",
  padding: theme.spacing(1.5),
  borderRadius: "14px",
  fontWeight: 700,
  textTransform: "none",
  fontSize: "1rem",
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
    filter: 'brightness(1.1)',
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
  background: theme.palette.mode === 'dark' 
    ? 'radial-gradient(circle at 20% 20%, #1e293b 0%, #0f172a 100%)'
    : 'radial-gradient(circle at 20% 20%, #eff6ff 0%, #dbeafe 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '300px',
    height: '300px',
    background: theme.palette.primary.main,
    filter: 'blur(120px)',
    opacity: 0.15,
    borderRadius: '50%',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: '400px',
    height: '400px',
    background: theme.palette.secondary.main,
    filter: 'blur(150px)',
    opacity: 0.1,
    borderRadius: '50%',
  }
}));

export default function Login({ onLogin, onSwitchToRegister, loading }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Forgot password state
  const [openForgot, setOpenForgot] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: Email, 1: Code/OTP, 2: New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetMode, setResetMode] = useState(0); // 0 for OTP, 1 for recovery code
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

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
      setError("Please enter your QuMail email and password");
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

    if (resetStep === 0) {
      if (!forgotEmail || !forgotEmail.toLowerCase().endsWith('@qumail.com')) {
        setForgotError("Please enter a valid @qumail.com address");
        return;
      }
      setForgotLoading(true);
      try {
        const res = await QuMailService.forgotPassword(forgotEmail);
        if (res.success) {
          setForgotSuccess(res.message);
          setResetStep(1);
        } else {
          setForgotError(res.message);
        }
      } catch (err) {
        setForgotError("Connection error");
      } finally {
        setForgotLoading(false);
      }
    } else if (resetStep === 1) {
      if (resetMode === 0 && (!otpCode || otpCode.length !== 6)) {
        setForgotError("Please enter the 6-digit code");
        return;
      }
      if (resetMode === 1 && !recoveryCode) {
        setForgotError("Please enter your recovery code");
        return;
      }

      setForgotLoading(true);
      try {
        const res = resetMode === 0 
          ? await QuMailService.verifyResetOTP(forgotEmail, otpCode)
          : await QuMailService.verifyRecoveryCode(forgotEmail, recoveryCode);
        
        if (res.success) {
          setResetToken(res.resetToken);
          setResetStep(2);
          setForgotSuccess("Identity verified! Now create a new password.");
        } else {
          setForgotError(res.message);
        }
      } catch (err) {
        setForgotError("Verification failed");
      } finally {
        setForgotLoading(false);
      }
    } else if (resetStep === 2) {
      if (newPassword.length < 8) {
        setForgotError("Password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setForgotError("Passwords do not match");
        return;
      }

      setForgotLoading(true);
      try {
        const res = await QuMailService.resetPassword(resetToken, newPassword);
        if (res.success) {
          setResetStep(3);
          setForgotSuccess("Account recovered! Your password has been updated.");
        } else {
          setForgotError(res.message);
        }
      } catch (err) {
        setForgotError("Failed to reset password");
      } finally {
        setForgotLoading(false);
      }
    }
  };

  const closeForgotDialog = () => {
    setOpenForgot(false);
    setTimeout(() => {
      setResetStep(0);
      setForgotEmail("");
      setOtpCode("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmNewPassword("");
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
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: theme => `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <Security sx={{ fontSize: 40, color: "white" }} />
            </Avatar>

            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-1.5px', mb: 1 }}>
              QuMail
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
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

            <GradientButton
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign Into Your Account"
              )}
            </GradientButton>
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
            <>
              <DialogContentText sx={{ mb: 3, textAlign: 'center' }}>
                Enter your @qumail.com email to start the recovery process.
              </DialogContentText>
              <TextField
                fullWidth
                label="Email Address"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoFocus
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Mail color="primary" /></InputAdornment>
                }}
              />
            </>
          )}

          {resetStep === 1 && (
            <>
              <Tabs 
                value={resetMode} 
                onChange={(e, val) => setResetMode(val)} 
                variant="fullWidth" 
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="6-Digit OTP" />
                <Tab label="Recovery Code" />
              </Tabs>
              
              <DialogContentText sx={{ mb: 3, textAlign: 'center' }}>
                {resetMode === 0 
                  ? "Enter the 6-digit code we sent to your email (check console)."
                  : "Enter the secure master recovery code given during registration."}
              </DialogContentText>

              {resetMode === 0 ? (
                <TextField
                  fullWidth
                  label="Verification Code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: '700' } }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Master Recovery Code"
                  placeholder="QU-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><VpnKey color="primary" /></InputAdornment>
                  }}
                />
              )}
            </>
          )}

          {resetStep === 2 && (
            <>
              <DialogContentText sx={{ mb: 3, textAlign: 'center' }}>
                Identity verified. Please choose a strong new password.
              </DialogContentText>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment>
                }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </>
          )}

          {resetStep === 3 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <History sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="body1" fontWeight="500">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </Typography>
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
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
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
              sx={{ borderRadius: "14px", py: 1.5, background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}
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
          <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2, boxShadow: theme => `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}` }}>
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
              background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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