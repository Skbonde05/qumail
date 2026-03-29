const { isQumailAddress } = require('../config/mailDomain');
const isPotentialSpam = (subject, body, sender, userSpamList = []) => {
  const lowerSubject = (subject || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();
  const lowerSender = (sender || '').toLowerCase();

  if (userSpamList.includes(lowerSender)) return true;

  const systemKeywords = ['admin', 'system', 'security', 'password reset', 'recovery', 'mfa', 'support'];
  const isInternal = isQumailAddress(lowerSender);
  if (!isInternal) {
    for (const sysWord of systemKeywords) {
      if (lowerSubject.includes(sysWord) || lowerBody.includes(sysWord)) {
        return true;
      }
    }
  }

  let spamScore = 0;

  const urgencyWords = ['urgent', 'emergency', 'immediate', 'asap', 'within 24 hours', 'action required', 'last chance'];
  urgencyWords.forEach(word => {
    if (lowerSubject.includes(word) || lowerBody.includes(word)) spamScore += 3;
  });

  const financialWords = ['winner', 'lottery', 'inheritance', 'bonus', 'claim your', 'credit card', 'bank account', 'bitcoin', 'crypto', 'investment'];
  financialWords.forEach(word => {
    if (lowerSubject.includes(word) || lowerBody.includes(word)) spamScore += 4;
  });

  const marketingWords = ['sale', 'offer', 'exclusive', 'discount', 'free gift', 'limited time'];
  marketingWords.forEach(word => {
    if (lowerSubject.includes(word) || lowerBody.includes(word)) spamScore += 2;
  });

  return spamScore >= 5;
};

module.exports = { isPotentialSpam };
