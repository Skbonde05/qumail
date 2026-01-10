const KEY_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function loadStore() {
  return JSON.parse(localStorage.getItem("quantumKeyStore") || "{}");
}

function saveStore(store) {
  localStorage.setItem("quantumKeyStore", JSON.stringify(store));
}

export function clearKeyCache() {
  console.log("Key cache cleared");
}

export function cacheKey(email, level, key) {
  const store = loadStore();
  if (!store[email]) store[email] = [];

  store[email].push({
    level,
    key,
    createdAt: Date.now(),
    used: false
  });

  saveStore(store);
}

export function getUnusedValidKey(email, level) {
  const store = loadStore();
  const now = Date.now();

  if (!store[email]) return null;

  const keyObj = store[email].find(
    k => k.level === level && !k.used && (now - k.createdAt < KEY_EXPIRY_MS)
  );

  if (keyObj) {
    keyObj.used = true;
    saveStore(store);
    return keyObj.key;
  }

  return null;
}
