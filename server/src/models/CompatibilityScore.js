/**
 * @typedef {Object} ICompatibilityScore
 * @property {mongoose.Types.ObjectId} tenant
 * @property {mongoose.Types.ObjectId} listing
 * @property {number} score
 * @property {string} explanation
 * @property {'llm' | 'rule-based'} method
 * @property {Date} computedAt
 */

import mongoose from 'mongoose';

const compatibilityScoreSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  explanation: { type: String },
  method: { type: String, enum: ['llm', 'rule-based'], required: true },
  computedAt: { type: Date, default: Date.now }
});

// Compound unique index on (tenant, listing)
compatibilityScoreSchema.index({ tenant: 1, listing: 1 }, { unique: true });

export default mongoose.model('CompatibilityScore', compatibilityScoreSchema);
