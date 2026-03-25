const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String, // 'LOGIN', 'LOGOUT', 'KEY_REGENERATED', 'PASSWORD_CHANGED', etc.
    required: true
  },
  details: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  ipAddress: String,
  location: String,
  browser: String,
  os: String,
  deviceType: String,
  deviceInfo: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.models.SecurityLog || mongoose.model('SecurityLog', securityLogSchema);
