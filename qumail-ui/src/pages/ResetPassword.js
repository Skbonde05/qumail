// ResetPassword.js - Component for resetting password with token
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock,
  Security,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2),
  },
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

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validToken, setValidToken] = useState(true);
  
  const { token } = useParams();
  const navigate = useNavigate();

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify-reset-token/${token}`);
        const data = await res.json();
        
        if (!data.valid) {
          setValidToken(false);
          setError("This password reset link is invalid or has expired.");
        }
      } catch (err) {
        setValidToken(false);
        setError("Failed to verify reset token.");
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Password has been reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
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

              <Typography variant="h5" fontWeight="700" gutterBottom color="error">
                Invalid Reset Link
              </Typography>

              <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                {error || "This password reset link is invalid or has expired."}
              </Alert>

              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  borderRadius: "24px",
                  background: "linear-gradient(45deg, #1a73e8 30%, #0d47a1 90%)",
                }}
              >
                Back to Login
              </Button>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

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
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                margin: "0 auto 16px",
                background: "linear-gradient(45deg, #1a73e8 30%, #0d47a1 90%)",
              }}
            >
              <Lock sx={{ fontSize: { xs: 32, sm: 48 }, color: "white" }} />
            </Avatar>

            <Typography variant="h4" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
              Reset Password
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Enter your new password below
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <TextField
              fullWidth
              label="New Password"
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

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <GradientButton
              fullWidth
              type="submit"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Reset Password"
              )}
            </GradientButton>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate("/login")}
                sx={{ color: "#1a73e8" }}
              >
                Back to Login
              </Button>
            </Box>
          </form>
        </StyledPaper>
      </Container>
    </Box>
  );
}