// App.js - QUMAIL CLEAN ENTRY POINT
import React, { useState, useEffect } from "react";
import SplashScreen from './pages/SplashScreen';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import QuMailService from "./services/QuMailService";
import { lightTheme, darkTheme } from "./theme";

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('qumail_dark_mode') === 'true');
  const { enqueueSnackbar } = useSnackbar();

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
      // Give splash screen a bit of time
      // The splash screen now calls handleSplashFinish instead of a hardcoded timer here
    };
    checkAuth();
  }, [enqueueSnackbar]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const result = await QuMailService.login(email, password);
      if (result.success) {
        setUser(result.user);
        setLoggedIn(true);
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
        setUser(result.user);
        setLoggedIn(true);
        enqueueSnackbar(result.message, { variant: 'success' });
      } else {
        enqueueSnackbar(result.message, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Network error during registration', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await QuMailService.logout();
    setLoggedIn(false);
    setUser(null);
    enqueueSnackbar('Logged out successfully', { variant: 'info' });
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('qumail_dark_mode', !darkMode);
  };

  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {!loggedIn ? (
        showRegister ? (
          <Register 
            onRegister={handleRegister} 
            loading={loading} 
            onToggleLogin={() => setShowRegister(false)} 
          />
        ) : (
          <Login 
            onLogin={handleLogin} 
            loading={loading} 
            onToggleRegister={() => setShowRegister(true)} 
          />
        )
      ) : (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          darkMode={darkMode} 
          onToggleTheme={toggleTheme} 
        />
      )}
    </ThemeProvider>
  );
};

const App = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
    <AppContent />
  </SnackbarProvider>
);

export default App;