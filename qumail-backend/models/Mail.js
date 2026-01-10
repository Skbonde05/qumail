import mongoose from "mongoose";

const MailSchema = new mongoose.Schema({
  mailId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },

  encryption: {
    type: String,
    enum: ["NONE", "OTP", "AES"],
    default: "NONE"
  },

  aesKey: String,
  aesIV: String,

  folder: {
    type: String,
    enum: ["INBOX", "SENT"],
    required: true
  },

  owner: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});


export default mongoose.model("Mail", MailSchema);
