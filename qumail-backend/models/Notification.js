const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String, // 'info', 'success', 'warning', 'error'
    default: 'info'
  },
  icon: String, // Icon name from MUI icons
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
