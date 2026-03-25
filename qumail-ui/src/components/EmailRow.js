import React from 'react';
import {
  StarBorder as StarBorderIcon,
  Star as StarIcon,
  LabelImportant as ImportantIcon,
  LabelImportantOutlined as ImportantOutlinedIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import {
  IconButton,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Typography,
  Chip,
  Box
} from '@mui/material';

// Encryption label helper
import { Lock, Security as ShieldCheck, Mail } from '@mui/icons-material';


const getEncryptionLabel = (encryptionLevel) => {
  switch (encryptionLevel) {
    case 'aes256':
      return {
        text: 'AES Encrypted',
        color: 'primary',
        badgeColor: 'primary',
        icon: Lock,
        description: 'Quantum AES-256 Encrypted'
      };
    case 'otp':
      return {
        text: 'OTP Encrypted',
        color: 'error',
        badgeColor: 'error',
        icon: ShieldCheck,
        description: 'Quantum OTP Encrypted'
      };
    case 'none':
    default:
      return {
        text: 'Standard',
        color: 'default',
        badgeColor: 'default',
        icon: Mail,
        description: 'Standard Email'
      };
  }
};

// Format email preview
const formatEncryptionPreview = (encryptionLevel, body) => {
  if (!body || typeof body !== 'string') return '';
  
  if (encryptionLevel === 'none' || !encryptionLevel) {
    // Show normal preview for standard emails
    const plainText = body.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 80) + (plainText.length > 80 ? '...' : '');
  } else {
    // Show encrypted preview for OTP/AES
    const label = getEncryptionLabel(encryptionLevel);
    const Icon = label.icon;
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <Icon sx={{ fontSize: 14 }} />
        {label.description}
      </Box>
    );
  }
};


const EmailRow = ({
  email,
  isSelected,
  onSelect,
  onStarToggle,
  onImportantToggle,
  onDelete,
  onArchive,
  onMarkAsRead,
  onClick
}) => {
  const encryptionLabel = getEncryptionLabel(email?.encryptionLevel);
  const previewText = formatEncryptionPreview(email?.encryptionLevel, email?.body || email?.preview || '');
  
  const isEncrypted = email?.encryptionLevel === 'aes256' || email?.encryptionLevel === 'otp';
  const isRead = email?.read !== false;

  return (
    <ListItem
      button
      selected={isSelected}
      onClick={(e) => {
        if (e.target.type !== 'checkbox') {
          onClick(email);
        }
      }}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          backgroundColor: 'action.hover'
        },
        '&.Mui-selected': {
          backgroundColor: 'action.selected'
        },
        padding: '8px 16px',
        minHeight: '64px'
      }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected || false}
        onChange={(e) => onSelect(email?.uid, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        size="small"
        sx={{ mr: 1 }}
      />

      {/* Star */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onStarToggle(email?.uid, !email?.starred);
        }}
        sx={{ mr: 1 }}
      >
        {email?.starred ? (
          <StarIcon sx={{ color: 'warning.main' }} />
        ) : (
          <StarBorderIcon />
        )}
      </IconButton>

      {/* Important */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onImportantToggle(email?.uid, !email?.important);
        }}
        sx={{ mr: 1 }}
      >
        {email?.important ? (
          <ImportantIcon sx={{ color: 'error.main' }} />
        ) : (
          <ImportantOutlinedIcon />
        )}
      </IconButton>

      {/* Email Content */}
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: isRead ? 'normal' : 'bold',
                color: isRead ? 'text.secondary' : 'text.primary'
              }}
            >
              {email?.from || email?.sender || 'Unknown'}
            </Typography>
            
            {/* Encryption Badge */}
            <Chip
              label={encryptionLabel.text}
              size="small"
              color={encryptionLabel.badgeColor}
              variant="outlined"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.65rem',
                height: '20px',
                '& .MuiChip-label': {
                  px: 0.75
                }
              }}
            />

            {/* Attachment Icon */}
            {email?.attachments && email.attachments.length > 0 && (
              <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary', transform: 'rotate(45deg)' }} />
            )}
            
            {/* Unread dot */}
            {!isRead && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  ml: 0.5
                }}
              />
            )}
          </Box>
        }
        secondary={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: isRead ? 'normal' : 'medium',
                maxWidth: '70%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontWeight: 'bold' }}>
                {email?.subject || '(No Subject)'}
              </span>
              {' - '}
              {previewText}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{ 
                color: 'text.secondary',
                minWidth: '60px',
                textAlign: 'right'
              }}
            >
              {email?.date || 'Just now'}
            </Typography>
          </Box>
        }
        sx={{ 
          ml: 1,
          '& .MuiListItemText-secondary': {
            display: 'flex',
            alignItems: 'center'
          }
        }}
      />

      {/* Quick Actions */}
      <ListItemSecondaryAction>
        <Box display="flex" alignItems="center">
          {email?.folder === 'inbox' && !email?.archived && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(email?.uid);
              }}
              title="Archive"
              sx={{ mr: 0.5 }}
            >
              <ArchiveIcon fontSize="small" />
            </IconButton>
          )}
          
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(email?.uid);
            }}
            title="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default EmailRow;