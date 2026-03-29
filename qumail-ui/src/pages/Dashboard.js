import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery, Drawer, SwipeableDrawer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Button } from '@mui/material';
import TopBar from '../components/dashboard/TopBar';
import Sidebar from '../components/Sidebar';
import Inbox from '../components/Inbox';
import Compose from '../components/Compose';
import NotificationList from '../components/dashboard/NotificationList';
import AppSettings from '../components/AppSettings';
import AccountSettings from '../components/AccountSettings';
import SecuritySettings from '../components/SecuritySettings';
import EmailViewer from '../components/EmailViewer';
import PrivacyPolicy from '../components/PrivacyPolicy';
import AboutQuMail from '../components/AboutQuMail';
import HelpSupport from '../components/HelpSupport';
import { useDashboardActions } from '../hooks/useDashboardActions';
import QuMailService from '../services/QuMailService';

const DRAWER_WIDTH = 260;

const Dashboard = ({ user, onLogout, darkMode, onToggleTheme, themeName, onUpdateTheme, bgImage, onUpdateBgImage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [draftToEdit, setDraftToEdit] = useState(null);
  
  // Custom hook for logic
  const {
    emails,
    folderCounts,
    activeFolder,
    setActiveFolder,
    loading,
    notifications,
    addNotification,
    handleAction,
    handleDecryptEmail,
    markNotificationAsRead,
    deleteNotification,
    setNotifications,
    fetchEmails,
    searchQuery,
    setSearchQuery,
    labels,
    createLabel,
    deleteLabel,
    updateLabel,
    fetchLabels,
    isSemanticSearch,
    isAiSearchEnabled,
    setIsAiSearchEnabled
  } = useDashboardActions(user);

  const [activeSection, setActiveSection] = useState('inbox');
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#1a73e8');


  const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);

  const handleFolderChange = useCallback((folder) => {
    setActiveFolder(folder);
    setActiveSection('inbox');
    if (isMobile) setMobileOpen(false);
    setSelectedEmailId(null);
  }, [isMobile, setActiveFolder]);

  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);
    if (isMobile) setMobileOpen(false);
    setSelectedEmailId(null);
  }, [isMobile]);

  const handleReply = useCallback((email) => {
    setComposeOpen(true);
    setDraftToEdit({
      to: email.from,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: `\n\nOn ${new Date(email.date).toLocaleString()}, ${email.from} wrote:\n> ${typeof email.body === 'string' ? email.body.replace(/\n/g, '\n> ') : ''}`,
      encryptionLevel: email.encryptionLevel || 'aes256'
    });
  }, []);

  const handleReplyAll = useCallback((email) => {
    setComposeOpen(true);
    const allRecipients = [
      email.from, 
      ...(typeof email.to === 'string' ? email.to.split(',') : []), 
      ...(Array.isArray(email.cc) ? email.cc : [])
    ].map(e => e.trim().toLowerCase())
     .filter(e => e && e !== user.email.toLowerCase());
    
    const uniqueRecipients = [...new Set(allRecipients)];
    const to = email.from;
    const cc = uniqueRecipients.filter(r => r !== to.toLowerCase()).join(', ');

    setDraftToEdit({
      to,
      cc,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: `\n\nOn ${new Date(email.date).toLocaleString()}, ${email.from} wrote:\n> ${typeof email.body === 'string' ? email.body.replace(/\n/g, '\n> ') : ''}`,
      encryptionLevel: email.encryptionLevel || 'aes256'
    });
  }, [user.email]);

  const handleForward = useCallback((email) => {
    setComposeOpen(true);
    setDraftToEdit({
      subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject}\nTo: ${email.to}\n\n${typeof email.body === 'string' ? email.body : ''}`,
      attachments: email.attachments || [],
      encryptionLevel: email.encryptionLevel || 'aes256'
    });
  }, []);

  const handleSendEmail = useCallback((to, subject, body, level, messageId) => {
    // The actual sending is handled inside the Compose component.
    // This callback is for refreshing the UI and notifying the user.
    setComposeOpen(false);
    setDraftToEdit(null);
    fetchEmails();
    addNotification('Email Sent', `To: ${to}`, 'success', 'CheckCircle');
  }, [fetchEmails, addNotification]);

  useEffect(() => {
    const unreadCount = folderCounts.unread || 0;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Qumail - Quantum Secure Email`;
    } else {
      document.title = `Qumail - Quantum Secure Email`;
    }
  }, [folderCounts.unread]);


  const renderContent = () => {

    if (selectedEmailId) {
      const selectedEmail = emails.find(e => (e.uid || e.id) === selectedEmailId);
      return (
        <EmailViewer 
          email={selectedEmail} 
          onBack={() => setSelectedEmailId(null)} 
          onAction={handleAction}
          onDecryptEmail={handleDecryptEmail}
          onReply={handleReply}
          onReplyAll={handleReplyAll}
          onForward={handleForward}
        />
      );
    }

    switch (activeSection) {
      case 'settings': return <AppSettings darkMode={darkMode} onToggleTheme={onToggleTheme} userEmail={user?.email} />;
      case 'account': return <AccountSettings user={user} themeName={themeName} onUpdateTheme={onUpdateTheme} bgImage={bgImage} onUpdateBgImage={onUpdateBgImage} />;
      case 'security': return <SecuritySettings user={user} />;
      case 'about': return <AboutQuMail />;
      case 'privacy': return <PrivacyPolicy />;
      case 'help': return <HelpSupport onCompose={() => setComposeOpen(true)} />;
      default:
        return (
          <Inbox 
            emails={emails} 
            folderName={activeFolder} 
            loading={loading}
            labels={labels}
            onEmailClick={(email) => {
              if (activeFolder === 'drafts') {
                setDraftToEdit(email);
                setComposeOpen(true);
              } else {
                setSelectedEmailId(email.uid || email.id);
              }
            }}
            onAction={handleAction}
            onRefresh={() => fetchEmails()}
          />
        );
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden', 
        bgcolor: 'background.default',
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        transition: 'background-image 0.5s ease-in-out'
      }}
    >
      <CssBaseline />
      
      <TopBar 
        user={user}
        onDrawerToggle={handleDrawerToggle}
        onProfileMenuOpen={(e) => setProfileAnchor(e.currentTarget)}
        isProfileMenuOpen={Boolean(profileAnchor)}
        onNotificationsOpen={(e) => setNotifAnchor(e.currentTarget)}
        unreadNotifications={notifications.filter(n => !n.read).length}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        isSemanticSearch={isSemanticSearch}
        isAiSearchEnabled={isAiSearchEnabled}
        onToggleAiSearch={() => setIsAiSearchEnabled(!isAiSearchEnabled)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Navigation - Responsive Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile SwipeableDrawer */}
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={handleDrawerToggle}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: 'none',
              boxShadow: theme.shadows[8]
            },
          }}
        >
          <Sidebar 
            activeFolder={activeFolder}
            activeSection={activeSection}
            onFolderChange={handleFolderChange}
            onSectionChange={handleSectionChange}
            onCompose={() => { setComposeOpen(true); setMobileOpen(false); }}
            folderCounts={folderCounts}
            drawerWidth={DRAWER_WIDTH}
            user={user}
            labels={labels}
            onAddLabel={() => setLabelDialogOpen(true)}
            onDeleteLabel={deleteLabel}
          />
        </SwipeableDrawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH, 
              borderRight: 1, 
              borderColor: 'divider',
              mt: '72px', // Space for TopBar
              height: 'calc(100vh - 72px)'
            },
          }}
          open
        >
          <Sidebar 
            activeFolder={activeFolder}
            activeSection={activeSection}
            onFolderChange={handleFolderChange}
            onSectionChange={handleSectionChange}
            onCompose={() => setComposeOpen(true)}
            folderCounts={folderCounts}
            drawerWidth={DRAWER_WIDTH}
            user={user}
            labels={labels}
            onAddLabel={() => { setEditingLabelId(null); setNewLabelName(''); setNewLabelColor('#1a73e8'); setLabelDialogOpen(true); }}
            onEditLabel={(label) => { setEditingLabelId(label.id); setNewLabelName(label.name); setNewLabelColor(label.color); setLabelDialogOpen(true); }}
            onDeleteLabel={deleteLabel}
          />
        </Drawer>

      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, 
          mt: '72px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 72px)'
        }}
      >
        {renderContent()}
      </Box>

      <Compose 
        open={composeOpen} 
        onClose={() => { setComposeOpen(false); setDraftToEdit(null); }} 
        onSend={handleSendEmail} 
        draftToEdit={draftToEdit}
      />

      <NotificationList 
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        notifications={notifications}
        onMarkAsRead={(id) => markNotificationAsRead(id)}
        onMarkAllAsRead={() => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setNotifAnchor(null); }}
        onDelete={(id) => deleteNotification(id)}
        onDeleteAll={() => { setNotifications([]); setNotifAnchor(null); }}
        onShowAll={() => { setNotifAnchor(null); handleSectionChange('notifications'); }}
      />
      
      <Sidebar.ProfileMenu 
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        onLogout={onLogout}
        onAppSettings={() => handleSectionChange('settings')}
        onAccountSettings={() => handleSectionChange('account')}
        onThemes={() => handleSectionChange('account')}
        onPrivacy={() => handleSectionChange('privacy')}
        onHelp={() => handleSectionChange('help')}
        user={user}
      />



      {/* Label Dialog */}
      <Dialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingLabelId ? 'Edit Label' : 'Create New Label'}</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Label Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Label Color
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {['#1a73e8', '#d93025', '#f9ab00', '#188038', '#fa7b17', '#9334e6', '#12b5cb', '#607d8b'].map((color) => (
              <Box
                key={color}
                onClick={() => setNewLabelColor(color)}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: color,
                  cursor: 'pointer',
                  border: newLabelColor === color ? '2px solid' : 'none',
                  borderColor: theme.palette.mode === 'dark' ? 'white' : 'black',
                  boxShadow: 1
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLabelDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              if (editingLabelId) {
                if (await updateLabel(editingLabelId, newLabelName, newLabelColor)) {
                  setLabelDialogOpen(false);
                  setEditingLabelId(null);
                }
              } else {
                if (await createLabel(newLabelName, newLabelColor)) {
                  setLabelDialogOpen(false);
                  setNewLabelName('');
                }
              }
            }}
            disabled={!newLabelName}
          >
            {editingLabelId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
};

export default Dashboard;