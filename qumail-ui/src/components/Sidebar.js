import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, List, ListItemIcon, ListItemText, ListItemButton, Divider, Typography, Avatar, Menu, MenuItem, LinearProgress, useTheme, ListSubheader, IconButton, Tooltip
} from "@mui/material";
import { 
  Create, Inbox, Send, Drafts, Delete, Star, LabelImportant, Archive, ExitToApp, Settings, HelpOutline, Security, Storage, Upgrade, AccessTime, Report, Circle, Add,
  ManageAccounts, Palette, Policy, SettingsSuggest
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const alpha = (color, opacity) => {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};

const StyledListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: "12px",
  margin: theme.spacing(0.5, 1.5),
  padding: theme.spacing(1, 2),
  height: 44,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.12)
    : "transparent",
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.18)
      : 'transparent',
    boxShadow: `inset 0 0 0 1.5px ${alpha(theme.palette.primary.main, 0.6)}`,
    transform: 'translateX(3px)',
  },
  "& .MuiListItemIcon-root": {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: "36px",
    transition: 'all 0.2s ease',
  },
}));

const SidebarItem = memo(({ icon: Icon, text, count, selected, onClick, action }) => (
  <StyledListItem 
    selected={selected} 
    onClick={onClick}
    sx={{
      "& .sidebar-action": { opacity: 0, transition: 'all 0.2s', transform: 'scale(0.8)' },
      "&:hover .sidebar-action": { opacity: 0.6, transform: 'scale(1)' },
      "& .sidebar-action:hover": { opacity: 1, color: 'error.main' }
    }}
  >
    <ListItemIcon>
      {typeof Icon === 'function' ? <Icon /> : (
        <Icon sx={{ fontSize: 20, transform: selected ? 'scale(1.05)' : 'none' }} />
      )}
    </ListItemIcon>
    <ListItemText 
      primary={text}
      primaryTypographyProps={{
        fontSize: "0.875rem",
        fontWeight: selected ? "600" : "500",
        letterSpacing: '0.01em',
      }}
    />
    {count > 0 && (
      <Box sx={{ 
        bgcolor: selected ? 'primary.main' : alpha('#000', 0.05), 
        color: selected ? 'white' : 'text.secondary',
        px: 1, 
        py: 0.2, 
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 700,
        minWidth: 20,
        textAlign: 'center'
      }}>
        {count}
      </Box>
    )}
    {action && (
      <IconButton 
        size="small" 
        className="sidebar-action"
        onClick={(e) => { e.stopPropagation(); action.onClick(); }}
        sx={{ ml: 0.5, p: 0.5 }}
      >
        {action.icon}
      </IconButton>
    )}
  </StyledListItem>
));


const ProfileMenu = ({ 
  anchorEl, 
  onClose, 
  onLogout, 
  onAppSettings, 
  onAccountSettings, 
  onThemes, 
  onPrivacy, 
  onHelp, 
  user 
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const open = Boolean(anchorEl);
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onClick={onClose}
      PaperProps={{
        sx: { 
          width: 320, 
          mt: 1, 
          borderRadius: 3, 
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          backgroundImage: 'none'
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2.5, textAlign: 'center' }}>
        <Avatar src={user?.avatar} sx={{ width: 64, height: 64, mx: 'auto', mb: 1.5, bgcolor: 'primary.main', border: '2px solid white', boxShadow: theme.shadows[2] }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="700">{user?.name}</Typography>
        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
      </Box>
      <Divider />
      
      <MenuItem onClick={() => { onAppSettings(); onClose(); }} sx={{ py: 1.2 }}>
        <ListItemIcon><SettingsSuggest fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('settings.app')} />
      </MenuItem>
      
      <MenuItem onClick={() => { onAccountSettings(); onClose(); }} sx={{ py: 1.2 }}>
        <ListItemIcon><ManageAccounts fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('settings.account')} />
      </MenuItem>

      <MenuItem onClick={() => { onThemes(); onClose(); }} sx={{ py: 1.2 }}>
        <ListItemIcon><Palette fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('settings.theme')} />
      </MenuItem>

      <MenuItem onClick={() => { onPrivacy(); onClose(); }} sx={{ py: 1.2 }}>
        <ListItemIcon><Policy fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('settings.privacy')} />
      </MenuItem>

      <MenuItem onClick={() => { onHelp(); onClose(); }} sx={{ py: 1.2 }}>
        <ListItemIcon><HelpOutline fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('common.help')} />
      </MenuItem>

      <Divider />
      
      <MenuItem onClick={() => { onLogout(); onClose(); }} sx={{ py: 1.5, color: 'error.main' }}>
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
  onAddLabel = null,
  onDeleteLabel = null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const limit = user?.storageLimit || (15 * 1024 * 1024 * 1024);
  const used = user?.storageUsed || 0;
  
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 GB';
    const mb = bytes / (1024 * 1024);
    if (mb < 10) return `${mb.toFixed(2)} MB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const limitGB = limit / (1024 * 1024 * 1024);
  const storagePercentage = limit > 0 ? (used / limit) * 100 : 0;

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
          sx={{ 
            borderRadius: "14px", 
            py: 1.5, 
            textTransform: "none", 
            fontWeight: "700", 
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(37, 99, 235, 0.2)',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            '&:hover': { 
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark' ? '0 12px 24px rgba(0,0,0,0.5)' : '0 12px 24px rgba(37, 99, 235, 0.3)',
                filter: 'brightness(1.1)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
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
              action={onDeleteLabel ? {
                icon: <Delete sx={{ fontSize: 16 }} />,
                onClick: () => onDeleteLabel(label.id)
              } : null}
            />
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <List disablePadding>
          <SidebarItem icon={Settings} text={t('settings.account')} selected={activeSection === 'account'} onClick={() => onSectionChange('account')} />
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
              {formatSize(used)} {t('common.of')} {limitGB.toFixed(0)} GB
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