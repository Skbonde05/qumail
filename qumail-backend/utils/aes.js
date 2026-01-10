import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// MUST be hex strings
const KEY = Buffer.from(process.env.AES_KEY, "hex");
const IV = Buffer.from(process.env.AES_IV, "hex");

export function encryptAES(text) {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decryptAES(encryptedText) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
