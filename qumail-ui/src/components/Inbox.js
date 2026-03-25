import React, { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, Avatar, IconButton, Tooltip, Checkbox, Badge, CircularProgress, Button, Menu, MenuItem, Divider, useTheme } from "@mui/material";
import { 
  Star, StarBorder, Delete, Archive, Refresh, Inbox as InboxIcon, Lock, AttachFile as AttachFileIcon,
  MarkEmailRead, Report, AccessTime, PlaylistAdd, DriveFileMove, Label, MoreVert, Close,
  RestoreFromTrash, SettingsBackupRestore, Circle
} from "@mui/icons-material";
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

const EmailRow = memo(({ email, onEmailClick, onAction, isTrash, selected, onSelect }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <EmailListItem
      unread={!email.read}
      onClick={() => onEmailClick(email)}
      selected={selected}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Checkbox 
          size="small" 
          checked={selected}
          onClick={(e) => { e.stopPropagation(); onSelect(email.id); }} 
        />
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: !email.read ? 600 : 400, color: 'text.secondary' }} noWrap>
                {email.subject}
              </Typography>
              {email.attachments && email.attachments.length > 0 && (
                <Box sx={{ display: 'flex', color: 'text.disabled' }}>
                  <AttachFileIcon sx={{ fontSize: 14 }} />
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.disabled" noWrap>
              {email.preview || (typeof email.body === 'string' ? email.body.substring(0, 100) : '')}
            </Typography>
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
      
      <Box className="actions" sx={{ display: { xs: 'none', md: 'flex' }, ml: 1 }}>
         {isTrash ? (
           <Tooltip title="Restore">
             <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, 'restore'); }}><RestoreFromTrash fontSize="small" /></IconButton>
           </Tooltip>
         ) : (
           <Tooltip title="Archive">
             <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, 'archive'); }}><Archive fontSize="small" /></IconButton>
           </Tooltip>
         )}
         <Tooltip title={isTrash ? "Delete Forever" : "Delete"}>
           <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, isTrash ? 'delete' : 'trash'); }}><Delete fontSize="small" /></IconButton>
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
  onRefresh,
  labels = []
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const isTrashFolder = folderName === 'trash';

  const handleSelectOne = (id) => {
    setSelectedEmailIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmailIds(emails.map(email => email.id));
    } else {
      setSelectedEmailIds([]);
    }
  };

  const clearSelection = () => setSelectedEmailIds([]);

  const renderedEmails = useMemo(() => {
    return emails.map((email) => (
      <EmailRow 
        key={email.id || email.uid} 
        email={email} 
        onEmailClick={onEmailClick} 
        onAction={onAction} 
        isTrash={isTrashFolder}
        selected={selectedEmailIds.includes(email.id)}
        onSelect={handleSelectOne}
      />
    ));
  }, [emails, onEmailClick, onAction, isTrashFolder, selectedEmailIds]);

  const [snoozeAnchor, setSnoozeAnchor] = useState(null);
  const [moveAnchor, setMoveAnchor] = useState(null);

  const [labelAnchor, setLabelAnchor] = useState(null);

  const handleSnooze = (duration) => {
    let date = new Date();
    if (duration === 'today') date.setHours(18, 0, 0, 0);
    else if (duration === 'tomorrow') { date.setDate(date.getDate() + 1); date.setHours(8, 0, 0, 0); }
    else if (duration === 'next_week') { date.setDate(date.getDate() + 7); date.setHours(8, 0, 0, 0); }
    
    onAction(selectedEmailIds, 'snooze', { snoozeDate: date.toISOString() });
    clearSelection();
    setSnoozeAnchor(null);
  };

  const handleMoveTo = (folderId) => {
    onAction(selectedEmailIds, 'move', { folder: folderId });
    clearSelection();
    setMoveAnchor(null);
  };

  const handleApplyLabel = (labelId) => {
    onAction(selectedEmailIds, 'label', { labelId });
    clearSelection();
    setLabelAnchor(null);
  };

  const [moreAnchor, setMoreAnchor] = useState(null);

  if (loading && emails.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={30} thickness={4} />
        <Typography variant="body2" color="text.secondary" fontWeight="500">{t('common.loadingMailbox')}</Typography>
      </Box>
    );
  }

  if (emails.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', p: 4, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', mb: 3 }}>
           <InboxIcon sx={{ fontSize: 100, opacity: 0.1 }} />
           <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }}>
              <Circle sx={{ fontSize: 40, color: 'primary.main', opacity: 0.1 }} />
           </Box>
        </Box>
        <Typography variant="h5" fontWeight="700" color="text.primary" gutterBottom>
           {t(`sidebar.${folderName}`)} is empty
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 300, mb: 3 }}>
           Your secure communication starts here. Relax, there's nothing to show right now.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={onRefresh} 
          startIcon={<Refresh />} 
          sx={{ borderRadius: 28, px: 3 }}
        >
          {t('common.refresh')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {selectedEmailIds.length > 0 ? (
        <Box sx={{ 
          p: 1.5, 
          px: 3, 
          display: 'flex', 
          alignItems: 'center', 
          borderBottom: 1, 
          borderColor: 'divider', 
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          transition: 'all 0.3s ease'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Checkbox 
                size="small" 
                indeterminate={selectedEmailIds.length > 0 && selectedEmailIds.length < emails.length}
                checked={selectedEmailIds.length === emails.length}
                onChange={handleSelectAll}
                sx={{ p: 0.5 }}
            />
            <Typography variant="body2" sx={{ ml: 1.5, fontWeight: 700, color: 'primary.main', display: { xs: 'none', sm: 'block' } }}>
                {selectedEmailIds.length} Selected
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Action Group 1: Folders */}
            <Box sx={{ display: 'flex', gap: 0.5, borderRight: 1, borderColor: 'divider', pr: 1.5, mr: 1.5 }}>
                {isTrashFolder ? (
                  <Tooltip title="Restore">
                    <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'restore'); clearSelection(); }} sx={{ color: 'text.secondary' }}>
                        <RestoreFromTrash fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Archive">
                    <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'archive'); clearSelection(); }} sx={{ color: 'text.secondary' }}>
                        <Archive fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Report Spam">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'spam'); clearSelection(); }} sx={{ color: 'text.secondary' }}>
                    <Report fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isTrashFolder ? "Delete Forever" : "Delete"}>
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, isTrashFolder ? 'delete' : 'trash'); clearSelection(); }} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
            </Box>

            {/* Action Group 2: Status */}
            <Box sx={{ display: 'flex', gap: 0.5, borderRight: 1, borderColor: 'divider', pr: 1.5, mr: 1.5 }}>
                <Tooltip title="Mark as read">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'read'); clearSelection(); }} sx={{ color: 'text.secondary' }}>
                    <MarkEmailRead fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!isTrashFolder && (
                    <Tooltip title="Snooze">
                        <IconButton size="small" onClick={(e) => setSnoozeAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
                            <AccessTime fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title="Add to tasks">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'task'); clearSelection(); }} sx={{ color: 'text.secondary' }}>
                    <PlaylistAdd fontSize="small" />
                  </IconButton>
                </Tooltip>
            </Box>

            {/* Action Group 3: Categorization */}
            {!isTrashFolder && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Move to">
                      <IconButton size="small" onClick={(e) => setMoveAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
                        <DriveFileMove fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Labels">
                      <IconButton size="small" onClick={(e) => setLabelAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
                        <Label fontSize="small" />
                      </IconButton>
                    </Tooltip>
                </Box>
            )}

            <Tooltip title="More">
              <IconButton size="small" onClick={(e) => setMoreAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <IconButton size="small" onClick={clearSelection} sx={{ ml: 'auto', color: 'text.secondary' }}>
            <Close fontSize="small" />
          </IconButton>

          {/* Snooze Menu */}
          <Menu 
            anchorEl={snoozeAnchor} 
            open={Boolean(snoozeAnchor)} 
            onClose={() => setSnoozeAnchor(null)}
            PaperProps={{ sx: { minWidth: 200, mt: 1, boxShadow: 6, borderRadius: 2 } }}
          >
            <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block', fontWeight: 800 }}>Snooze until...</Typography>
            <MenuItem onClick={() => handleSnooze('today')}>This evening (6:00 PM)</MenuItem>
            <MenuItem onClick={() => handleSnooze('tomorrow')}>Tomorrow (8:00 AM)</MenuItem>
            <MenuItem onClick={() => handleSnooze('next_week')}>Next week</MenuItem>
          </Menu>

          {/* More Menu */}
          <Menu 
            anchorEl={moreAnchor} 
            open={Boolean(moreAnchor)} 
            onClose={() => setMoreAnchor(null)}
            PaperProps={{ sx: { minWidth: 180, mt: 1, boxShadow: 6, borderRadius: 2 } }}
          >
            <MenuItem onClick={() => { onAction(selectedEmailIds, 'unread'); clearSelection(); setMoreAnchor(null); }}>Mark as unread</MenuItem>
            <MenuItem onClick={() => { onAction(selectedEmailIds, 'important'); clearSelection(); setMoreAnchor(null); }}>Mark as important</MenuItem>
            <MenuItem onClick={() => { onAction(selectedEmailIds, 'unimportant'); clearSelection(); setMoreAnchor(null); }}>Mark as not important</MenuItem>
            <Divider />
            <MenuItem onClick={() => { onAction(selectedEmailIds, 'star'); clearSelection(); setMoreAnchor(null); }}>Add star</MenuItem>
            <MenuItem onClick={() => { onAction(selectedEmailIds, 'unstar'); clearSelection(); setMoreAnchor(null); }}>Remove star</MenuItem>
          </Menu>

          {/* Move To Menu */}
          <Menu anchorEl={moveAnchor} open={Boolean(moveAnchor)} onClose={() => setMoveAnchor(null)}>
            <MenuItem onClick={() => handleMoveTo('inbox')}>Inbox</MenuItem>
            <MenuItem onClick={() => handleMoveTo('archive')}>Archive</MenuItem>
            <MenuItem onClick={() => handleMoveTo('spam')}>Spam</MenuItem>
            {labels && labels.length > 0 && <Divider />}
            {labels && labels.map(label => (
              <MenuItem key={label.id} onClick={() => handleMoveTo(label.id)}>
                <ListItemIcon><Circle sx={{ color: label.color, fontSize: 10 }} /></ListItemIcon>
                {label.name}
              </MenuItem>
            ))}
          </Menu>

          {/* Labels Menu */}
          <Menu anchorEl={labelAnchor} open={Boolean(labelAnchor)} onClose={() => setLabelAnchor(null)}>
            {labels && labels.length > 0 ? labels.map(label => (
              <MenuItem key={label.id} onClick={() => handleApplyLabel(label.id)}>
                <ListItemIcon><Checkbox size="small" disableRipple /></ListItemIcon>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: label.color }} />
                  {label.name}
                </Box>
              </MenuItem>
            )) : (
              <MenuItem disabled>No labels created</MenuItem>
            )}
          </Menu>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{t(`sidebar.${folderName}`)}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={t('common.refresh')}>
            <IconButton onClick={onRefresh} size="small"><Refresh /></IconButton>
          </Tooltip>
        </Box>
      )}

      <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {renderedEmails}
        </AnimatePresence>
      </List>
    </Box>
  );
});

export default Inbox;