/**
 * @typedef {Object} IListing
 * @property {mongoose.Types.ObjectId} owner
 * @property {Object} location
 * @property {string} location.city
 * @property {string} location.area
 * @property {string} location.address
 * @property {number} rent
 * @property {Date} availableFrom
 * @property {'private' | 'shared' | 'studio'} roomType
 * @property {'furnished' | 'semi-furnished' | 'unfurnished'} furnishingStatus
 * @property {string[]} photos
 * @property {string} description
 * @property {'active' | 'filled'} status
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    city: { type: String, required: true },
    area: { type: String, required: true },
    address: { type: String, required: true }
  },
  rent: { type: Number, required: true },
  availableFrom: { type: Date, required: true },
  roomType: { type: String, enum: ['private', 'shared', 'studio'], required: true },
  furnishingStatus: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'], required: true },
  photos: [{ type: String }],
  description: { type: String },
  status: { type: String, enum: ['active', 'filled'], default: 'active' }
}, { timestamps: true });

// Index for query performance
listingSchema.index({ status: 1, 'location.city': 1, rent: 1 });

export default mongoose.model('Listing', listingSchema);
