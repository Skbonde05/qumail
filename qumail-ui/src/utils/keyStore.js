// utils/keyStore.js

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function cacheKey(email, key) {
  localStorage.setItem(
    `otp:${email}`,
    JSON.stringify({ key, time: Date.now() })
  );
}

export function getValidKey(email) {
  const raw = localStorage.getItem(`otp:${email}`);
  if (!raw) return null;

  const { key, time } = JSON.parse(raw);
  if (Date.now() - time > OTP_EXPIRY) return null;

  return key;
}

export function clearKeyCache() {
  Object.keys(localStorage)
    .filter(k => k.startsWith("otp:"))
    .forEach(k => localStorage.removeItem(k));
}
