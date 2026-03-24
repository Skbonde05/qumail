import React, { memo } from "react";
import {
  Box, Button, List, ListItemIcon, ListItemText, ListItemButton, Divider, Typography, Avatar, Menu, MenuItem, LinearProgress, useTheme
} from "@mui/material";
import { 
  Create, Inbox, Send, Drafts, Delete, Star, LabelImportant, Archive, ExitToApp, Settings, HelpOutline, Security, Storage, Upgrade
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const alpha = (color, opacity) => {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};

const StyledListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: "0 22px 22px 0",
  marginRight: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.12)
    : "transparent",
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.18)
      : theme.palette.action.hover,
  },
  "& .MuiListItemIcon-root": {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: "40px"
  }
}));

const SidebarItem = memo(({ icon: Icon, text, count, selected, onClick }) => (
  <StyledListItem selected={selected} onClick={onClick}>
    <ListItemIcon>
      <Icon fontSize="small" />
    </ListItemIcon>
    <ListItemText 
      primary={text}
      primaryTypographyProps={{
        fontSize: "0.875rem",
        fontWeight: selected ? "600" : "500",
      }}
    />
    {count > 0 && (
      <Typography variant="caption" sx={{ fontWeight: "700", mr: 1 }}>
        {count}
      </Typography>
    )}
  </StyledListItem>
));

const ProfileMenu = ({ anchorEl, onClose, onLogout, onSettings, user }) => {
  const theme = useTheme();
  const open = Boolean(anchorEl);
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320, mt: 1, borderRadius: 3, boxShadow: theme.shadows[8] }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2.5, textAlign: 'center' }}>
        <Avatar src={user?.avatar} sx={{ width: 64, height: 64, mx: 'auto', mb: 1.5, bgcolor: 'primary.main' }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="700">{user?.name}</Typography>
        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
      </Box>
      <Divider />
      <MenuItem onClick={onSettings} sx={{ py: 1.5 }}>
        <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
        <ListItemText primary="Account Settings" />
      </MenuItem>
      <MenuItem onClick={onLogout} sx={{ py: 1.5, color: 'error.main' }}>
        <ListItemIcon><ExitToApp fontSize="small" color="error" /></ListItemIcon>
        <ListItemText primary="Logout" />
      </MenuItem>
    </Menu>
  );
};

const Sidebar = memo(({ 
  onCompose, 
  activeFolder, 
  onFolderChange, 
  activeSection,
  onSectionChange,
  folderCounts = {},
  drawerWidth = 260,
  user = null
}) => {
  const theme = useTheme();
  const storageGB = (user?.storageLimit || 0) / (1024 * 1024 * 1024);
  const usedGB = (user?.storageUsed || 0) / (1024 * 1024 * 1024);
  const storagePercentage = storageGB > 0 ? (usedGB / storageGB) * 100 : 0;

  const sections = [
    { id: "inbox", icon: Inbox, text: "Inbox", count: folderCounts.inbox },
    { id: "starred", icon: Star, text: "Starred", count: folderCounts.starred },
    { id: "important", icon: LabelImportant, text: "Important", count: folderCounts.important },
    { id: "sent", icon: Send, text: "Sent", count: folderCounts.sent },
    { id: "drafts", icon: Drafts, text: "Drafts", count: folderCounts.drafts },
    { id: "archive", icon: Archive, text: "Archive", count: folderCounts.archive },
    { id: "trash", icon: Delete, text: "Trash", count: folderCounts.trash },
  ];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, pt: 3 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Create />}
          onClick={onCompose}
          sx={{ borderRadius: "16px", py: 1.5, textTransform: "none", fontWeight: "700", boxShadow: 0, '&:hover': { boxShadow: 2 } }}
        >
          Compose
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>
        <List disablePadding>
          {sections.map((section) => (
            <SidebarItem
              key={section.id}
              icon={section.icon}
              text={section.text}
              count={section.count}
              selected={activeSection === 'inbox' && activeFolder === section.id}
              onClick={() => onFolderChange(section.id)}
            />
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <List disablePadding>
          <SidebarItem icon={Settings} text="Settings" selected={activeSection === 'settings'} onClick={() => onSectionChange('settings')} />
          <SidebarItem icon={Security} text="Security" selected={activeSection === 'security'} onClick={() => onSectionChange('security')} />
          <SidebarItem icon={HelpOutline} text="Help" selected={activeSection === 'help'} onClick={() => onSectionChange('help')} />
        </List>
      </Box>

      {user && (
        <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Storage fontSize="small" color="primary" />
            <Typography variant="caption" fontWeight="700">Storage Usage</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={storagePercentage} 
            sx={{ height: 6, borderRadius: 3, mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {usedGB.toFixed(2)} GB of {storageGB.toFixed(0)} GB
            </Typography>
            <Typography variant="caption" fontWeight="700" color={storagePercentage > 90 ? 'error' : 'primary'}>
              {storagePercentage.toFixed(1)}%
            </Typography>
          </Box>
          {storagePercentage > 80 && (
            <Button variant="outlined" size="small" fullWidth sx={{ mt: 1.5, fontSize: '0.7rem', py: 0.5 }} startIcon={<Upgrade />}>
              Upgrade
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
});

Sidebar.ProfileMenu = ProfileMenu;

export default Sidebar;