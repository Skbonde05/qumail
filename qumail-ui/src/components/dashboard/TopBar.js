import React, { memo } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Badge, Box, Avatar, Tooltip, InputBase, useTheme } from '@mui/material';
import { Menu as MenuIcon, Search, Brightness4, Brightness7, Notifications, FlashOn as Zap, Close, Settings } from '@mui/icons-material';
import { styled, alpha, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
`;

const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: "24px",
  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.04),
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(4),
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  maxWidth: '720px',
  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid transparent`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.06),
    boxShadow: '0 1px 1px rgba(0,0,0,0.24), 0 1px 2px rgba(0,0,0,0.12)',
  },
  '&:focus-within': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 1px rgba(0,0,0,0.24), 0 1px 2px rgba(0,0,0,0.12)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  [theme.breakpoints.down('md')]: {
     marginLeft: theme.spacing(1),
     maxWidth: 'none',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
    fontSize: '1rem',
    fontWeight: 400,
  },
}));

const TopBar = memo(({ 
  user, 
  onDrawerToggle, 
  onProfileMenuOpen, 
  onNotificationsOpen, 
  onSettingsOpen,
  unreadNotifications, 
  darkMode, 
  onToggleTheme,
  isProfileMenuOpen,
  searchQuery,
  onSearchChange
}) => {
  const theme = useTheme();

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton color="inherit" edge="start" onClick={onDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { md: 240 } }}>
           <Typography variant="h4" color="primary" noWrap component="div" sx={{ 
             fontWeight: 900, 
             letterSpacing: '-1.5px', 
             display: 'flex', 
             alignItems: 'center', 
             gap: 1.5,
             fontSize: '1.85rem'
           }}>
            <Box component="img" src="/qumail_logo.png" sx={{ height: 34 }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Qumail</Box>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: { xs: 'flex-start', sm: 'center' } }}>
          <SearchBar>
            <SearchIconWrapper>
               <Search fontSize="small" />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search in mail"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <IconButton 
                size="small" 
                onClick={() => onSearchChange('')}
                sx={{ mr: 0.5, color: 'text.secondary' }}
              >
                <Close fontSize="small" />
              </IconButton>
            )}
          </SearchBar>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={darkMode ? "Dark Mode" : "Light Mode"}>
            <IconButton onClick={onToggleTheme} color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={onNotificationsOpen}>
              <Badge badgeContent={unreadNotifications} color="error" variant="dot">
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={onSettingsOpen}>
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box 
            sx={{ 
              ml: 1, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              p: 0.5,
              borderRadius: '24px',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
              }
            }} 
            onClick={onProfileMenuOpen}
          >
            <Avatar 
              src={user?.avatar} 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main', 
                fontSize: '14px',
                border: theme => `1px solid ${theme.palette.divider}`,
              }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

export default TopBar;
