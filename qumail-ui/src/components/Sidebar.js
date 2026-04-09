import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, List, ListItemIcon, ListItemText, ListItemButton, Divider, Typography, Avatar, Menu, MenuItem, LinearProgress, useTheme, ListSubheader, IconButton, Tooltip, useMediaQuery
} from "@mui/material";
import { 
  Inbox, Send, Drafts, Delete, Star, LabelImportant, Archive, HelpOutline, AccessTime, Report, Circle, Add,
  Palette, ExitToApp, Policy
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { Close as CloseIcon } from "@mui/icons-material";

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
  user,
  onClose
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));



  const folderSections = [
    { id: "inbox", icon: Inbox, text: "Inbox", count: folderCounts.inbox || 0 },
    { id: "starred", icon: Star, text: "Starred", count: folderCounts.starred || 0 },
    { id: "important", icon: LabelImportant, text: "Important", count: folderCounts.important || 0 },
    { id: "snoozed", icon: AccessTime, text: "Snoozed", count: folderCounts.snoozed || 0 },
    { id: "sent", icon: Send, text: "Sent", count: folderCounts.sent || 0 },
    { id: "drafts", icon: Drafts, text: "Drafts", count: folderCounts.drafts || 0 },
    { id: "archive", icon: Archive, text: "Archive", count: folderCounts.archive || 0 },
    { id: "spam", icon: Report, text: "Spam", count: folderCounts.spam || 0 },
    { id: "trash", icon: Delete, text: "Trash", count: folderCounts.trash || 0 },
  ];

  const pageSections = [
    { id: 'help', icon: HelpOutline, text: 'Help & Support', isSection: true },
    { id: 'privacy', icon: Policy, text: 'Privacy Policy', isSection: true },
  ];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', height: '100%', overflow: 'hidden' }}>
      {isMobile && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              component="img" 
              src="/qumail_logo.png" 
              sx={{ height: 28, width: 'auto' }} 
              alt="Qumail Logo"
            />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>
              Qumail
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <Box sx={{ p: 2, pt: isMobile ? 1 : 3, pb: 1.5 }}>
        <Button
          variant="contained"
          onClick={onCompose}
          startIcon={<Add sx={{ fontSize: '26px !important' }} />}
          sx={{ 
            borderRadius: "18px", 
            minWidth: 160,
            py: 1.8,
            px: 3.5,
            fontSize: '1rem',
            fontWeight: 800,
            textTransform: 'none',
            letterSpacing: '0.5px',
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
            '&:hover': { 
                boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.35)}`,
                backgroundColor: theme.palette.primary.dark,
                transform: 'translateY(-3px)'
            },
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {t('sidebar.compose')}
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>


        {/* Folders */}
        <List disablePadding sx={{ mb: 2 }}>
          {folderSections.map((section) => (
            <SidebarItem
              key={section.id}
              icon={section.icon}
              text={t(`sidebar.${section.id}`)}
              count={section.count}
              selected={activeFolder === section.id}
              onClick={() => onFolderChange(section.id)}
            />
          ))}
        </List>

        <Box sx={{ px: 3, py: 2, mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '2px', fontSize: '0.65rem', opacity: 0.6 }}>
              {t('common.labels')}
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
              selected={activeFolder === label.id}
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
        
        {/* Pages */}
        <List disablePadding sx={{ mt: 2 }}>
          {pageSections.map((section) => (
            <SidebarItem
              key={section.id}
              icon={section.icon}
              text={t(`sidebar.${section.id}`)}
              selected={activeSection === section.id}
              onClick={() => onSectionChange(section.id)}
            />
          ))}
        </List>
      </Box>
    </Box>
  );
};

Sidebar.ProfileMenu = ProfileMenu;
export default Sidebar;