import React from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
  Badge,
  Avatar,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Create,
  Inbox,
  Send,
  Drafts,
  Delete,
  Star,
  LabelImportant,
  Schedule,
  Archive,
  Report,
  Mail,
  ExpandMore,
  Add,
  Person,
  ExitToApp
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const StyledListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: "0 20px 20px 0",
  marginRight: "16px",
  backgroundColor: selected ? theme.palette.primary.light : "transparent",
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.action.hover,
  },
  "& .MuiListItemIcon-root": {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: "40px"
  }
}));

const SidebarItem = ({ icon: Icon, text, count, selected, onClick }) => (
  <StyledListItem selected={selected} onClick={onClick}>
    <ListItemIcon>
      <Icon fontSize="small" />
    </ListItemIcon>
    <ListItemText 
      primary={text}
      primaryTypographyProps={{
        fontSize: "0.875rem",
        fontWeight: selected ? "600" : "400"
      }}
    />
    {count > 0 && (
      <Typography variant="caption" sx={{ fontWeight: "500", mr: 1 }}>
        {count}
      </Typography>
    )}
  </StyledListItem>
);

export default function Sidebar({ 
  onCompose, 
  activeSection, 
  setActiveSection,
  emailStats = {},
  userEmail,
  userAvatar,
  onLogout,
  // Add new props for labels functionality
  labels = [],
  onCreateLabel,
  onSelectLabel
}) {
  // Initialize folderCounts with defaults
  const folderCounts = {
    inbox: 0,
    starred: 0,
    snoozed: 0,
    important: 0,
    sent: 0,
    drafts: 0,
    archive: 0,
    spam: 0,
    trash: 0,
    ...emailStats // Override with provided stats
  };

  const sections = [
    { id: "inbox", icon: Inbox, text: "Inbox", count: folderCounts.inbox },
    { id: "starred", icon: Star, text: "Starred", count: folderCounts.starred },
    { id: "snoozed", icon: Schedule, text: "Snoozed", count: folderCounts.snoozed },
    { id: "important", icon: LabelImportant, text: "Important", count: folderCounts.important },
    { id: "sent", icon: Send, text: "Sent", count: folderCounts.sent },
    { id: "drafts", icon: Drafts, text: "Drafts", count: folderCounts.drafts },
    { id: "archive", icon: Archive, text: "Archive", count: folderCounts.archive },
    { id: "spam", icon: Report, text: "Spam", count: folderCounts.spam },
    { id: "trash", icon: Delete, text: "Trash", count: folderCounts.trash },
  ];

  // Default labels if none provided
  const defaultLabels = [
    { id: "work", name: "Work", color: "#4285f4" },
    { id: "personal", name: "Personal", color: "#34a853" },
    { id: "travel", name: "Travel", color: "#fbbc04" },
    { id: "finance", name: "Finance", color: "#ea4335" },
  ];

  // Use provided labels or defaults
  const labelList = labels.length > 0 ? labels : defaultLabels;

  // Handle label click
  const handleLabelClick = (label) => {
    if (onSelectLabel) {
      onSelectLabel(label.id || label.name);
    } else {
      // Fallback: set active section to label name
      setActiveSection(`label:${label.id || label.name}`);
    }
  };

  // Handle create label click
  const handleCreateLabel = () => {
    if (onCreateLabel) {
      onCreateLabel();
    } else {
      // Fallback: show prompt or console log
      const labelName = prompt("Enter new label name:");
      if (labelName) {
        console.log("Creating label:", labelName);
        // In a real app, you would dispatch an action or call an API
        alert(`Label "${labelName}" created! (This is a demo)`);
      }
    }
  };

  return (
    <Box sx={{ 
      width: 280,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #e0e0e0",
      bgcolor: "background.paper"
    }}>
      {/* Compose Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Create />}
          onClick={onCompose}
          sx={{
            borderRadius: "24px",
            py: 1.5,
            textTransform: "none",
            fontSize: "0.9375rem",
            fontWeight: "500",
            boxShadow: "0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149)",
            "&:hover": {
              boxShadow: "0 1px 3px 0 rgba(60,64,67,0.302), 0 4px 8px 3px rgba(60,64,67,0.149)"
            }
          }}
        >
          Compose
        </Button>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        <List disablePadding>
          {sections.map((section) => (
            <SidebarItem
              key={section.id}
              icon={section.icon}
              text={section.text}
              count={section.count}
              selected={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Labels */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="500">
            LABELS
          </Typography>
        </Box>
        <List disablePadding>
          {labelList.map((label) => {
            const isSelected = activeSection === `label:${label.id || label.name}`;
            return (
              <StyledListItem 
                key={label.id || label.name}
                selected={isSelected}
                onClick={() => handleLabelClick(label)}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: label.color,
                      ml: 1
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={label.name}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? "600" : "400"
                  }}
                />
                {/* Optionally show count for labels */}
                {label.count > 0 && (
                  <Typography variant="caption" sx={{ fontWeight: "500", mr: 1 }}>
                    {label.count}
                  </Typography>
                )}
              </StyledListItem>
            );
          })}
          <StyledListItem onClick={handleCreateLabel}>
            <ListItemIcon>
              <Add fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Create new label"
              primaryTypographyProps={{
                fontSize: "0.875rem"
              }}
            />
          </StyledListItem>
        </List>
      </Box>

      {/* User Profile */}
      <Box sx={{ 
        mt: "auto",
        p: 2, 
        borderTop: "1px solid #e0e0e0",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        gap: 1.5
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'primary.main',
              fontSize: '1rem'
            }}
            src={userAvatar}
          >
            {userAvatar ? null : (userEmail?.charAt(0).toUpperCase() || 'U')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight="600">
              {userEmail?.split('@')[0] || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userEmail || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Sign Out">
            <IconButton size="small" onClick={onLogout}>
              <ExitToApp fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small">
            <ExpandMore fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}