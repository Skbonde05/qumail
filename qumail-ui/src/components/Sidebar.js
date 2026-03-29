import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, List, ListItemIcon, ListItemText, ListItemButton, Divider, Typography, Avatar, Menu, MenuItem, LinearProgress, useTheme, ListSubheader, IconButton, Tooltip
} from "@mui/material";
import { 
  Create, Inbox, Send, Drafts, Delete, Star, LabelImportant, Archive, Settings as SettingsIcon, HelpOutline, AccessTime, Report, Circle, Add,
  ManageAccounts, Palette, Policy, SettingsSuggest, CreateOutlined, ExitToApp
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";

const StyledListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: "0 24px 24px 0",
  margin: "0 12px 0 0",
  padding: theme.spacing(0.5, 3),
  height: 34,
  transition: 'all 0.1s ease-in-out',
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.12)
    : "transparent",
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.18)
      : alpha(theme.palette.text.primary, 0.05),
  },
  "& .MuiListItemIcon-root": {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: "40px",
  },
}));

const SidebarItem = memo(({ icon: Icon, text, count, selected, onClick, actions }) => {
  const theme = useTheme();
  return (
    <StyledListItem 
      selected={selected} 
      onClick={onClick}
      sx={{
        "& .sidebar-action": { 
          opacity: 0, 
          transition: 'opacity 0.2s',
          ml: 0.5 
        },
        "&:hover .sidebar-action": { 
          opacity: 0.6 
        },
      }}
    >
      <ListItemIcon>
        {typeof Icon === 'function' ? <Icon /> : (
          <Icon sx={{ fontSize: 20, transform: selected ? 'scale(1.1)' : 'none', transition: 'transform 0.2s' }} />
        )}
      </ListItemIcon>
      <ListItemText 
        primary={text}
        primaryTypographyProps={{
          fontSize: "0.875rem",
          fontWeight: selected ? "800" : "500",
          letterSpacing: "0.01em"
        }}
      />
      {count > 0 && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 800, 
            color: selected ? 'primary.main' : 'text.secondary',
            bgcolor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            px: 0.8,
            py: 0.2,
            borderRadius: 1,
            fontSize: '0.7rem'
          }}
        >
          {count}
        </Typography>
      )}
      {actions && actions.map((act, i) => (
      <Tooltip title={act.tooltip} key={i}>
        <IconButton 
          size="small" 
          className="sidebar-action"
          onClick={(e) => { e.stopPropagation(); act.onClick(); }}
          sx={{ p: 0.4, '&:hover': { opacity: 1, color: act.tooltip.includes('Delete') ? 'error.main' : 'primary.main' } }}
        >
          {act.icon}
        </IconButton>
      </Tooltip>
    ))}
    </StyledListItem>
  );
});


const ProfileMenu = ({ 
  anchorEl, 
  onClose, 
  onLogout, 
  onAppSettings, 
  user 
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: 320, 
          mt: 1, 
          borderRadius: 3, 
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar src={user?.avatar} sx={{ width: 68, height: 68, mx: 'auto', mb: 1.5, border: `2px solid ${theme.palette.primary.main}`, boxShadow: theme.shadows[2] }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: "-0.5px" }}>{user?.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>{user?.email}</Typography>
      </Box>
      <Divider />
      
      <MenuItem onClick={() => { onAppSettings(); onClose(); }} sx={{ py: 1.5 }}>
        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary={<Typography variant="body2" fontWeight="600">Settings</Typography>} />
      </MenuItem>

      <Divider />
      <MenuItem onClick={onLogout} sx={{ py: 1.5, color: 'error.main' }}>
        <ListItemIcon><ExitToApp fontSize="small" color="error" /></ListItemIcon>
        <ListItemText primary={<Typography variant="body2" fontWeight="600">Log out</Typography>} />
      </MenuItem>
    </Menu>
  );
};

const Sidebar = ({ 
  activeFolder, 
  activeSection,
  onFolderChange, 
  onSectionChange,
  onCompose, 
  folderCounts,
  labels,
  onCreateLabel,
  onDeleteLabel,
  user
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const sections = [
    { id: "inbox", icon: Inbox, text: "Inbox", count: folderCounts.inbox },
    { id: "starred", icon: Star, text: "Starred", count: folderCounts.starred },
    { id: "important", icon: LabelImportant, text: "Important", count: folderCounts.important },
    { id: "snoozed", icon: AccessTime, text: "Snoozed", count: folderCounts.snoozed },
    { id: "sent", icon: Send, text: "Sent", count: folderCounts.sent },
    { id: "drafts", icon: Drafts, text: "Drafts", count: folderCounts.drafts },
    { id: "archive", icon: Archive, text: "Archive", count: folderCounts.archive },
    { id: "spam", icon: Report, text: "Spam", count: folderCounts.spam },
    { id: "trash", icon: Delete, text: "Trash", count: folderCounts.trash },
  ];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, pt: 3, pb: 1.5 }}>
        <Button
          variant="contained"
          onClick={onCompose}
          startIcon={<Add sx={{ fontSize: '26px !important' }} />}
          sx={{ 
            borderRadius: "18px", 
            minWidth: 160,
            py: 1.8, 
            px: 3.5,
            textTransform: "none", 
            fontWeight: "800", 
            fontSize: '1rem',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
            '&:hover': { 
                boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.35)}`,
                backgroundColor: theme.palette.primary.dark,
                transform: 'translateY(-3px)'
            },
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
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

        <Box sx={{ px: 3, py: 2, mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '2px', fontSize: '0.65rem', opacity: 0.6 }}>
              Labels
           </Typography>
           <Tooltip title="Create new label">
              <IconButton size="small" onClick={onCreateLabel} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}><Add fontSize="small" /></IconButton>
           </Tooltip>
        </Box>

        <List disablePadding>
          {labels.map((label) => (
            <SidebarItem
              key={label.id}
              icon={() => <Circle sx={{ color: label.color, fontSize: 10 }} />}
              text={label.name}
              count={folderCounts.custom?.[label.id]}
              selected={activeSection === 'inbox' && activeFolder === label.id}
              onClick={() => onFolderChange(label.id)}
              actions={[
                {
                  icon: <Palette sx={{ fontSize: 14 }} />,
                  tooltip: 'Change Color',
                  onClick: () => onCreateLabel(label)
                },
                {
                  icon: <Delete sx={{ fontSize: 14 }} />,
                  tooltip: 'Delete Label',
                  onClick: () => onDeleteLabel(label.id)
                }
              ]}
            />
          ))}
        </List>
        
        <Box sx={{ mt: 1, mb: 0.5, mx: 2 }}>
           <Divider sx={{ opacity: 0.5 }} />
        </Box>
        
        <List disablePadding sx={{ mb: 1 }}>
          <SidebarItem 
            icon={HelpOutline} 
            text="Help & Support" 
            selected={activeSection === 'help'} 
            onClick={() => onSectionChange('help')} 
          />
        </List>
      </Box>
    </Box>
  );
};

Sidebar.ProfileMenu = ProfileMenu;
export default Sidebar;