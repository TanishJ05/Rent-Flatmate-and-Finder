const User = require('../models/User');
const Listing = require('../models/Listing');
const Interest = require('../models/Interest');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users (paginated, filterable by role)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;

  const query = {};
  if (role && ['tenant', 'owner', 'admin'].includes(role)) {
    query.role = role;
  }

  let pageNum = parseInt(page, 10);
  let limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;

  const skip = (pageNum - 1) * limitNum;

  const totalCount = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages,
    totalCount,
    data: users
  });
});

// @desc    Deactivate a user
// @route   PATCH /api/admin/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot deactivate another admin');
  }

  user.active = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Activate a user
// @route   PATCH /api/admin/users/:id/activate
// @access  Private/Admin
const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.active = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User activated successfully'
  });
});

// @desc    Get all listings
// @route   GET /api/admin/listings
// @access  Private/Admin
const getListings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  let pageNum = parseInt(page, 10);
  let limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;

  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Listing.countDocuments();
  const listings = await Listing.find()
    .populate('owner', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages,
    totalCount,
    data: listings
  });
});

// @desc    Delete any listing
// @route   DELETE /api/admin/listings/:id
// @access  Private/Admin
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  await listing.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get platform activity summary
// @route   GET /api/admin/activity
// @access  Private/Admin
const getActivity = asyncHandler(async (req, res) => {
  // Aggregate users by role
  const userStats = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);
  const usersByRole = { tenant: 0, owner: 0, admin: 0 };
  userStats.forEach(stat => {
    if (stat._id) usersByRole[stat._id] = stat.count;
  });

  // Aggregate listings by status
  const listingStats = await Listing.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const listingsByStatus = { active: 0, filled: 0 };
  listingStats.forEach(stat => {
    if (stat._id) listingsByStatus[stat._id] = stat.count;
  });

  // Aggregate interests by status
  const interestStats = await Interest.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const interestsByStatus = { pending: 0, accepted: 0, declined: 0 };
  interestStats.forEach(stat => {
    if (stat._id) interestsByStatus[stat._id] = stat.count;
  });

  // Total messages count
  const totalMessages = await Message.countDocuments();

  // 10 most recent interests
  const recentInterests = await Interest.find()
    .populate('tenant', 'name')
    .populate('listing', 'location')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('tenant listing status createdAt');

  const activityFeed = recentInterests.map(interest => ({
    _id: interest._id,
    tenantName: interest.tenant?.name || 'Unknown',
    listingLocation: interest.listing?.location 
      ? `${interest.listing.location.city}, ${interest.listing.location.area}` 
      : 'Unknown',
    status: interest.status,
    createdAt: interest.createdAt
  }));

  res.status(200).json({
    success: true,
    data: {
      usersByRole,
      listingsByStatus,
      interestsByStatus,
      totalMessages,
      activityFeed
    }
  });
});

module.exports = {
  getUsers,
  deactivateUser,
  activateUser,
  getListings,
  deleteListing,
  getActivity
};
