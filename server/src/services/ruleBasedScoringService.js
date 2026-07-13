/**
 * Computes a deterministic compatibility score based on budget and location matching.
 * 
 * Formula:
 * - Base score starts at 100.
 * - Location penalty:
 *   - If city doesn't match: -40 points
 *   - If city matches but area doesn't match: -20 points
 * - Budget penalty:
 *   - If rent > max budget: penalty = (rent - max) / max * 100 (capped at 50)
 *   - If rent < min budget: penalty = (min - rent) / min * 100 (capped at 50)
 * - Minimum score is 0.
 * 
 * @param {Object} tenantProfile - The tenant's profile
 * @param {Object} listing - The listing object
 * @returns {Object} { score: number, explanation: string }
 */
const computeRuleBasedScore = (tenantProfile, listing) => {
  let score = 100;
  let explanationParts = [];

  // Location logic
  const prefCity = tenantProfile.preferredLocation?.city?.toLowerCase() || '';
  const prefArea = tenantProfile.preferredLocation?.area?.toLowerCase() || '';
  
  const listCity = listing.location?.city?.toLowerCase() || '';
  const listArea = listing.location?.area?.toLowerCase() || '';

  if (prefCity && listCity && prefCity !== listCity) {
    score -= 40;
    explanationParts.push(`Location is in a different city (${listing.location.city}) than preferred (${tenantProfile.preferredLocation.city}).`);
  } else if (prefArea && listArea && prefArea !== listArea) {
    score -= 20;
    explanationParts.push(`Location is in the same city but different area (${listing.location.area}).`);
  } else {
    explanationParts.push('Location matches your preferences.');
  }

  // Budget logic
  const minBudget = tenantProfile.budgetRange?.min || 0;
  const maxBudget = tenantProfile.budgetRange?.max || Infinity;
  const rent = listing.rent || 0;

  if (rent > maxBudget && maxBudget > 0) {
    const overage = rent - maxBudget;
    let penalty = Math.round((overage / maxBudget) * 100);
    penalty = Math.min(penalty, 50); // cap penalty at 50 points
    score -= penalty;
    explanationParts.push(`Rent is above your maximum budget by ${overage}.`);
  } else if (rent < minBudget && minBudget > 0) {
    const underage = minBudget - rent;
    let penalty = Math.round((underage / minBudget) * 100);
    penalty = Math.min(penalty, 50); // cap penalty at 50 points
    score -= penalty;
    explanationParts.push('Rent is below your minimum budget range.');
  } else {
    explanationParts.push('Rent is within your budget.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    explanation: explanationParts.join(' ')
  };
};

module.exports = {
  computeRuleBasedScore
};
