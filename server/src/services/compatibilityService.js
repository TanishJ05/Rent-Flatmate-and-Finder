const mongoose = require('mongoose');
const CompatibilityScore = require('../models/CompatibilityScore');
const TenantProfile = require('../models/TenantProfile');
const Listing = require('../models/Listing');
const { scoreCompatibility } = require('./llmScoringService');
const { computeRuleBasedScore } = require('./ruleBasedScoringService');

/**
 * Gets the existing compatibility score or computes a new one (using AI with rule-based fallback).
 * 
 * @param {string|mongoose.Types.ObjectId} tenantId - The user ID of the tenant.
 * @param {string|mongoose.Types.ObjectId} listingId - The listing ID.
 * @param {boolean} forceRecompute - If true, skips cache and forces recomputation.
 * @returns {Promise<Object|null>} The compatibility score document, or null if no profile exists.
 */
const getOrComputeScore = async (tenantId, listingId, forceRecompute = false) => {
  // 1. Fetch dependencies first to use their updatedAt timestamps for cache invalidation
  const tenantProfile = await TenantProfile.findOne({ user: tenantId });
  if (!tenantProfile) {
    // Graceful exit for tenants who haven't completed their profile yet
    return null;
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error('Listing not found');
  }

  // 2. Check for existing score (cache) unless forced
  if (!forceRecompute) {
    const existingScore = await CompatibilityScore.findOne({
      tenant: tenantId,
      listing: listingId
    });

    if (existingScore) {
      // Check if it's older than 7 days
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const isStaleByTime = (Date.now() - existingScore.computedAt.getTime()) > SEVEN_DAYS_MS;
      
      // Check if profile or listing was updated AFTER the score was computed
      const profileUpdatedAfterScore = tenantProfile.updatedAt && (tenantProfile.updatedAt.getTime() > existingScore.computedAt.getTime());
      const listingUpdatedAfterScore = listing.updatedAt && (listing.updatedAt.getTime() > existingScore.computedAt.getTime());
      
      if (!isStaleByTime && !profileUpdatedAfterScore && !listingUpdatedAfterScore) {
        return existingScore;
      }
    }
  }

  // 3. Try computing with LLM
  let resultData;
  let methodUsed;

  try {
    const llmResult = await scoreCompatibility(tenantProfile, listing);
    resultData = llmResult;
    methodUsed = 'llm';
  } catch (error) {
    // 4. Fallback to rule-based scoring on ANY LLM failure
    console.warn(`[CompatibilityScoring] LLM failed for tenant ${tenantId}, listing ${listingId}. Reason: ${error.message}. Falling back to rule-based scorer.`);
    resultData = computeRuleBasedScore(tenantProfile, listing);
    methodUsed = 'rule-based';
  }

  // 5. Upsert the score into the database
  const scoreDoc = await CompatibilityScore.findOneAndUpdate(
    { tenant: tenantId, listing: listingId },
    {
      score: resultData.score,
      explanation: resultData.explanation,
      method: methodUsed,
      computedAt: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return scoreDoc;
};

module.exports = {
  getOrComputeScore
};
