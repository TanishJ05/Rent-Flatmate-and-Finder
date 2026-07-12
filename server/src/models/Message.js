/**
 * @typedef {Object} IMessage
 * @property {mongoose.Types.ObjectId} interest
 * @property {mongoose.Types.ObjectId} sender
 * @property {string} content
 * @property {Date} [readAt]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  interest: { type: mongoose.Schema.Types.ObjectId, ref: 'Interest', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  readAt: { type: Date, default: null }
}, { timestamps: true });

// Index for query performance: retrieving messages for a specific conversation ordered by creation time
messageSchema.index({ interest: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
