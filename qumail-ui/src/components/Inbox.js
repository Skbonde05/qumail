import React, { memo, useMemo } from "react";
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, Avatar, IconButton, Tooltip, Checkbox, Badge, CircularProgress, Button } from "@mui/material";
import { Star, StarBorder, Delete, Archive, Refresh, Inbox as InboxIcon, Lock } from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';

const EmailListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'unread' && prop !== 'selected',
})(({ theme, unread, selected }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.08)
    : unread 
      ? alpha(theme.palette.primary.main, 0.04)
      : theme.palette.background.paper,
  '&:hover': {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.12)
      : theme.palette.action.hover,
    '& .actions': {
      display: 'flex',
    }
  },
  transition: 'all 0.2s ease',
  cursor: 'pointer',
}));

const EmailRow = memo(({ email, onEmailClick, onAction }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <EmailListItem
      unread={!email.read}
      onClick={() => onEmailClick(email)}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
      </ListItemIcon>
      
      <IconButton 
        size="small" 
        onClick={(e) => { e.stopPropagation(); onAction(email.id, email.starred ? 'unstar' : 'star'); }}
        sx={{ color: email.starred ? 'warning.main' : 'text.disabled', mr: 1 }}
      >
        {email.starred ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
      </IconButton>

      <ListItemAvatar sx={{ minWidth: 50 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={email.encrypted ? <Box sx={{ bgcolor: 'secondary.main', borderRadius: '50%', p: 0.2, display: 'flex', border: '1px solid white' }}><Lock size={10} color="white" /></Box> : null}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: email.encrypted ? 'secondary.main' : 'primary.main', fontSize: '14px' }}>
            {email.from?.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
      </ListItemAvatar>


      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: !email.read ? 700 : 500, color: 'text.primary' }}>
              {email.from}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
            </Typography>
          </Box>
        }
        primaryTypographyProps={{ component: 'div' }}
        secondary={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: !email.read ? 600 : 400, color: 'text.secondary' }} noWrap>
              {email.subject}
            </Typography>
            <Typography variant="caption" color="text.disabled" noWrap>
              {email.preview || email.body?.substring(0, 100)}
            </Typography>
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
      
      <Box className="actions" sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}>
         <Tooltip title="Archive">
           <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, 'archive'); }}><Archive fontSize="small" /></IconButton>
         </Tooltip>
         <Tooltip title="Delete">
           <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, 'trash'); }}><Delete fontSize="small" /></IconButton>
         </Tooltip>
      </Box>
    </EmailListItem>
  </motion.div>
));

const Inbox = memo(({ 
  emails = [], 
  folderName = "inbox", 
  loading,
  onEmailClick,
  onAction,
  onRefresh
}) => {

  const renderedEmails = useMemo(() => {
    return emails.map((email) => (
      <EmailRow 
        key={email.id || email.uid} 
        email={email} 
        onEmailClick={onEmailClick} 
        onAction={onAction} 
      />
    ));
  }, [emails, onEmailClick, onAction]);

  if (loading && emails.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Loading your secure mailbox...</Typography>
      </Box>
    );
  }

  if (emails.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', p: 4 }}>
        <InboxIcon sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} />
        <Typography variant="h6">No messages in {folderName}</Typography>
        <Typography variant="body2">Your secure communication will appear here.</Typography>
        <Button onClick={onRefresh} startIcon={<Refresh />} sx={{ mt: 2 }}>Refresh</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{folderName}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} size="small"><Refresh /></IconButton>
        </Tooltip>
      </Box>

      <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {renderedEmails}
        </AnimatePresence>
      </List>
    </Box>
  );
});

export default Inbox;