import express from "express";
import { encryptAES, decryptAES } from "../utils/aesUtil.js";
import crypto from "crypto";

const router = express.Router();

/**
 * In-memory mail store
 * (Later you can move this to MongoDB)
 */
const mails = new Map();

/**
 * 📤 SEND MAIL (AES / NORMAL)
 * body: { to, subject, message, type }
 * type = "AES" | "NORMAL"
 */
router.post("/send", (req, res) => {
  try {
    const { to, subject, message, type } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let body = message;
    let encrypted = false;

    if (type === "AES") {
      body = encryptAES(message);
      encrypted = true;
    }

    const mailId = crypto.randomUUID();

    mails.set(mailId, {
      id: mailId,
      to,
      subject,
      body,          // stored as encrypted if AES
      encrypted,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: "Mail sent successfully",
      mailId
    });
  } catch (err) {
    console.error("Send mail error:", err);
    res.status(500).json({ error: "Failed to send mail" });
  }
});

/**
 * 📥 GET MAIL BY ID
 * If AES encrypted → decrypt BEFORE returning
 * (do NOT modify stored mail)
 */
router.get("/:id", (req, res) => {
  try {
    const mail = mails.get(req.params.id);

    if (!mail) {
      return res.status(404).json({ error: "Mail not found" });
    }

    // ✅ create a safe copy
    let responseMail = { ...mail };

    if (responseMail.encrypted === true) {
      try {
        responseMail.body = decryptAES(responseMail.body);
      } catch (decryptErr) {
        console.error("AES decrypt failed:", decryptErr);
        return res.status(500).json({
          error: "Failed to decrypt AES email"
        });
      }
    }

    res.json(responseMail);
  } catch (err) {
    console.error("Read mail error:", err);
    res.status(500).json({ error: "Failed to read mail" });
  }
});

/**
 * 📬 GET ALL MAILS
 * (Do NOT decrypt here, only metadata)
 */
router.get("/", (req, res) => {
  const list = Array.from(mails.values()).map(mail => ({
    id: mail.id,
    to: mail.to,
    subject: mail.subject,
    encrypted: mail.encrypted,
    createdAt: mail.createdAt
  }));

  res.json(list);
});

export default router;
