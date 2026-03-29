import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import SplashScreen from "./components/SplashScreen";
import QuMailService from "./services/QuMailService";
import { getTheme } from "./theme";

import { MotionConfig } from "framer-motion";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));


const AppContent = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('qumail_dark_mode') === 'true');
  const [themeName, setThemeName] = useState(() => localStorage.getItem('qumail_theme_name') || 'default');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('qumail_bg_image') || null);
  const [animationLevel, setAnimationLevel] = useState(() => {
    const saved = localStorage.getItem('qumail_settings');
    try {
      return saved ? JSON.parse(saved).animationLevel || 'normal' : 'normal';
    } catch (e) { return 'normal'; }
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('qumail_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });
  const { enqueueSnackbar } = useSnackbar();

  const navigate = useNavigate();

  const currentTheme = useMemo(() => getTheme(darkMode ? 'dark' : 'light', themeName, !!bgImage), [darkMode, themeName, bgImage]);

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
            if (profile.user.settings?.bgImage) {
              setBgImage(profile.user.settings.bgImage);
            }
          } else {
            localStorage.removeItem('qumail_token');
            localStorage.removeItem('qumail_email');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setAuthChecked(true);
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
        if (result.user.settings?.bgImage) {
          setBgImage(result.user.settings.bgImage);
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

  const updateBgImage = (image) => {
    setBgImage(image);
    if (image) {
      localStorage.setItem('qumail_bg_image', image);
    } else {
      localStorage.removeItem('qumail_bg_image');
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    window.dispatchEvent(new CustomEvent('qumail-user-updated', { detail: updatedUser }));
  };

  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      const newSettings = e.detail || {};
      setSettings(newSettings);
      if (newSettings.animationLevel) {
        setAnimationLevel(newSettings.animationLevel);
      }
    };
    
    const onUserInternalUpdate = (e) => {
      if (e.detail) {
        setUser(e.detail);
      }
    };

    window.addEventListener('qumail-settings-updated', handleSettingsUpdate);
    window.addEventListener('qumail-user-updated', onUserInternalUpdate);
    return () => {
      window.removeEventListener('qumail-settings-updated', handleSettingsUpdate);
      window.removeEventListener('qumail-user-updated', onUserInternalUpdate);
    };
  }, []);



  const motionTransition = useMemo(() => ({
    duration: animationLevel === 'minimal' ? 0.1 : animationLevel === 'enhanced' ? 0.6 : 0.35,
    ease: [0.4, 0, 0.2, 1] // Professional cubic-bezier
  }), [animationLevel]);



  useEffect(() => {
    if (authChecked && animationDone) {
      setAppInitialized(true);
    }
  }, [authChecked, animationDone]);

  if (!appInitialized) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <SplashScreen onComplete={() => setAnimationDone(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Suspense fallback={
        <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }>
        <MotionConfig transition={motionTransition}>
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
                <Suspense fallback={
                  <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                }>
                  <Dashboard 
                    user={user} 
                    onUserUpdate={handleUserUpdate}
                    onLogout={handleLogout} 
                    darkMode={darkMode} 
                    onToggleTheme={toggleTheme} 
                    themeName={themeName}
                    onUpdateTheme={(name) => updateThemeName(name)}
                    bgImage={bgImage}
                    onUpdateBgImage={updateBgImage}
                  />
                </Suspense>
              )
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MotionConfig>
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