import React from 'react';
import { 
  Lock, 
  Security as ShieldCheck, 
  Mail, 
  FlashOn as Zap 
} from '@mui/icons-material';
import { Box } from '@mui/material';


export const getEncryptionLabel = (encryptionLevel) => {
  switch (encryptionLevel) {
    case 'aes256':
      return {
        text: 'AES',
        color: 'blue',
        icon: Lock,
        description: 'Quantum AES-256 Encrypted',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        textColor: 'text-blue-600 dark:text-blue-400'
      };
    case 'otp':
      return {
        text: 'OTP',
        color: 'red',
        icon: ShieldCheck,
        description: 'Quantum OTP Encrypted',
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        textColor: 'text-red-600 dark:text-red-400'
      };
    case 'none':
    default:
      return {
        text: 'STANDARD',
        color: 'gray',
        icon: Mail,
        description: 'Standard Email',
        badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        textColor: 'text-gray-600 dark:text-gray-400'
      };
  }
};

export const formatEncryptionPreview = (encryptionLevel, body) => {
  if (!body || typeof body !== 'string') return '';

  if (encryptionLevel === 'none' || !encryptionLevel) {
    // Show normal preview for standard emails
    const plainText = body.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 120) + (plainText.length > 120 ? '...' : '');
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


export const shouldShowDecryptButton = (email) => {
  // Show decrypt button for encrypted emails that haven't been decrypted
  const isEncrypted = email.encryptionLevel === 'aes256' || email.encryptionLevel === 'otp';
  const requiresDecryption = email.requiresDecryption !== false;
  const isInInbox = email.folder === 'inbox' || !email.sent;
  
  return isEncrypted && requiresDecryption && isInInbox;
};

export const isDecrypted = (email) => {
  return !shouldShowDecryptButton(email) || email.decrypted === true;
};

// Extract encryption info from email body
export const extractEncryptionInfo = (body) => {
  if (!body || typeof body !== 'string') return { isEncrypted: false };
  
  if (body.includes('[otp|') || body.startsWith('[otp|')) {
    return { isEncrypted: true, type: 'otp' };
  }
  
  if (body.includes('[aes|') || body.startsWith('[aes|')) {
    return { isEncrypted: true, type: 'aes' };
  }
  
  // Check for backend encrypted format
  if (body.includes('"iv"') && body.includes('"content"')) {
    try {
      JSON.parse(body);
      return { isEncrypted: true, type: 'aes' };
    } catch {
      return { isEncrypted: false };
    }
  }
  
  return { isEncrypted: false };
};