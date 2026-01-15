import React, { useState } from "react";
import {
  Box,
  Button,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  LinearProgress,
  Chip,
  Paper,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Create,
  Inbox,
  Send,
  Drafts,
  Delete,
  Star,
  LabelImportant,
  Schedule,
  Archive,
  Report,
  Add,
  ExitToApp,
  Settings,
  Brightness4,
  Brightness7,
  HelpOutline,
  InfoOutlined,
  Security,
  AccountCircle,
  KeyboardArrowDown,
  VerifiedUser,
  Storage,
  Upgrade
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const StyledListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: "0 20px 20px 0",
  marginRight: theme.spacing(2),
  backgroundColor: selected 
    ? theme.palette.mode === 'dark' 
      ? theme.palette.primary.dark + '40' 
      : theme.palette.primary.light + '40' 
    : "transparent",
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: selected 
      ? theme.palette.mode === 'dark' 
        ? theme.palette.primary.dark + '40'
        : theme.palette.primary.light + '40'
      : theme.palette.mode === 'dark' 
        ? theme.palette.action.hover
        : theme.palette.grey[100],
  },
  "& .MuiListItemIcon-root": {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: "40px"
  }
}));

const SidebarItem = ({ icon: Icon, text, count, selected, onClick }) => {
  const theme = useTheme();
  
  return (
    <StyledListItem selected={selected} onClick={onClick}>
      <ListItemIcon>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText 
        primary={text}
        primaryTypographyProps={{
          fontSize: "0.875rem",
          fontWeight: selected ? "600" : "400",
          color: selected ? theme.palette.primary.main : "inherit"
        }}
      />
      {count > 0 && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: "600",
            mr: 1,
            color: selected ? theme.palette.primary.main : theme.palette.text.secondary
          }}
        >
          {count}
        </Typography>
      )}
    </StyledListItem>
  );
};

const ProfileMenuPaper = styled(Paper)(({ theme }) => ({
  width: 360,
  marginTop: theme.spacing(0.5),
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[8],
  backgroundImage: 'none'
}));

const StorageProgress = styled(LinearProgress)(({ theme, value }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 3,
    backgroundColor: value > 90 ? theme.palette.error.main : 
                     value > 70 ? theme.palette.warning.main : 
                     theme.palette.success.main
  }
}));

export default function Sidebar({ 
  onCompose, 
  activeSection, 
  setActiveSection,
  emailStats = {},
  userEmail,
  userAvatar,
  onLogout,
  darkMode,
  onToggleTheme,
  labels = [],
  onCreateLabel,
  onSelectLabel,
  onOpenSettings,
  onOpenProfile,
  onOpenSecurity,
  onOpenHelp,
  onOpenAbout
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const folderCounts = {
    inbox: 0,
    starred: 0,
    snoozed: 0,
    important: 0,
    sent: 0,
    drafts: 0,
    archive: 0,
    spam: 0,
    trash: 0,
    ...emailStats
  };

  const sections = [
    { id: "inbox", icon: Inbox, text: "Inbox", count: folderCounts.inbox },
    { id: "starred", icon: Star, text: "Starred", count: folderCounts.starred },
    { id: "snoozed", icon: Schedule, text: "Snoozed", count: folderCounts.snoozed },
    { id: "important", icon: LabelImportant, text: "Important", count: folderCounts.important },
    { id: "sent", icon: Send, text: "Sent", count: folderCounts.sent },
    { id: "drafts", icon: Drafts, text: "Drafts", count: folderCounts.drafts },
    { id: "archive", icon: Archive, text: "Archive", count: folderCounts.archive },
    { id: "spam", icon: Report, text: "Spam", count: folderCounts.spam },
    { id: "trash", icon: Delete, text: "Trash", count: folderCounts.trash },
  ];

  const defaultLabels = [
    { id: "work", name: "Work", color: "#4285f4" },
    { id: "personal", name: "Personal", color: "#34a853" },
    { id: "travel", name: "Travel", color: "#fbbc04" },
    { id: "finance", name: "Finance", color: "#ea4335" },
  ];

  const labelList = labels.length > 0 ? labels : defaultLabels;

  const handleLabelClick = (label) => {
    if (onSelectLabel) {
      onSelectLabel(label.id || label.name);
    } else {
      setActiveSection(`label:${label.id || label.name}`);
    }
  };

  const handleCreateLabel = () => {
    if (onCreateLabel) {
      onCreateLabel();
    } else {
      const labelName = prompt("Enter new label name:");
      if (labelName) {
        alert(`Label "${labelName}" created! (This is a demo)`);
      }
    }
  };

  const handleProfileMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenSettings = () => {
    handleProfileMenuClose();
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  const handleOpenProfile = () => {
    handleProfileMenuClose();
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  const handleOpenSecurity = () => {
    handleProfileMenuClose();
    if (onOpenSecurity) {
      onOpenSecurity();
    }
  };

  const handleOpenHelp = () => {
    handleProfileMenuClose();
    if (onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleOpenAbout = () => {
    handleProfileMenuClose();
    if (onOpenAbout) {
      onOpenAbout();
    }
  };

  const handleSignOut = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  const storageUsed = 2.5;
  const storageTotal = 15;
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <Box sx={{ 
      width: 280,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      borderRight: `1px solid ${theme.palette.divider}`,
      bgcolor: "background.paper"
    }}>
      {/* Compose Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Create />}
          onClick={onCompose}
          sx={{
            borderRadius: "24px",
            py: 1.5,
            textTransform: "none",
            fontSize: "0.9375rem",
            fontWeight: "600",
            boxShadow: theme.shadows[1],
            "&:hover": {
              boxShadow: theme.shadows[2],
              transform: "translateY(-1px)",
              transition: "transform 0.2s"
            }
          }}
        >
          Compose
        </Button>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        <List disablePadding>
          {sections.map((section) => (
            <SidebarItem
              key={section.id}
              icon={section.icon}
              text={section.text}
              count={section.count}
              selected={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Labels */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="600" letterSpacing={0.5}>
            LABELS
          </Typography>
        </Box>
        <List disablePadding>
          {labelList.map((label) => {
            const isSelected = activeSection === `label:${label.id || label.name}`;
            return (
              <StyledListItem 
                key={label.id || label.name}
                selected={isSelected}
                onClick={() => handleLabelClick(label)}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: label.color,
                      ml: 1.5
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={label.name}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? "600" : "400"
                  }}
                />
                {label.count > 0 && (
                  <Typography variant="caption" sx={{ fontWeight: "600", mr: 1 }}>
                    {label.count}
                  </Typography>
                )}
              </StyledListItem>
            );
          })}
          <StyledListItem onClick={handleCreateLabel}>
            <ListItemIcon>
              <Add fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Create new label"
              primaryTypographyProps={{
                fontSize: "0.875rem",
                color: theme.palette.primary.main
              }}
            />
          </StyledListItem>
        </List>
      </Box>

      {/* User Profile with Dropdown */}
      <Box sx={{ 
        mt: "auto",
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        gap: 1,
        position: "relative"
      }}>
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.5, 
            flex: 1,
            cursor: "pointer",
            '&:hover': { 
              '& .avatar': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s'
              }
            }
          }}
          onClick={handleProfileMenuClick}
        >
          <Avatar 
            className="avatar"
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: theme.palette.primary.main,
              fontSize: '1rem',
              border: `2px solid ${theme.palette.divider}`
            }}
            src={userAvatar}
          >
            {userAvatar ? null : (userEmail?.charAt(0).toUpperCase() || 'U')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight="600" color="text.primary">
              {userEmail?.split('@')[0] || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userEmail || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          size="small" 
          onClick={handleProfileMenuClick}
          sx={{ 
            color: theme.palette.text.secondary,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s, color 0.2s',
            '&:hover': {
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <KeyboardArrowDown />
        </IconButton>

        {/* Enhanced Profile Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          PaperProps={{
            component: ProfileMenuPaper,
            elevation: 0,
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{
            '& .MuiMenu-paper': {
              overflow: 'visible'
            }
          }}
        >
          {/* Profile Header with Gradient */}
          <Box sx={{ 
            p: 3, 
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
            position: 'relative'
          }}>
            {/* Decorative elements */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '0 0 0 100%'
            }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative' }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  border: '3px solid rgba(255,255,255,0.3)',
                  boxShadow: theme.shadows[4]
                }}
                src={userAvatar}
              >
                {userAvatar ? null : (userEmail?.charAt(0).toUpperCase() || 'U')}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" fontWeight="700">
                    {userEmail?.split('@')[0] || 'User'}
                  </Typography>
                  <VerifiedUser sx={{ fontSize: 16, opacity: 0.9 }} />
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  {userEmail || 'user@example.com'}
                </Typography>
                <Chip
                  icon={<Security fontSize="small" />}
                  label="Pro Account"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
              </Box>
            </Box>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AccountCircle />}
              onClick={handleOpenProfile}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              Manage Account
            </Button>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-around',
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Inbox
              </Typography>
              <Typography variant="h6" fontWeight="700">
                {folderCounts.inbox || 0}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Unread
              </Typography>
              <Typography variant="h6" fontWeight="700" color="primary.main">
                {Math.floor(folderCounts.inbox * 0.3) || 0}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Storage
              </Typography>
              <Typography variant="h6" fontWeight="700">
                {storageUsed}GB
              </Typography>
            </Box>
          </Box>

          {/* Menu Items */}
          <Box sx={{ py: 1, px: 1 }}>
            <MenuItem 
              onClick={handleOpenSettings}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Settings"
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Customize
              </Typography>
            </MenuItem>

            <MenuItem 
              onClick={handleToggleTheme}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <ListItemIcon>
                {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </ListItemIcon>
              <ListItemText 
                primary={`${darkMode ? 'Dark' : 'Light'} Mode`}
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
              <Switch
                size="small"
                checked={darkMode}
                onChange={handleToggleTheme}
                onClick={(e) => e.stopPropagation()}
              />
            </MenuItem>

            <MenuItem 
              onClick={handleOpenSecurity}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <ListItemIcon>
                <Security fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Security & Privacy"
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
              <VerifiedUser fontSize="small" color="success" />
            </MenuItem>

            <Divider sx={{ my: 1.5 }} />

            <MenuItem 
              onClick={handleOpenHelp}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <ListItemIcon>
                <HelpOutline fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Help & Support"
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
            </MenuItem>

            <MenuItem 
              onClick={handleOpenAbout}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <ListItemIcon>
                <InfoOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="About QuMail"
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
              <Typography variant="caption" color="text.secondary">
                v2.1.0
              </Typography>
            </MenuItem>

            <Divider sx={{ my: 1.5 }} />

            <MenuItem 
              onClick={handleSignOut}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                mb: 0.5,
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(239, 68, 68, 0.12)' 
                    : 'rgba(239, 68, 68, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Sign Out"
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
            </MenuItem>
          </Box>

          {/* Storage Footer with Progress Bar */}
          <Box sx={{ 
            p: 2.5, 
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
            borderTop: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storage fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="500">
                    Storage Usage
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {storageUsed}GB / {storageTotal}GB
                </Typography>
              </Box>
              <StorageProgress variant="determinate" value={storagePercent} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {storagePercent.toFixed(1)}% used
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Upgrade />}
              onClick={() => {}}
              sx={{
                borderRadius: '8px',
                py: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Upgrade Storage
            </Button>
          </Box>
        </Menu>
      </Box>
    </Box>
  );
}