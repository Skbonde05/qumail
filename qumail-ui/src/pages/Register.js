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
  Tooltip,
  useTheme
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
import { styled, alpha } from "@mui/material/styles";

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


export default function Register({ onRegister, loading, onToggleLogin }) {
  const theme = useTheme();

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

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
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

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([`Qumail Account Recovery Code\n\nName: ${name}\nEmail: ${email}\nRecovery Code: ${recoveryCode}\n\nKeep this file safe and offline.`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `qumail_recovery_${email}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
              Register
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Join the quantum secure revolution
            </Typography>
          </Box>

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
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
              sx={{ mb: 1 }}
              InputProps={{
                sx: { borderRadius: '12px' },
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Qumail Address"
              type="email"
              placeholder="user@qumail.com"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              sx={{ mb: 1 }}
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
              label="Create Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
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

            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: '12px' },
              }}
            />

            <ActionButton
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Secure Account"
              )}
            </ActionButton>
          </form>

          {/* Footer */}
          <Box sx={{ textAlign: "center", mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Already have an account?{" "}
              <Link
                component="button"
                type="button"
                onClick={onToggleLogin}
                sx={{ fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Sign In
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
            Qumail is quantum-secure; we cannot reset it for you without this code.
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
        <DialogActions sx={{ p: 3, pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            fullWidth
            onClick={handleDownload}
            sx={{ borderRadius: "24px", py: 1 }}
          >
            Download Code as Text
          </Button>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => {
              setShowRecoveryDialog(false);
              onToggleLogin();
            }}
            sx={{ 
              borderRadius: "24px",
              backgroundColor: "primary.main",
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
