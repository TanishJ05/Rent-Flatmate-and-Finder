/**
 * @typedef {Object} IInterest
 * @property {mongoose.Types.ObjectId} tenant
 * @property {mongoose.Types.ObjectId} listing
 * @property {mongoose.Types.ObjectId} owner
 * @property {'pending' | 'accepted' | 'declined'} status
 * @property {number} compatibilityScoreAtRequest
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

import mongoose from 'mongoose';

const interestSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  compatibilityScoreAtRequest: { type: Number }
}, { timestamps: true });

// Unique compound index on tenant and listing so a tenant can only express interest once per listing
interestSchema.index({ tenant: 1, listing: 1 }, { unique: true });

export default mongoose.model('Interest', interestSchema);
