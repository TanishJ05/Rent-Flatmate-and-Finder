/**
 * @typedef {Object} ITenantProfile
 * @property {mongoose.Types.ObjectId} user
 * @property {Object} preferredLocation
 * @property {string} preferredLocation.city
 * @property {string} preferredLocation.area
 * @property {Object} budgetRange
 * @property {number} budgetRange.min
 * @property {number} budgetRange.max
 * @property {Date} moveInDate
 * @property {string} [preferences]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const mongoose = require('mongoose');

const tenantProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  preferredLocation: {
    city: { type: String, required: true },
    area: { type: String }
  },
  budgetRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  moveInDate: { type: Date, required: true },
  preferences: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TenantProfile', tenantProfileSchema);
