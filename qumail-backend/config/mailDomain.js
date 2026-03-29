const QUMAIL_DOMAIN = (process.env.QUMAIL_DOMAIN || 'qumail.com').toLowerCase().replace(/^@/, '');

const isValidEmailAddress = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isQumailAddress = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim().endsWith('@' + QUMAIL_DOMAIN);
};

module.exports = {
  QUMAIL_DOMAIN,
  isValidEmailAddress,
  isQumailAddress
};
