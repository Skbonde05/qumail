import React, { memo, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  Box, Typography, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, Avatar, 
  IconButton, Tooltip, Checkbox, Badge, CircularProgress, Button, Menu, MenuItem, 
  Divider, useTheme, Paper, useMediaQuery
} from "@mui/material";
import { keyframes, styled, alpha } from "@mui/material/styles";
import { 
  Star, StarBorder, Delete, Archive, Refresh, Inbox as InboxIcon, Lock, AttachFile as AttachFileIcon,
  MarkEmailRead, Report, AccessTime, PlaylistAdd, DriveFileMove, Label, MoreVert, Close,
  RestoreFromTrash, SettingsBackupRestore, Circle, FlashOn as Zap, DeleteOutlined, ArchiveOutlined, 
  MarkEmailReadOutlined, AccessTimeOutlined, LabelOutlined, ChevronLeft, ChevronRight
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';

const EmailListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'unread' && prop !== 'selected' && prop !== 'density' && prop !== 'isMobile',
})(({ theme, unread, selected, density, isMobile }) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
  padding: isMobile ? '12px 16px' : '0 12px',
  height: isMobile ? 'auto' : (density === 'compact' ? 32 : (density === 'spacious' ? 56 : 42)),
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.12)
    : (unread ? theme.palette.background.paper : alpha(theme.palette.text.primary, 0.02)),
  '&:hover': {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.18)
      : alpha(theme.palette.text.primary, 0.05),
    boxShadow: isMobile ? 'none' : 'inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
    zIndex: 1,
    '& .actions': { display: isMobile ? 'none' : 'flex' },
    '& .date-box': { display: isMobile ? 'block' : 'none' }
  },
  transition: 'background-color 0.1s, box-shadow 0.1s',
  cursor: 'pointer',
}));

const EmailRow = memo(({ email, onEmailClick, onAction, selected, onSelect, availableLabels = [], density, folderName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const emailLabels = useMemo(() => {
    if (!email.labels) return [];
    return email.labels.map(lId => availableLabels.find(l => l.id === lId)).filter(Boolean);
  }, [email.labels, availableLabels]);

  const sender = folderName === 'sent' ? `To: ${email.to}` : (email.fromName || email.from);

  if (isMobile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <EmailListItem unread={!email.read} onClick={() => onEmailClick(email)} selected={selected} isMobile={true}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <Checkbox 
                  size="small" 
                  checked={selected}
                  onClick={(e) => { e.stopPropagation(); onSelect(email.id || email.uid); }} 
                  sx={{ p: 0, color: alpha(theme.palette.text.secondary, 0.3) }}
                />
                <Typography variant="subtitle2" sx={{ 
                    fontWeight: !email.read ? 800 : 700, 
                    color: !email.read ? 'text.primary' : 'text.secondary',
                    fontSize: '0.9rem'
                }}>
                  {sender}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                {format(new Date(email.date), 'MMM d')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pl: 3.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ 
                    fontWeight: !email.read ? 700 : 500, 
                    color: 'text.primary',
                    fontSize: '0.85rem'
                }}>
                  {email.subject}
                </Typography>
                <Typography variant="caption" noWrap sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.8rem',
                    display: 'block',
                    opacity: 0.8
                }}>
                  {email.preview || (typeof email.body === 'string' ? email.body.substring(0, 60).replace(/\n/g, ' ') : '')}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  {emailLabels.map(label => (
                    <Box key={label.id} sx={{ bgcolor: alpha(label.color, 0.1), color: label.color, px: 0.8, borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800 }}>
                      {label.name}
                    </Box>
                  ))}
                </Box>
              </Box>

              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onAction(email.id || email.uid, email.starred ? 'unstar' : 'star'); }}
                sx={{ p: 0.5, mt: -0.5, color: email.starred ? '#f4b400' : alpha(theme.palette.text.secondary, 0.2) }}
              >
                {email.starred ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
              </IconButton>
            </Box>
          </Box>
        </EmailListItem>
      </motion.div>
    );
  }

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <EmailListItem unread={!email.read} onClick={() => onEmailClick(email)} selected={selected} density={density} isMobile={false}>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 80, gap: 0.5 }}>
        <Checkbox 
          size="small" 
          checked={selected}
          onClick={(e) => { e.stopPropagation(); onSelect(email.id || email.uid); }} 
          sx={{ color: alpha(theme.palette.text.secondary, 0.3), '&.Mui-checked': { color: 'primary.main' } }}
        />
        <IconButton 
          size="small" 
          onClick={(e) => { e.stopPropagation(); onAction(email.id || email.uid, email.starred ? 'unstar' : 'star'); }}
          sx={{ color: email.starred ? '#f4b400' : alpha(theme.palette.text.secondary, 0.3) }}
        >
          {email.starred ? <Star sx={{ fontSize: 20 }} /> : <StarBorder sx={{ fontSize: 20 }} />}
        </IconButton>
      </Box>

      <Box sx={{ minWidth: 200, maxWidth: 200, mr: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Typography variant="body2" sx={{ 
            fontWeight: !email.read ? 800 : 500, 
            color: !email.read ? 'text.primary' : 'text.secondary',
            fontSize: '0.875rem'
        }}>
          {sender}

        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, gap: 1 }}>
        <Typography variant="body2" sx={{ 
            fontWeight: !email.read ? 800 : 500, 
            color: 'text.primary',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 0
        }}>
          {email.subject}
        </Typography>
        <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.7
        }}>
          - {email.preview || (typeof email.body === 'string' ? email.body.substring(0, 100).replace(/\n/g, ' ') : '')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {emailLabels.map(label => (
            <Box key={label.id} sx={{ bgcolor: alpha(label.color, 0.1), color: label.color, px: 1, borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, border: `1px solid ${alpha(label.color, 0.2)}` }}>
              {label.name}
            </Box>
          ))}
        </Box>
      </Box>

      <Box className="date-box" sx={{ minWidth: 80, textAlign: 'right' }}>
        <Typography variant="caption" sx={{ fontWeight: !email.read ? 800 : 500, color: 'text.secondary', fontSize: '0.75rem' }}>
          {format(new Date(email.date), 'MMM d')}
        </Typography>
      </Box>

      <Box className="actions" sx={{ display: 'none', alignItems: 'center', gap: 0.5, bg: 'background.paper' }}>
        <Tooltip title="Archive">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id || email.uid, 'archive'); }}><ArchiveOutlined fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={folderName === 'trash' ? "Delete forever" : "Delete"}>
          <IconButton size="small" onClick={(e) => { 
            e.stopPropagation(); 
            if (folderName === 'trash' && !window.confirm("PERMANENT ACTION: Delete this email forever?")) return;
            onAction(email.id || email.uid, 'trash'); 
          }}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={email.read ? "Mark as unread" : "Mark as read"}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id || email.uid, email.read ? 'unread' : 'read'); }}><MarkEmailReadOutlined fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Snooze">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAction(email.id || email.uid, 'snooze'); }}><AccessTimeOutlined fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
    </EmailListItem>
  </motion.div>
  );
});

const Inbox = ({ 
  emails = [], 
  folderName = "inbox", 
  loading = false,
  onEmailClick,
  onAction,
  onRefresh,
  labels = [],
  page = 1,
  setPage,
  total = 0,
  limit = 50,
  density = 'comfortable'
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const openMenu = Boolean(menuAnchorEl);
  
  const handleMenuClick = useCallback((event) => setMenuAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setMenuAnchorEl(null), []);

  const handleBulkAction = useCallback((action) => {
    if (selectedEmailIds.length > 0) {
      onAction(selectedEmailIds, action);
      clearSelection();
    }
    handleMenuClose();
  }, [selectedEmailIds, onAction, handleMenuClose]);
  
  const handleSelectOne = useCallback((id) => {
    setSelectedEmailIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback((e) => {
    setSelectedEmailIds(e.target.checked ? emails.map(email => email.id || email.uid) : []);
  }, [emails]);

  const clearSelection = useCallback(() => setSelectedEmailIds([]), []);

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total || emails.length);

  const renderedEmails = useMemo(() => {
    return emails.map((email) => (
      <EmailRow 
        key={email.id || email._id || Math.random()} 
        email={email} 
        onEmailClick={onEmailClick} 
        onAction={onAction} 
        selected={selectedEmailIds.includes(email.id)}
        onSelect={handleSelectOne}
        availableLabels={labels}
        density={density}
        folderName={folderName}
      />
    ));
  }, [emails, onEmailClick, onAction, selectedEmailIds, labels, density]);

  if (loading && emails.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: alpha(theme.palette.background.default, 0.4), p: { xs: 0, md: 1 } }}>
      <Paper elevation={0} sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        borderRadius: { xs: 0, md: '16px' }, 
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        bgcolor: 'background.paper',
        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'
      }}>
        {/* Toolbar */}
        <Box sx={{ p: 0.5, px: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: alpha(theme.palette.divider, 0.4), gap: 1, minHeight: 48 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
            <Checkbox 
              size="small" 
              indeterminate={selectedEmailIds.length > 0 && selectedEmailIds.length < emails.length}
              checked={emails.length > 0 && selectedEmailIds.length === emails.length}
              onChange={handleSelectAll}
              sx={{ color: alpha(theme.palette.text.secondary, 0.3) }}
            />
            <IconButton size="small" onClick={onRefresh}><Refresh fontSize="small" /></IconButton>
            <IconButton size="small" onClick={handleMenuClick}><MoreVert fontSize="small" /></IconButton>
            
            <Menu
              anchorEl={menuAnchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { width: 200, mt: 1.5, '& .MuiMenuItem-root': { fontSize: '0.875rem' } }
              }}
            >
              {selectedEmailIds.length > 0 ? [
                <MenuItem key="read" onClick={() => handleBulkAction('read')}>Mark as read</MenuItem>,
                <MenuItem key="unread" onClick={() => handleBulkAction('unread')}>Mark as unread</MenuItem>,
                <MenuItem key="important" onClick={() => handleBulkAction('important')}>Mark as important</MenuItem>,
                <MenuItem key="unimportant" onClick={() => handleBulkAction('unimportant')}>Mark as not important</MenuItem>,
                <Divider key="div1" />,
                <MenuItem key="star" onClick={() => handleBulkAction('star')}>Add star</MenuItem>,
                <MenuItem key="unstar" onClick={() => handleBulkAction('unstar')}>Remove star</MenuItem>
              ] : [
                <MenuItem key="read-all" onClick={() => { onAction('all', 'read'); handleMenuClose(); }}>Mark all as read</MenuItem>,
                <MenuItem key="select-all" onClick={() => { handleSelectAll({ target: { checked: true } }); handleMenuClose(); }}>Select all</MenuItem>
              ]}
            </Menu>
            
            {selectedEmailIds.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1, borderLeft: 1, borderColor: 'divider', pl: 1 }}>
                <Tooltip title="Archive">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'archive'); clearSelection(); }}>
                    <ArchiveOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Report spam">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'spam'); clearSelection(); }}>
                    <Report fontSize="small" sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={folderName === 'trash' ? "Delete forever" : "Delete"}>
                  <IconButton size="small" onClick={() => { 
                    if (folderName === 'trash' && !window.confirm(`PERMANENT ACTION: Delete ${selectedEmailIds.length} emails forever?`)) return;
                    onAction(selectedEmailIds, 'trash'); 
                    clearSelection(); 
                  }}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />
                <Tooltip title="Mark as unread">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'unread'); clearSelection(); }}>
                    <MarkEmailReadOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Snooze">
                  <IconButton size="small" onClick={() => { onAction(selectedEmailIds, 'snooze'); clearSelection(); }}>
                    <AccessTimeOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Move to">
                  <IconButton size="small">
                    <DriveFileMove fontSize="small" sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Labels">
                  <IconButton size="small">
                    <LabelOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Pagination */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}>
              {total > 0 ? `${startIdx}-${endIdx} of ${total}` : '0-0 of 0'}
            </Typography>
            <IconButton size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={total ? endIdx >= total : true} onClick={() => setPage(page + 1)}>
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Email List */}
        <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
          <AnimatePresence>
            {renderedEmails}
          </AnimatePresence>
          {emails.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
               <InboxIcon sx={{ fontSize: 64, mb: 2 }} />
               <Typography variant="h6">No mail here.</Typography>
               <Typography variant="body2">Your inbox is so clean!</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Inbox;