// models/Mail.js - Cleaned up version
const mongoose = require('mongoose');

const MailSchema = new mongoose.Schema({
  mailId: {
    type: String,
    required: true,
    // Note: uniqueness is handled by a compound index (mailId + owner) below
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

  preview: {
    type: String,
    default: ""
  },

  encryption: {
    type: String,
    enum: ["NONE", "OTP", "AES"],
    default: "NONE"
  },

  encryptionLevel: {
    type: String,
    enum: ["none", "otp", "aes256"],
    default: "none"
  },

  //  AES (backend-only fields)
  aesKey: {
    type: String,
    default: null
  },

  aesIV: {
    type: String,
    default: null
  },

  //  OTP (Quantum Key)
  otpKey: {
    type: String,
    default: null
  },

  folder: {
    type: String,
    required: true,
    default: "INBOX"
  },

  owner: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  read: {
    type: Boolean,
    default: false
  },

  starred: {
    type: Boolean,
    default: false
  },

  important: {
    type: Boolean,
    default: false
  },

  trash: {
    type: Boolean,
    default: false
  },

  snoozed: {
    type: Date,
    default: null
  },

  cc: [{
    type: String,
    lowercase: true,
    trim: true,
    default: []
  }],

  bcc: [{
    type: String,
    lowercase: true,
    trim: true,
    default: []
  }],

  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    data: String, // Base64 encoded for simplicity in this version, OR a GridFS/S3 link
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  labels: [{
    type: String,
    default: []
  }],

  // Metadata
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  sentAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// CRITICAL: Compound unique index for mailId + owner
// This allows the same mailId to exist for different users (sender vs recipient)
MailSchema.index({ mailId: 1, owner: 1 }, { unique: true });

// Performance indexes
MailSchema.index({ owner: 1, folder: 1, trash: 1, createdAt: -1 });
MailSchema.index({ owner: 1, starred: 1 });
MailSchema.index({ owner: 1, important: 1 });
MailSchema.index({ owner: 1, read: 1 });

module.exports = mongoose.model("Mail", MailSchema);