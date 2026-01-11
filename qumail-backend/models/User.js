const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  storageUsed: {
    type: Number,
    default: 0 // bytes
  },
  storageLimit: {
    type: Number,
    default: 15 * 1024 * 1024 * 1024 // ✅ 15 GB
  },

   avatar: {
    type: String, // base64 image OR URL
    default: ""
  },

  settings: {
    emailNotifications: { type: Boolean, default: true },
    autoSaveDrafts: { type: Boolean, default: true },
    signature: { type: String, default: "" },
    twoFactorEnabled: { type: Boolean, default: false },
    timezone: { type: String, default: "UTC" }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
