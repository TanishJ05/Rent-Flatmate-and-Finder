const TenantProfile = require('../models/TenantProfile');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create or update tenant profile
// @route   POST /api/tenant-profile
// @route   PUT /api/tenant-profile
// @access  Private/Tenant
const createOrUpdateProfile = asyncHandler(async (req, res) => {
  const { preferredLocation, budgetRange, moveInDate, preferences } = req.body;
  
  const profileFields = {
    user: req.user._id,
    preferredLocation,
    budgetRange,
    moveInDate,
    preferences
  };

  let profile = await TenantProfile.findOne({ user: req.user._id });

  if (profile) {
    profile = await TenantProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileFields },
      { returnDocument: 'after', runValidators: true }
    );
  } else {
    profile = await TenantProfile.create(profileFields);
  }

  res.status(200).json({ success: true, data: profile });
});

// @desc    Get current tenant profile
// @route   GET /api/tenant-profile/me
// @access  Private/Tenant
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await TenantProfile.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error('Tenant profile not found');
  }

  res.status(200).json({ success: true, data: profile });
});

module.exports = {
  createOrUpdateProfile,
  getMyProfile
};
