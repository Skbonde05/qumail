// helpers.js - Common UI helper functions
import { format } from 'date-fns';

export const determineSecurityLevel = (body) => {
  if (!body || typeof body !== 'string') return "none";
  if (body.startsWith('[otp|') || body.includes('[otp|')) return "otp";
  if (body.startsWith('[aes|') || body.includes('[aes|')) return "aes";
  return "none";
};

export const generatePreview = (body, length = 120) => {
  if (!body || typeof body !== 'string') return "";
  try {
    const plainText = body.replace(/<[^>]*>/g, '');
    const encryptedMatch = plainText.match(/^\[(otp|aes)\|[^]]+\]:/);
    if (encryptedMatch) {
      const content = plainText.substring(encryptedMatch[0].length);
      return content.substring(0, length) + (content.length > length ? "..." : "");
    }
    return plainText.substring(0, length) + (plainText.length > length ? "..." : "");
  } catch {
    return body.substring(0, 100) || "";
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    if (now.getFullYear() === date.getFullYear()) {
      return format(date, 'MMM d');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  } catch (error) {
    return "";
  }
};

export const validateQumailEmail = (email) => {
  if (!email) return false;
  return email.toLowerCase().endsWith('@qumail.com');
};

export const isValidEmailAddress = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
