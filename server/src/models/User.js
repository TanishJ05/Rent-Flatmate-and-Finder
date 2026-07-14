/**
 * @typedef {Object} IUser
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {'tenant' | 'owner' | 'admin'} role
 * @property {string} [phone]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['tenant', 'owner', 'admin'], required: true },
  phone: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save hook to hash password with bcrypt
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method comparePassword
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
