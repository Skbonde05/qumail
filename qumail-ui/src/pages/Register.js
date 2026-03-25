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
  Tooltip
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Mail,
  Lock,
  Person,
  Security,
  ContentCopy,
  Warning
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

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

export default function Register({ onRegister, loading, onToggleLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.toLowerCase().endsWith("@qumail.com")) {
      setError("Only @qumail.com addresses are supported");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const result = await onRegister(name, email, password, confirmPassword);
    if (result && result.success) {
      if (result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
        setShowRecoveryDialog(true);
      } else {
        onToggleLogin(); // Fallback if no code
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <Box sx={{ textAlign: "center", mb: 4 }}>
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
              Create QuMail Account
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Secure. Private. Quantum-ready.
            </Typography>
          </Box>

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Full Name"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="user@qumail.com"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
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
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
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
                "Create Account"
              )}
            </GradientButton>
          </form>

          {/* Footer */}
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2">
              Already have an account?{" "}
              <Link
                component="button"
                onClick={onToggleLogin}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </StyledPaper>
      </Container>

      {/* Recovery Code Dialog */}
      <Dialog 
        open={showRecoveryDialog} 
        disableEscapeKeyDown
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 }
        }}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') setShowRecoveryDialog(false);
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <Warning color="warning" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" fontWeight="700">
            Save Your Recovery Code
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <DialogContentText sx={{ mb: 3 }}>
            This is the <strong>only way</strong> to recover your account if you forget your password.
            QuMail is quantum-secure; we cannot reset it for you without this code.
          </DialogContentText>
          
          <Box 
            sx={{ 
              backgroundColor: "#f5f5f5", 
              p: 2, 
              borderRadius: "12px", 
              border: "2px dashed #1a73e8",
              fontFamily: "monospace",
              fontSize: "1.2rem",
              letterSpacing: "2px",
              fontWeight: "bold",
              color: "#1a73e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              cursor: "pointer",
              "&:hover": { backgroundColor: "#eef2ff" }
            }}
            onClick={handleCopy}
          >
            {recoveryCode}
            <Tooltip title={copied ? "Copied!" : "Copy Code"}>
              <IconButton size="small">
                <ContentCopy fontSize="small" color={copied ? "success" : "inherit"} />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => {
              setShowRecoveryDialog(false);
              onToggleLogin();
            }}
            sx={{ 
              borderRadius: "24px",
              background: "linear-gradient(45deg, #1a73e8 30%, #0d47a1 90%)",
              py: 1.5
            }}
          >
            I've Saved My Code - Sign In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
