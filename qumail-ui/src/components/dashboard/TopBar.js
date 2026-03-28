import React, { memo } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Badge, Box, Avatar, Tooltip, InputBase, useTheme } from '@mui/material';
import { Menu as MenuIcon, Search, Brightness4, Brightness7, Notifications } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: "24px",
  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.04),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.06),
  },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(4),
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  maxWidth: '720px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid transparent`,
  '&:focus-within': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
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
    fontSize: '0.975rem',
    fontWeight: 500,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    },
  },
}));

const TopBar = memo(({ 
  user, 
  onDrawerToggle, 
  onProfileMenuOpen, 
  onNotificationsOpen, 
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
        backgroundImage: 'none'
      }}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        <IconButton color="inherit" edge="start" onClick={onDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { md: 240 } }}>
          <Box component="img" src="/qumail_logo.png" sx={{ height: 36, mr: 1.5 }} alt="QuMail Logo" />
          <Typography variant="h5" color="primary" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
            QuMail
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
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
          </SearchBar>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={darkMode ? "Appearance: Dark" : "Appearance: Light"}>
            <IconButton onClick={onToggleTheme} color="inherit">
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

          <Box 
            sx={{ 
              ml: 1, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              p: 0.5,
              pr: 1.5,
              borderRadius: '24px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: isProfileMenuOpen 
                ? (darkMode ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.primary.main, 0.08))
                : 'transparent',
              border: `1.5px solid ${isProfileMenuOpen 
                ? alpha(theme.palette.primary.main, 0.6) 
                : 'transparent'}`,
              boxShadow: isProfileMenuOpen 
                ? (darkMode ? 'none' : `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`)
                : 'none',
              '&:hover': {
                backgroundColor: isProfileMenuOpen 
                  ? (darkMode ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.primary.main, 0.08))
                  : (darkMode ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.primary.main, 0.04)),
              }
            }} 
            onClick={onProfileMenuOpen}
          >
            <Avatar 
              src={user?.avatar} 
              sx={{ 
                width: 34, 
                height: 34, 
                bgcolor: 'primary.main', 
                fontSize: '14px',
                border: theme => `2px solid ${darkMode ? alpha(theme.palette.common.white, 0.2) : 'white'}`,
                boxShadow: 1
              }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
            <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
               <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, lineHeight: 1, color: isProfileMenuOpen ? 'primary.main' : 'text.primary' }}>
                 {user?.name}
               </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
});


export default TopBar;
