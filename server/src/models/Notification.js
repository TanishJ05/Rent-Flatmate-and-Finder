/**
 * @typedef {Object} INotification
 * @property {mongoose.Types.ObjectId} user
 * @property {'interest_received' | 'interest_accepted' | 'interest_declined' | 'high_match'} type
 * @property {mongoose.Types.ObjectId} [relatedInterest]
 * @property {string} message
 * @property {boolean} read
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['interest_received', 'interest_accepted', 'interest_declined', 'high_match'], 
    required: true 
  },
  relatedInterest: { type: mongoose.Schema.Types.ObjectId, ref: 'Interest' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Useful index for querying unread notifications for a user
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
