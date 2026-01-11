import mongoose from "mongoose";

const MailSchema = new mongoose.Schema({
  mailId: {
    type: String,
    required: true,
    unique: true
  },

  from: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  to: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  subject: {
    type: String,
    required: true,
    default: "(No Subject)"
  },

  body: {
    type: String,
    required: true
  },

  encryption: {
    type: String,
    enum: ["NONE", "OTP", "AES"],
    default: "NONE"
  },

  // 🔐 AES (backend-only)
  aesKey: {
    type: String,
    default: null
  },

  aesIV: {
    type: String,
    default: null
  },

  folder: {
    type: String,
    enum: ["INBOX", "SENT"],
    required: true
  },

  owner: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Mail", MailSchema);
