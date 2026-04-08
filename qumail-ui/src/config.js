// Frontend Dynamic Configuration Layer
const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  
  // If no env var, derive from current window hostname (essential for LAN access)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If we are on LAN (not localhost), we assume backend is on same PC at port 5000
  return isLocalhost ? 'http://localhost:5000' : `${protocol}//${hostname}:5000`;
};

const config = {
  apiUrl: getBaseUrl(),
  kmUrl: process.env.REACT_APP_KM_URL || 'http://localhost:6001',
  emailDomain: process.env.REACT_APP_EMAIL_DOMAIN || 'qumail.com',
  isProduction: process.env.NODE_ENV === 'production',
  version: '2.1.0-dynamic'
};

/**
 * Utility to get full API endpoints
 * Prevents repeating the '/api' prefix everywhere if not needed 
 */
export const getApiEndpoint = (path) => `${config.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;

export default config;
