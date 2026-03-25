import React, { memo } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Badge, Box, Avatar, Tooltip, InputBase } from '@mui/material';
import { Menu as MenuIcon, Search, Brightness4, Brightness7, Notifications } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: "12px",
  backgroundColor: alpha(theme.palette.text.primary, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(1),
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  maxWidth: '600px',
  transition: 'all 0.2s ease',
  [theme.breakpoints.down('sm')]: {
     marginLeft: theme.spacing(0),
     maxWidth: 'none',
     backgroundColor: 'transparent',
     '&:hover': { backgroundColor: 'transparent' }
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
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '0.95rem',
    [theme.breakpoints.down('sm')]: {
      paddingLeft: `calc(1em + ${theme.spacing(3)})`,
      width: '0px',
      '&:focus': {
        width: '100%',
        backgroundColor: alpha(theme.palette.text.primary, 0.05),
        borderRadius: '8px',
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      }
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
  searchQuery,
  onSearchChange
}) => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => ({ 
          xs: theme.zIndex.drawer - 1, 
          md: theme.zIndex.drawer + 1 
        }), 
        bgcolor: 'background.paper', 
        color: 'text.primary', 
        borderBottom: 1, 
        borderColor: 'divider', 
        boxShadow: 'none' 
      }}
    >
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box component="img" src="/qumail_logo.png" sx={{ height: 32, mr: 1, display: { xs: 'none', sm: 'block' } }} alt="QuMail Logo" />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
            QuMail
          </Typography>
        </Box>

        <SearchBar>
          <SearchIconWrapper>
            <Search />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search emails..."
            inputProps={{ 'aria-label': 'search' }}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </SearchBar>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton onClick={onToggleTheme} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={onNotificationsOpen}>
              <Badge badgeContent={unreadNotifications} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton onClick={onProfileMenuOpen} sx={{ ml: 1 }}>
              <Avatar 
                src={user?.avatar} 
                sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '14px' }}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

export default TopBar;
