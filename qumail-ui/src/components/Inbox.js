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
  padding: theme.spacing(1.5, 2.5),
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.08)
    : theme.palette.background.paper,
  '&:hover': {
    zIndex: 1,
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.1)
      : alpha(theme.palette.action.hover, 0.5),
    boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.04)',
    transform: 'translateY(-1px)',
    '& .actions': {
      display: 'flex',
    }
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 4,
    borderRadius: '0 4px 4px 0',
    backgroundColor: theme.palette.primary.main,
    transform: unread ? 'scaleY(1)' : 'scaleY(0)',
    transition: 'transform 0.3s ease',
  }
}));


const EmailRow = memo(({ email, onEmailClick, onAction, isTrash, selected, onSelect, availableLabels = [] }) => {
  const emailLabels = useMemo(() => {
    if (!email.labels) return [];
    return email.labels.map(lId => availableLabels.find(l => l.id === lId)).filter(Boolean);
  }, [email.labels, availableLabels]);

  return (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
  >
    <EmailListItem
      unread={!email.read}
      onClick={() => onEmailClick(email)}
      selected={selected}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { xs: 80, sm: 100 } }}>
        <Checkbox 
          size="small" 
          checked={selected}
          onClick={(e) => { e.stopPropagation(); onSelect(email.id); }} 
          sx={{ mr: 1 }}
        />
        <IconButton 
          size="small" 
          onClick={(e) => { e.stopPropagation(); onAction(email.id, email.starred ? 'unstar' : 'star'); }}
          sx={{ color: email.starred ? 'warning.main' : 'text.disabled' }}
        >
          {email.starred ? <Star sx={{ fontSize: 20 }} /> : <StarBorder sx={{ fontSize: 20 }} />}
        </IconButton>
      </Box>

      <ListItemAvatar sx={{ minWidth: 50, display: { xs: 'none', sm: 'block' } }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={email.encrypted ? <Box sx={{ bgcolor: 'secondary.main', borderRadius: '50%', p: 0.2, display: 'flex', border: '2px solid white' }}><Lock sx={{ fontSize: 10, color: 'white' }} /></Box> : null}
        >
          <Avatar sx={{ 
              width: 38, 
              height: 38, 
              bgcolor: email.encrypted ? 'secondary.main' : 'primary.main', 
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {email.from?.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ 
                fontWeight: !email.read ? 700 : 500, 
                color: !email.read ? 'text.primary' : 'text.secondary',
                fontSize: '0.9rem'
            }}>
              {email.from}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
            </Typography>
          </Box>
        }
        primaryTypographyProps={{ component: 'div' }}
        secondary={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ 
                  fontWeight: !email.read ? 600 : 400, 
                  color: !email.read ? 'text.primary' : 'text.disabled',
                  maxWidth: { xs: '200px', sm: '400px', md: '600px' }
              }} noWrap>
                {email.subject}
              </Typography>
              {email.attachments && email.attachments.length > 0 && (
                <AttachFileIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              )}
              {emailLabels.map(label => (
                <Box 
                  key={label.id}
                  sx={{ 
                    bgcolor: alpha(label.color, 0.15), 
                    color: label.color,
                    px: 0.8,
                    py: 0.1,
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    ml: 0.5,
                    border: `1px solid ${alpha(label.color, 0.3)}`
                  }}
                >
                  {label.name}
                </Box>
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', opacity: 0.7 }} noWrap>
              {email.preview || (typeof email.body === 'string' ? email.body.substring(0, 100) : '')}
            </Typography>
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
      
      {!email.read && (
        <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', ml: 2, display: { xs: 'block', md: 'none' } }} />
      )}

      <Box className="actions" sx={{ display: 'none', alignItems: 'center', ml: 2, gap: 1 }}>
         <Tooltip title={isTrash ? "Restore" : "Archive"}>
           <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, isTrash ? 'restore' : 'archive'); }}>
             {isTrash ? <RestoreFromTrash sx={{ fontSize: 18 }} /> : <Archive sx={{ fontSize: 18 }} />}
           </IconButton>
         </Tooltip>
         <Tooltip title={isTrash ? "Delete Forever" : "Delete"}>
           <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id, isTrash ? 'delete' : 'trash'); }} sx={{ '&:hover': { color: 'error.main' } }}>
             <Delete sx={{ fontSize: 18 }} />
           </IconButton>
         </Tooltip>
      </Box>
    </EmailListItem>
  </motion.div>
  );
});

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
  
  const standardFolders = ['inbox', 'sent', 'archive', 'trash', 'starred', 'important', 'drafts', 'snoozed', 'spam'];
  const isStandard = standardFolders.includes(folderName.toLowerCase());
  const displayFolderName = isStandard 
    ? t(`sidebar.${folderName.toLowerCase()}`) 
    : (labels.find(l => l.id === folderName || l.id === folderName.toUpperCase())?.name || folderName);

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
        availableLabels={labels}
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', mb: 3 }}>
           <InboxIcon sx={{ fontSize: 120, color: 'primary.main', opacity: 0.05 }} />
           <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <Circle sx={{ fontSize: 32, color: 'primary.main', opacity: 0.15, animation: 'pulse 2s infinite' }} />
           </Box>
        </Box>
        <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ letterSpacing: '-1px', mb: 1 }}>
           {displayFolderName} is empty
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 360, mb: 4, color: 'text.secondary', fontWeight: 500 }}>
           You're all caught up! Your secure communication landscape is clean and quiet.
        </Typography>
        <Button 
          variant="contained" 
          onClick={onRefresh} 
          startIcon={<Refresh />} 
          sx={{ 
            borderRadius: '12px', 
            px: 4, 
            py: 1.2,
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: theme => `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            '&:hover': {
              boxShadow: theme => `0 12px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              transform: 'translateY(-2px)'
            }
          }}
        >
          {t('common.refresh')}
        </Button>
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.15; }
              50% { transform: scale(1.1); opacity: 0.25; }
              100% { transform: scale(0.95); opacity: 0.15; }
            }
          `}
        </style>
      </Box>

    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {selectedEmailIds.length > 0 ? (
        <Box sx={{ 
          p: 1.5, 
          px: { xs: 1.5, sm: 3 }, 
          display: 'flex', 
          alignItems: 'center', 
          borderBottom: 1, 
          borderColor: 'divider', 
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          transition: 'all 0.3s ease',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar but keep functionality
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
            {/* Action Group 1: Folders */}
            <Box sx={{ display: 'flex', gap: 0.5, borderRight: 1, borderColor: 'divider', pr: { xs: 1, sm: 1.5 }, mr: { xs: 1, sm: 1.5 } }}>
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
            <Box sx={{ display: 'flex', gap: 0.5, borderRight: 1, borderColor: 'divider', pr: { xs: 1, sm: 1.5 }, mr: { xs: 1, sm: 1.5 } }}>
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
                <Box sx={{ display: 'flex', gap: 0.5, borderRight: 1, borderColor: 'divider', pr: { xs: 1, sm: 1.5 }, mr: { xs: 1, sm: 1.5 } }}>
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
        <Box sx={{ p: 2, px: 3, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, textTransform: 'capitalize', letterSpacing: '-0.5px' }}>
            {displayFolderName}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={t('common.refresh')}>
            <IconButton onClick={onRefresh} size="small" sx={{ color: 'text.secondary' }}>
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
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