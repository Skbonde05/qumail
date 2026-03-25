// App.js - QUMAIL CLEAN ENTRY POINT
import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import QuMailService from "./services/QuMailService";
import { lightTheme, darkTheme } from "./theme";

const AppContent = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('qumail_dark_mode') === 'true');
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

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
        setUser(result.user);
        setLoggedIn(true);
        navigate("/");
        enqueueSnackbar(result.message, { variant: 'success' });
      } else {
        enqueueSnackbar(result.message, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Network error during login', { variant: 'error' });
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

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
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
            />
          )
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
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