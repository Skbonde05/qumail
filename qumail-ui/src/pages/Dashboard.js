import React, { useState, useMemo, useCallback } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery, Drawer, SwipeableDrawer } from '@mui/material';
import TopBar from '../components/dashboard/TopBar';
import Sidebar from '../components/Sidebar';
import Inbox from '../components/Inbox';
import Compose from '../components/Compose';
import NotificationList from '../components/dashboard/NotificationList';
import AppSettings from '../components/AppSettings';
import AccountSettings from '../components/AccountSettings';
import SecuritySettings from '../components/SecuritySettings';
import EmailViewer from '../components/EmailViewer';
import HelpSupport from '../components/HelpSupport';
import AboutQuMail from '../components/AboutQuMail';
import { useDashboardActions } from '../hooks/useDashboardActions';
import QuMailService from '../services/QuMailService';

const DRAWER_WIDTH = 260;

const Dashboard = ({ user, onLogout, darkMode, onToggleTheme }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  
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
    markNotificationAsRead,
    deleteNotification,
    setNotifications,
    fetchEmails,
    searchQuery,
    setSearchQuery
  } = useDashboardActions(user);

  const [activeSection, setActiveSection] = useState('inbox'); // Overrides folder view for settings/etc.

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

  const handleSendEmail = useCallback(async (to, subject, body, level) => {
    const res = await QuMailService.sendEmail(to, subject, body, level);
    if (res.success) {
      setComposeOpen(false);
      fetchEmails();
      addNotification('Email Sent', `To: ${to}`, 'success', 'CheckCircle');
    }
    return res;
  }, [fetchEmails, addNotification]);

  const filteredEmails = useMemo(() => {
    if (!searchQuery) return emails;
    const lowerQuery = searchQuery.toLowerCase();
    return emails.filter(e => 
      e.subject?.toLowerCase().includes(lowerQuery) || 
      e.from?.toLowerCase().includes(lowerQuery) || 
      e.body?.toLowerCase().includes(lowerQuery)
    );
  }, [emails, searchQuery]);

  const renderContent = () => {
    if (selectedEmailId) {
      const selectedEmail = emails.find(e => (e.uid || e.id) === selectedEmailId);
      return (
        <EmailViewer 
          email={selectedEmail} 
          onBack={() => setSelectedEmailId(null)} 
          onAction={handleAction}
        />
      );
    }

    switch (activeSection) {
      case 'settings': return <AppSettings />;
      case 'account': return <AccountSettings user={user} />;
      case 'security': return <SecuritySettings user={user} />;
      case 'help': return <HelpSupport />;
      case 'about': return <AboutQuMail />;
      default:
        return (
          <Inbox 
            emails={filteredEmails} 
            folderName={activeFolder} 
            loading={loading}
            onEmailClick={(email) => setSelectedEmailId(email.uid || email.id)}
            onAction={handleAction}
            onRefresh={() => fetchEmails()}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      <TopBar 
        user={user}
        onDrawerToggle={handleDrawerToggle}
        onProfileMenuOpen={(e) => setProfileAnchor(e.currentTarget)}
        onNotificationsOpen={(e) => setNotifAnchor(e.currentTarget)}
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
              mt: '64px', // Space for TopBar
              height: 'calc(100vh - 64px)'
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
          />
        </Drawer>
      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, 
          mt: '64px', 
          overflowY: 'auto',
          height: 'calc(100vh - 64px)'
        }}
      >
        {renderContent()}
      </Box>

      <Compose 
        open={composeOpen} 
        onClose={() => setComposeOpen(false)} 
        onSend={handleSendEmail} 
      />

      <NotificationList 
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        notifications={notifications}
        onMarkAsRead={(id) => markNotificationAsRead(id)}
        onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onDelete={(id) => deleteNotification(id)}
        onDeleteAll={() => setNotifications([])}
        onShowAll={() => { setNotifAnchor(null); handleSectionChange('notifications'); }}
      />
      
      <Sidebar.ProfileMenu 
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        onLogout={onLogout}
        onSettings={() => handleSectionChange('account')}
      />
    </Box>
  );
};

export default Dashboard;