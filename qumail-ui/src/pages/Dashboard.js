import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery, Drawer, SwipeableDrawer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Button, CircularProgress } from '@mui/material';
import TopBar from '../components/dashboard/TopBar';
import Sidebar from '../components/Sidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import QuMailService from '../services/QuMailService';

const Inbox = lazy(() => import('../components/Inbox'));
const Compose = lazy(() => import('../components/Compose'));
const NotificationList = lazy(() => import('../components/dashboard/NotificationList'));
const QuickSettings = lazy(() => import('../components/dashboard/QuickSettings'));
const EmailViewer = lazy(() => import('../components/EmailViewer'));
const PrivacyPolicy = lazy(() => import('../components/PrivacyPolicy'));
const AboutQuMail = lazy(() => import('../components/AboutQuMail'));
const HelpSupport = lazy(() => import('../components/HelpSupport'));


const DRAWER_WIDTH = 260;
const SETTING_DRAWER_WIDTH = 360;

const Dashboard = ({ 
  user, 
  onUserUpdate, 
  onLogout, 
  darkMode, 
  onToggleTheme, 
  themeName, 
  onUpdateTheme, 
  bgImage, 
  onUpdateBgImage 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState(null);
  const [density, setDensity] = useState(() => {
    const saved = localStorage.getItem('qumail_settings');
    if (saved) {
      try {
        return JSON.parse(saved).density || 'comfortable';
      } catch (e) {}
    }
    return 'comfortable';
  });

  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e.detail && e.detail.density) {
        setDensity(e.detail.density);
      }
    };
    window.addEventListener('qumail-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('qumail-settings-updated', handleSettingsUpdate);
  }, []);
  
  // Migration: Clear legacy signature if it matches the default
  useEffect(() => {
    const saved = localStorage.getItem('qumail_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.signature && parsed.signature.includes('Sent from QuMail')) {
          const updated = { ...parsed, signature: '' };
          localStorage.setItem('qumail_settings', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('qumail-settings-updated', { detail: updated }));
        }
      } catch (e) {}
    }
  }, []);

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
    markAllNotificationsAsRead,
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
    page,
    setPage,
    total,
    limit,
  } = useDashboardActions(user);


  // Listen for test notifications in real-time
  useEffect(() => {
    const handleTestNotif = (event) => {
      if (event.detail) {
        addNotification(event.detail.title, event.detail.message, 'success', 'Notifications');
      }
    };
    window.addEventListener('qumail-test-notif', handleTestNotif);
    return () => window.removeEventListener('qumail-test-notif', handleTestNotif);
  }, [addNotification]);

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
    if (['settings', 'account', 'security', 'themes'].includes(section)) {
      setQuickSettingsOpen(prev => !prev);
      return;
    }
    setActiveSection(section);
    if (section !== 'inbox' && section !== 'folder') {
      setSelectedEmailId(null);
    }
    setMobileOpen(false);
  }, []);

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

  const handleLabelButtonClick = useCallback((labelData = null) => {
    // Check if labelData is a valid label object and not a mouse event
    if (labelData && typeof labelData === 'object' && labelData.id && typeof labelData.id === 'string') {
      setEditingLabelId(labelData.id);
      setNewLabelName(labelData.name || '');
      setNewLabelColor(labelData.color || '#1a73e8');
    } else {
      setEditingLabelId(null);
      setNewLabelName('');
      setNewLabelColor('#1a73e8');
    }
    setLabelDialogOpen(true);
  }, []);

  useEffect(() => {
    const unreadCount = folderCounts.unread || 0;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Qumail - Quantum Secure Email`;
    } else {
      document.title = `Qumail - Quantum Secure Email`;
    }
  }, [folderCounts.unread]);


  const renderContent = () => {
    return (
      <Suspense fallback={
        <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }>
        {selectedEmailId ? (
          <EmailViewer 
            email={emails.find(e => (e.uid || e.id) === selectedEmailId)} 
            folderName={activeFolder}
            onBack={() => setSelectedEmailId(null)} 
            onAction={handleAction}
            onDecryptEmail={handleDecryptEmail}
            onReply={handleReply}
            onReplyAll={handleReplyAll}
            onForward={handleForward}
          />

        ) : (
          activeSection === 'about' ? <AboutQuMail /> :
          activeSection === 'privacy' ? <PrivacyPolicy /> :
          activeSection === 'help' ? <HelpSupport onCompose={() => setComposeOpen(true)} /> :
          <Inbox 
            emails={emails} 
            folderName={activeFolder} 
            loading={loading}
            labels={labels}
            page={page}
            setPage={setPage}
            total={total}
            limit={limit}
            density={density}
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
        )}
      </Suspense>
    );
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
        onSettingsOpen={() => setQuickSettingsOpen(prev => !prev)}
        unreadNotifications={notifications.filter(n => !n.read).length}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
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
            onCreateLabel={handleLabelButtonClick}
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
            onCreateLabel={handleLabelButtonClick}
            onDeleteLabel={deleteLabel}
          />
        </Drawer>

      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          width: { 
            md: quickSettingsOpen
                ? `calc(100% - ${DRAWER_WIDTH + SETTING_DRAWER_WIDTH}px)` 
                : `calc(100% - ${DRAWER_WIDTH}px)` 
          }, 
          mt: '72px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 72px)',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(quickSettingsOpen && {
            mr: { md: `${SETTING_DRAWER_WIDTH}px` },
          }),
        }}
      >
        {renderContent()}
      </Box>

      <Suspense fallback={null}>
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
          onMarkAllAsRead={() => { markAllNotificationsAsRead(); setNotifAnchor(null); }}
          onDelete={(id) => deleteNotification(id)}
          onDeleteAll={() => { /* In a real app add batch delete API */ setNotifAnchor(null); }}
          onShowAll={() => { setNotifAnchor(null); handleSectionChange('notifications'); }}
        />

      </Suspense>


      {/* Quick Settings Drawer */}
      <Drawer
        anchor="right"
        open={quickSettingsOpen}
        onClose={() => setQuickSettingsOpen(false)}
        variant={isMobile ? "temporary" : "persistent"}
        ModalProps={{ keepMounted: true, hideBackdrop: true }}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer,
        }}
        PaperProps={{
          sx: {
            width: SETTING_DRAWER_WIDTH,
            top: 65,
            height: 'calc(100% - 65px)',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 8px 10px -5px rgba(0,0,0,0.2), 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12)',
            borderLeft: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }
        }}
      >
        <Suspense fallback={<CircularProgress sx={{ m: 2 }} />}>
          <QuickSettings 
            onClose={() => setQuickSettingsOpen(false)} 
            darkMode={darkMode}
            onToggleTheme={onToggleTheme}
            themeName={themeName}
            onUpdateTheme={onUpdateTheme}
            bgImage={bgImage}
            onUpdateBgImage={onUpdateBgImage}
            user={user}
            onUserUpdate={onUserUpdate}
          />
        </Suspense>

      </Drawer>
      
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
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5, mt: 1 }}>
            {[
              '#1a73e8', '#ea4335', '#fabb05', '#34a853', '#8b5cf6', '#ec4899',
              '#1e293b', '#64748b', '#0d9488', '#d97706', '#be185d', '#4338ca',
              '#e0e7ff', '#fef3c7', '#dcfce7', '#fee2e2', '#f3e8ff', '#f1f5f9'
            ].map((color) => (
              <Box
                key={color}
                onClick={() => setNewLabelColor(color)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: color,
                  cursor: 'pointer',
                  border: newLabelColor === color ? '3px solid' : '1px solid',
                  borderColor: newLabelColor === color ? (theme.palette.mode === 'dark' ? 'white' : 'black') : 'divider',
                  boxShadow: newLabelColor === color ? 2 : 0,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' }
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