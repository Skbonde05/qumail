import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { from, to, subject, message, type } = req.body;

    // ✅ HARD VALIDATION
    if (!from || !to || !message) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ NORMALIZE INPUT
    from = from.trim().toLowerCase();
    to = to.trim().toLowerCase();
    subject = subject?.trim() || "(No Subject)";
    message = message.trim();

    let body = message;
    let encryption = "NONE";
    let aesKey = null;
    let aesIV = null;

    // 🔐 AES (backend encryption)
    if (type === "AES") {
      encryption = "AES";
      aesKey = generateAESKey(); // hex string
      aesIV = generateAESIV();   // hex string
      body = encryptAES(message, aesKey, aesIV);
    }

    // 🔑 OTP (already encrypted in frontend)
    if (type === "OTP") {
      encryption = "OTP";
    }

    const baseData = {
      from,
      to,
      subject,
      body,
      encryption,
      aesKey,
      aesIV
    };

    // 📤 SENT MAIL
    await Mail.create([{
      ...baseData,
      mailId: crypto.randomUUID(),
      folder: "SENT",
      owner: from
    }], { session });

    // 📥 INBOX MAIL
    await Mail.create([{
      ...baseData,
      mailId: crypto.randomUUID(),
      folder: "INBOX",
      owner: to
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Mail sent successfully"
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("❌ Send mail error:", err);

    res.status(500).json({
      error: "Mail validation failed",
      details: err.message
    });
  } finally {
    session.endSession();
  }
});

/**
 * 📥 GET INBOX
 */
router.post("/inbox", async (req, res) => {
  try {
    const { email } = req.body;

    const mails = await Mail.find({
      owner: email.toLowerCase(),
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
  try {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to read mail" });
  }
});

export default router;
