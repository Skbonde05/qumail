import express from "express";
import crypto from "crypto";
import Mail from "../models/Mail.js";
import {
  encryptAES,
  decryptAES,
  generateAESKey,
  generateAESIV
} from "../utils/aesUtil.js";

const router = express.Router();

/**
 * 📤 SEND MAIL
 * body: { from, to, subject, message, type }
 * type = "AES" | "OTP" | "NORMAL"
 */
router.post("/send", async (req, res) => {
  try {
    const { from, to, subject, message, type } = req.body;

    if (!from || !to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let body = message;
    let encryption = "NONE";
    let aesKey = null;
    let aesIV = null;

    // 🔐 AES (backend encryption)
    if (type === "AES") {
      encryption = "AES";
      aesKey = generateAESKey(); // ✅ STRING
      aesIV = generateAESIV();   // ✅ STRING
      body = encryptAES(message, aesKey, aesIV);
    }

    // 🔑 OTP (already encrypted in frontend)
    if (type === "OTP") {
      encryption = "OTP";
    }

    // 📤 SENT
    await Mail.create({
      mailId: crypto.randomUUID(),
      from,
      to,
      subject,
      body,
      encryption,
      aesKey,
      aesIV,
      folder: "SENT",
      owner: from
    });

    // 📥 INBOX
    await Mail.create({
      mailId: crypto.randomUUID(),
      from,
      to,
      subject,
      body,
      encryption,
      aesKey,
      aesIV,
      folder: "INBOX",
      owner: to
    });

    res.json({ success: true, message: "Mail sent successfully" });

  } catch (err) {
    console.error("❌ Send mail error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📥 GET INBOX (persisted)
 */
router.post("/inbox", async (req, res) => {
  try {
    const { email } = req.body;

    const mails = await Mail.find({
      owner: email,
      folder: "INBOX"
    })
      .select("-aesKey -aesIV")
      .sort({ createdAt: -1 });

    res.json({ success: true, mails });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
});

/**
 * 📄 READ MAIL (decrypt safely)
 */
router.get("/:mailId", async (req, res) => {
  const mail = await Mail.findOne({ mailId: req.params.mailId });
  if (!mail) return res.status(404).json({ error: "Mail not found" });

  const response = { ...mail._doc };

  if (response.encryption === "AES") {
    response.body = decryptAES(
      response.body,
      response.aesKey,
      response.aesIV
    );
  }

  delete response.aesKey;
  delete response.aesIV;

  res.json({ success: true, mail: response });
});

export default router;
