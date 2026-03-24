import React from 'react';
import { Menu, MenuItem, Box, Typography, Button, Avatar, List, ListItemIcon, ListItemText, IconButton, Tooltip } from '@mui/material';
import { Delete, FiberManualRecord, Mail, Lock, Warning, Public, Person, Security, MarkEmailRead, CheckCircle, Schedule, Error, Info, Close, Notifications } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_ICONS = {
  'Mail': <Mail />,
  'Lock': <Lock />,
  'Warning': <Warning />,
  'Public': <Public />,
  'Person': <Person />,
  'MarkEmailRead': <MarkEmailRead />,
  'CheckCircle': <CheckCircle />,
  'Schedule': <Schedule />,
  'Delete': <Delete />,
  'Security': <Security />,
  'Info': <Info />,
  'Error': <Error />
};

const NotificationList = ({ 
  anchorEl, 
  onClose, 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete, 
  onDeleteAll,
  onShowAll
}) => {
  const open = Boolean(anchorEl);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onClick={onClose}
      PaperProps={{
        elevation: 4,
        sx: {
          width: 360,
          maxHeight: 500,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          mt: 1.5,
          borderRadius: 2,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Notifications</Typography>
        <Box>
          <Button size="small" onClick={onMarkAllAsRead} sx={{ mr: 1 }}>Mark all as read</Button>
          <Tooltip title="Delete all notifications">
            <IconButton size="small" onClick={onDeleteAll}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={() => onMarkAsRead(notification.id)}
              sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: (notification.read || notification.status === 'read') ? 'transparent' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <ListItemIcon>
                <Avatar sx={{ bgcolor: `${notification.color || 'info'}.light`, color: `${notification.color || 'info'}.dark` }}>
                  {NOTIFICATION_ICONS[notification.icon] || <Info />}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: (notification.read || notification.status === 'read') ? 500 : 700 }}>
                      {notification.title}
                    </Typography>
                    {!(notification.read || notification.status === 'read') && <FiberManualRecord sx={{ fontSize: 10, color: 'primary.main' }} />}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </Typography>
                  </Box>
                }
              />
              <IconButton 
                size="small" 
                edge="end" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                sx={{ ml: 1, opacity: 0.5, '&:hover': { opacity: 1 } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        )}
      </List>

      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Button size="small" fullWidth onClick={onShowAll}>View all notifications</Button>
      </Box>
    </Menu>
  );
};

export default NotificationList;
