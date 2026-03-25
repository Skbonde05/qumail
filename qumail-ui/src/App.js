import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import Login from "./pages/Login";
import Register from "./pages/Register";
import QuMailService from "./services/QuMailService";
import { getTheme } from "./theme";

const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const AppContent = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('qumail_dark_mode') === 'true');
  const [themeName, setThemeName] = useState(() => localStorage.getItem('qumail_theme_name') || 'default');
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const currentTheme = useMemo(() => getTheme(darkMode ? 'dark' : 'light', themeName), [darkMode, themeName]);

  // Load user profile if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('qumail_token');
      if (token) {
        try {
          const profile = await QuMailService.getProfile();
          if (profile.success) {
            setUser(profile.user);
            setLoggedIn(true);
            // Sync theme from user settings if available
            if (profile.user.settings?.theme) {
              setThemeName(profile.user.settings.theme);
            }
          } else {
            localStorage.removeItem('qumail_token');
            localStorage.removeItem('qumail_email');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
    };
    checkAuth();
  }, [enqueueSnackbar]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const result = await QuMailService.login(email, password);
      if (result.success) {
        if (result.mfaRequired) {
          return result;
        }
        setUser(result.user);
        if (result.user.settings?.theme) {
          setThemeName(result.user.settings.theme);
        }
        setLoggedIn(true);
        navigate("/");
        enqueueSnackbar(result.message, { variant: 'success' });
      } else {
        enqueueSnackbar(result.message, { variant: 'error' });
      }
      return result;
    } catch (error) {
      enqueueSnackbar('Network error during login', { variant: 'error' });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password, confirmPassword) => {
    setLoading(true);
    try {
      const result = await QuMailService.register(name, email, password, confirmPassword);
      if (result.success) {
        enqueueSnackbar('Account created successfully!', { variant: 'success' });
        return result; // Return so Register.js can show recovery code
      } else {
        enqueueSnackbar(result.message, { variant: 'error' });
        return result;
      }
    } catch (error) {
      enqueueSnackbar('Network error during registration', { variant: 'error' });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await QuMailService.logout();
    setLoggedIn(false);
    setUser(null);
    navigate("/login");
    enqueueSnackbar('Logged out successfully', { variant: 'info' });
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('qumail_dark_mode', !darkMode);
  };

  const updateThemeName = (name) => {
    setThemeName(name);
    localStorage.setItem('qumail_theme_name', name);
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      }>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/login" element={
            loggedIn ? <Navigate to="/" /> : (
              <Login 
                onLogin={handleLogin} 
                loading={loading} 
                onSwitchToRegister={() => {
                  setShowRegister(true);
                  navigate("/register");
                }} 
              />
            )
          } />
          <Route path="/register" element={
            loggedIn ? <Navigate to="/" /> : (
              <Register 
                onRegister={handleRegister} 
                loading={loading} 
                onToggleLogin={() => {
                  setShowRegister(false);
                  navigate("/login");
                }} 
              />
            )
          } />
          <Route path="/" element={
            !loggedIn ? (
              showRegister ? (
                <Navigate to="/register" />
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Dashboard 
                user={user} 
                onLogout={handleLogout} 
                darkMode={darkMode} 
                onToggleTheme={toggleTheme} 
                themeName={themeName}
                onUpdateTheme={(name) => updateThemeName(name)}
              />
            )
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};

const App = () => (
  <Router>
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <AppContent />
    </SnackbarProvider>
  </Router>
);

export default App;