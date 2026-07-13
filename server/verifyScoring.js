require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const TenantProfile = require('./src/models/TenantProfile');
const Listing = require('./src/models/Listing');
const CompatibilityScore = require('./src/models/CompatibilityScore');
const { getOrComputeScore } = require('./src/services/compatibilityService');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // 1. Create dummy users
  let tenantUser = await User.findOne({ email: 'test_tenant@example.com' });
  if (!tenantUser) {
    tenantUser = await User.create({ name: 'Test Tenant', email: 'test_tenant@example.com', password: 'password123', role: 'tenant' });
  }

  let ownerUser = await User.findOne({ email: 'test_owner@example.com' });
  if (!ownerUser) {
    ownerUser = await User.create({ name: 'Test Owner', email: 'test_owner@example.com', password: 'password123', role: 'owner' });
  }

  // 2. Create profile
  let tenantProfile = await TenantProfile.findOne({ user: tenantUser._id });
  if (!tenantProfile) {
    tenantProfile = await TenantProfile.create({
      user: tenantUser._id,
      preferredLocation: { city: 'Pune', area: 'Koregaon Park' },
      budgetRange: { min: 10000, max: 20000 },
      moveInDate: new Date(),
      preferences: 'Looking for a quiet place'
    });
  }

  // 3. Create listing
  let listing = await Listing.findOne({ owner: ownerUser._id });
  if (!listing) {
    listing = await Listing.create({
      owner: ownerUser._id,
      location: { city: 'Pune', area: 'Koregaon Park', address: '123 Main St' },
      rent: 18000,
      availableFrom: new Date(),
      roomType: 'private',
      furnishingStatus: 'furnished',
      description: 'Nice furnished room in a quiet society.'
    });
  }

  // Clear previous scores for testing
  await CompatibilityScore.deleteMany({ tenant: tenantUser._id, listing: listing._id });

  console.log('\n--- Testing Happy Path (LLM) ---');
  let scoreDoc = await getOrComputeScore(tenantUser._id, listing._id, true);
  console.log('Method:', scoreDoc.method);
  console.log('Score:', scoreDoc.score);
  console.log('Explanation:', scoreDoc.explanation);

  console.log('\n--- Testing Fallback Path (Rule-based) ---');
  // Temporarily break the API key
  const originalKey = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = 'invalid_key';

  let scoreDocFallback = await getOrComputeScore(tenantUser._id, listing._id, true);
  console.log('Method:', scoreDocFallback.method);
  console.log('Score:', scoreDocFallback.score);
  console.log('Explanation:', scoreDocFallback.explanation);

  // Restore key just in case
  process.env.LLM_API_KEY = originalKey;

  await mongoose.disconnect();
};

run().catch(console.error);
