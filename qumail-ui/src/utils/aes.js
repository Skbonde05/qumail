import crypto from "crypto";

const ALGO = "aes-256-cbc";

export function generateAESKey() {
  return crypto.randomBytes(32).toString("hex"); // 256-bit
}

export function generateAESIV() {
  return crypto.randomBytes(16).toString("hex"); // 128-bit
}

export function encryptAES(text, keyHex, ivHex) {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decryptAES(encryptedHex, keyHex, ivHex) {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
