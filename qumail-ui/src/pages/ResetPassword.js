// ResetPassword.js - Component for resetting password with token
import React, { useState, useEffect } from "react";
import config from "../config";
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
  useTheme
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock,
  Security,
  VerifiedUser,
  Error as ErrorIcon,
  CheckCircle,
  VpnKey
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";

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

export default function ResetPassword() {
  const theme = useTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validToken, setValidToken] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();
  const apiBase = config.apiUrl;

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifying(true);
        const res = await fetch(`${apiBase}/api/auth/verify-reset-token/${token}`);
        const data = await res.json();
        
        if (data.valid) {
          setValidToken(true);
        } else {
          setValidToken(false);
          setError("This password reset link is invalid or has expired.");
        }
      } catch (err) {
        setValidToken(false);
        setError("Failed to verify reset token. Please check your connection.");
      } finally {
        setVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setValidToken(false);
      setError("No reset token provided.");
      setVerifying(false);
    }
  }, [token, apiBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Your password has been reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BackgroundHero />
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>Verifying reset link...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: 'relative', overflow: 'hidden' }}>
      <BackgroundHero />
      <Container maxWidth="sm" sx={{ px: { xs: 2.5, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <StyledPaper>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                margin: "0 auto 20px",
                backgroundColor: !validToken ? theme.palette.error.main : theme.palette.primary.main,
                boxShadow: `0 8px 16px ${alpha(!validToken ? theme.palette.error.main : theme.palette.primary.main, 0.2)}`,
              }}
            >
              {!validToken ? <ErrorIcon sx={{ fontSize: 40, color: "white" }} /> : <Lock sx={{ fontSize: 40, color: "white" }} />}
            </Avatar>

            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-1.5px', mb: 1, fontSize: { xs: '2.2rem', sm: '2.8rem' } }}>
              {validToken ? "New Password" : "Reset Error"}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {validToken ? "Change your credentials securely" : "The reset link is no longer valid"}
            </Typography>
          </Box>

          {!validToken ? (
            <Box sx={{ textAlign: 'center' }}>
               <Alert severity="error" sx={{ mb: 4, borderRadius: '14px', textAlign: 'left' }}>
                  {error}
               </Alert>
               <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/login")}
                sx={{
                  borderRadius: "14px",
                  py: 1.5,
                  fontWeight: 700
                }}
              >
                Back to Authentication
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: '12px', icon: <CheckCircle /> }}>
                  {success}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Enter New Password"
                type={showPassword ? "text" : "password"}
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !!success}
                sx={{ mb: 2 }}
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

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !!success}
                sx={{ mb: 4 }}
                InputProps={{
                  sx: { borderRadius: '12px' },
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <ActionButton
                fullWidth
                type="submit"
                disabled={loading || !!success}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Update & Secure Account"
                )}
              </ActionButton>

              <Box sx={{ textAlign: "center", mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="text"
                  onClick={() => navigate("/login")}
                  sx={{ fontWeight: 600, color: 'text.secondary' }}
                  disabled={loading}
                >
                  Return to Login
                </Button>
              </Box>
            </form>
          )}
        </StyledPaper>
        
        <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary', opacity: 0.7 }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <VerifiedUser sx={{ fontSize: 14 }} /> Quantum-Safe Password Recovery Protocol
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}