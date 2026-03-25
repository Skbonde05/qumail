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
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { 
  Tabs, 
  Tab 
} from "@mui/material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #1a73e8 30%, #0d47a1 90%)",
  color: "white",
  padding: theme.spacing(1.5),
  borderRadius: "24px",
  fontWeight: 600,
  textTransform: "none",
  fontSize: "1rem",
  "&:hover": {
    background: "linear-gradient(45deg, #0d47a1 30%, #1a73e8 90%)",
  },
}));

export default function Login({ onLogin, onSwitchToRegister, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Forgot password state
  const [openForgot, setOpenForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [resetMode, setResetMode] = useState(0); // 0 for email, 1 for recovery code
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

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
    await onLogin(email, password);
  } catch (err) {
    setError("Login failed. Please try again.");
  }
};

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail || !forgotEmail.toLowerCase().endsWith('@qumail.com')) {
      setForgotError("Please enter a valid @qumail.com address");
      return;
    }

    if (resetMode === 1 && !recoveryCode) {
      setForgotError("Please enter your recovery code");
      return;
    }

    setForgotLoading(true);

    try {
      const endpoint = resetMode === 0 ? "forgot-password" : "verify-recovery-code";
      const body = resetMode === 0 
        ? { email: forgotEmail } 
        : { email: forgotEmail, recoveryCode: recoveryCode };

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        if (resetMode === 1) {
          setForgotSuccess("Code verified! Redirecting to password reset...");
          setTimeout(() => {
            setOpenForgot(false);
            navigate(`/reset-password/${data.resetToken}`);
          }, 1500);
        } else {
          setForgotSuccess("If that email is in our system, a reset link will be sent.");
          setTimeout(() => {
            setOpenForgot(false);
            setForgotEmail("");
            setForgotSuccess("");
          }, 3000);
        }
      } else {
        setForgotError(data.message || "Request failed. Please check your details.");
      }
    } catch (err) {
      setForgotError("Network error. Please try again.");
      console.error(err);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container maxWidth="sm">
        <StyledPaper>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: "0 auto 16px",
                background: "linear-gradient(45deg, #1a73e8 30%, #0d47a1 90%)",
              }}
            >
              <Security sx={{ fontSize: 48, color: "white" }} />
            </Avatar>

            <Typography variant="h4" fontWeight="700" gutterBottom>
              QuMail Login
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Secure. Private. Quantum-ready.
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@qumail.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right", mt: 1, mb: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setOpenForgot(true)}
                sx={{
                  textDecoration: "none",
                  color: "#1a73e8",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            <GradientButton
              fullWidth
              type="submit"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </GradientButton>
          </form>

          {/* Create Account Section */}
          <Box sx={{ textAlign: "center", mt: 4, pt: 3, borderTop: "1px solid #e0e0e0" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              New to QuMail?
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={onSwitchToRegister}
              sx={{
                borderRadius: "24px",
                borderColor: "#1a73e8",
                color: "#1a73e8",
                "&:hover": {
                  borderColor: "#0d47a1",
                  backgroundColor: "rgba(26, 115, 232, 0.04)",
                },
              }}
            >
              Create Account
            </Button>
          </Box>
        </StyledPaper>
      </Container>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={openForgot} 
        onClose={() => setOpenForgot(false)}
        PaperProps={{
          sx: { borderRadius: "16px" }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Reset Password
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Tabs 
            value={resetMode} 
            onChange={(e, val) => setResetMode(val)} 
            variant="fullWidth" 
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<Mail />} label="Email Link" />
            <Tab icon={<VpnKey />} label="Recovery Code" />
          </Tabs>

          <DialogContentText sx={{ mb: 2 }}>
            {resetMode === 0 
              ? "Enter your @qumail.com address to receive a reset link."
              : "Use your secure recovery code to reset your password immediately."}
          </DialogContentText>
          
          {forgotError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {forgotError}
            </Alert>
          )}
          
          {forgotSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {forgotSuccess}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="QuMail Address"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="yourname@qumail.com"
            sx={{ mb: resetMode === 1 ? 2 : 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail />
                </InputAdornment>
              ),
            }}
          />

          {resetMode === 1 && (
            <TextField
              fullWidth
              label="Recovery Code"
              variant="outlined"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              placeholder="QU-XXXX-XXXX"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <History />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => {
              setOpenForgot(false);
              setForgotEmail("");
              setForgotError("");
              setForgotSuccess("");
            }}
            sx={{ borderRadius: "12px" }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleForgotPassword}
            disabled={forgotLoading}
            sx={{ 
              borderRadius: "12px",
              background: "linear-gradient(45deg, #1a73e8 30%, #0d47a1 90%)",
            }}
          >
            {forgotLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}