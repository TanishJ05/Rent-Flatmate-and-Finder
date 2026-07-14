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

// @desc    Toggle a user's account status
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot toggle status of another admin');
  }

  user.active = !user.active;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.active ? 'activated' : 'suspended'} successfully`,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      active: user.active
    }
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

// @desc    Update listing status
// @route   PATCH /api/admin/listings/:id/status
// @access  Private/Admin
const updateListingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (status && ['active', 'filled', 'removed'].includes(status)) {
    listing.status = status;
  } else {
    // default to removed if no explicit status is given
    listing.status = 'removed';
  }

  await listing.save();

  res.status(200).json({
    success: true,
    data: listing
  });
});

// @desc    Get platform activity summary
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalListings,
    totalMessages,
    pendingInterests,
    acceptedInterests,
    declinedInterests
  ] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Message.countDocuments(),
    Interest.countDocuments({ status: 'pending' }),
    Interest.countDocuments({ status: 'accepted' }),
    Interest.countDocuments({ status: 'declined' })
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: totalUsers,
      listings: totalListings,
      messages: totalMessages,
      interests: {
        pending: pendingInterests,
        accepted: acceptedInterests,
        declined: declinedInterests
      }
    }
  });
});

module.exports = {
  getUsers,
  toggleUserStatus,
  getListings,
  updateListingStatus,
  getStats
};
