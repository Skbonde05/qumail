import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, List, ListItemIcon, ListItemText, ListItemButton, Divider, Typography, Avatar, Menu, MenuItem, LinearProgress, useTheme, ListSubheader, IconButton, Tooltip
} from "@mui/material";
import { 
  Create, Inbox, Send, Drafts, Delete, Star, LabelImportant, Archive, ExitToApp, Settings, HelpOutline, Security, Storage, Upgrade, AccessTime, Report, Circle, Add
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
  const { t } = useTranslation();
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
        <ListItemText primary={t('settings.account')} />
      </MenuItem>
      <MenuItem onClick={onLogout} sx={{ py: 1.5, color: 'error.main' }}>
        <ListItemIcon><ExitToApp fontSize="small" color="error" /></ListItemIcon>
        <ListItemText primary={t('settings.logout')} />
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
  user = null,
  labels = [],
  onAddLabel = null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const limit = user?.storageLimit || (15 * 1024 * 1024 * 1024);
  const storageGB = limit / (1024 * 1024 * 1024);
  const usedGB = (user?.storageUsed || 0) / (1024 * 1024 * 1024);
  const storagePercentage = storageGB > 0 ? (usedGB / storageGB) * 100 : 0;

  const sections = [
    { id: "inbox", icon: Inbox, text: t("sidebar.inbox"), count: folderCounts.inbox },
    { id: "snoozed", icon: AccessTime, text: t("sidebar.snoozed"), count: folderCounts.snoozed },
    { id: "starred", icon: Star, text: t("sidebar.starred"), count: folderCounts.starred },
    { id: "important", icon: LabelImportant, text: t("sidebar.important"), count: folderCounts.important },
    { id: "sent", icon: Send, text: t("sidebar.sent"), count: folderCounts.sent },
    { id: "drafts", icon: Drafts, text: t("sidebar.drafts"), count: folderCounts.drafts },
    { id: "archive", icon: Archive, text: t("sidebar.archive"), count: folderCounts.archive },
    { id: "spam", icon: Report, text: t("sidebar.spam"), count: folderCounts.spam },
    { id: "trash", icon: Delete, text: t("sidebar.trash"), count: folderCounts.trash },
  ];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, pt: 3, display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
          <Box component="img" src="/qumail_logo.png" sx={{ height: 32, mr: 1 }} alt="QuMail Logo" />
          <Typography variant="h6" fontWeight="700">QuMail</Typography>
      </Box>

      <Box sx={{ p: 2, pt: { xs: 1, md: 3 } }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Create />}
          onClick={onCompose}
          sx={{ borderRadius: "16px", py: 1.5, textTransform: "none", fontWeight: "700", boxShadow: 0, '&:hover': { boxShadow: 2 } }}
        >
          {t('sidebar.compose')}
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

        <List
          disablePadding
          subheader={
            <ListSubheader 
              sx={{ 
                bgcolor: 'transparent', 
                lineHeight: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                px: 3, 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: 'text.secondary' 
              }}
            >
              {t('common.labels')}
              <Tooltip title={t('common.createLabel')}>
                <IconButton size="small" onClick={onAddLabel} sx={{ p: 0.5 }}>
                  <Add sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </ListSubheader>
          }
        >
          {labels.map((label) => (
            <SidebarItem
              key={label.id}
              icon={() => <Circle sx={{ color: label.color, fontSize: 12 }} />}
              text={label.name}
              count={folderCounts.custom?.[label.id]}
              selected={activeSection === 'inbox' && activeFolder === label.id}
              onClick={() => onFolderChange(label.id)}
            />
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <List disablePadding>
          <SidebarItem icon={Settings} text={t('settings.account')} selected={activeSection === 'settings'} onClick={() => onSectionChange('settings')} />
          <SidebarItem icon={Security} text={t('settings.security')} selected={activeSection === 'security'} onClick={() => onSectionChange('security')} />
          <SidebarItem icon={HelpOutline} text={t('common.help')} selected={activeSection === 'help'} onClick={() => onSectionChange('help')} />
        </List>
      </Box>

      {user && (
        <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Storage fontSize="small" color="primary" />
            <Typography variant="caption" fontWeight="700">{t('sidebar.storage')}</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={storagePercentage} 
            sx={{ height: 6, borderRadius: 3, mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {usedGB.toFixed(2)} GB {t('common.of')} {storageGB.toFixed(0)} GB
            </Typography>
            <Typography variant="caption" fontWeight="700" color={storagePercentage > 90 ? 'error' : 'primary'}>
              {storagePercentage.toFixed(1)}%
            </Typography>
          </Box>
          {storagePercentage > 80 && (
            <Button variant="outlined" size="small" fullWidth sx={{ mt: 1.5, fontSize: '0.7rem', py: 0.5 }} startIcon={<Upgrade />}>
              {t('common.upgrade')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
});

Sidebar.ProfileMenu = ProfileMenu;

export default Sidebar;