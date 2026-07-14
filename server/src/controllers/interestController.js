const Interest = require('../models/Interest');
const Listing = require('../models/Listing');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getOrComputeScore } = require('../services/compatibilityService');
const {
  notifyOwnerNewInterest,
  notifyOwnerHighCompatibilityInterest,
  notifyTenantRequestAccepted,
  notifyTenantRequestDeclined
} = require('../services/emailService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create new interest request
// @route   POST /api/interests
// @access  Private/Tenant
const createInterest = asyncHandler(async (req, res) => {
  const { listingId } = req.body;

  if (!listingId) {
    res.status(400);
    throw new Error('Please provide a listingId');
  }

  // 1. Get Listing to find owner
  const listing = await Listing.findById(listingId);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Prevent tenant from showing interest in their own listing (if they somehow are the owner)
  if (listing.owner.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot show interest in your own listing');
  }

  // 2. Check for duplicate interest
  const existingInterest = await Interest.findOne({
    tenant: req.user._id,
    listing: listingId
  });

  if (existingInterest) {
    res.status(409);
    throw new Error('You have already expressed interest in this listing');
  }

  // 3. Get or compute compatibility score
  const scoreDoc = await getOrComputeScore(req.user._id, listingId);
  
  // 4. Create Interest
  const interest = await Interest.create({
    tenant: req.user._id,
    listing: listingId,
    owner: listing.owner,
    status: 'pending',
    compatibilityScoreAtRequest: scoreDoc ? scoreDoc.score : null
  });

  // 5. Create in-app Notification for Owner
  await Notification.create({
    user: listing.owner,
    type: 'interest_received',
    relatedInterest: interest._id,
    message: `A new tenant has expressed interest in your listing at ${listing.location?.address || 'your property'}.`
  });

  // 6. Send Email Notification
  const owner = await User.findById(listing.owner);
  if (owner && owner.email) {
    const listingTitle = listing.location?.address || 'your property';
    if (scoreDoc && scoreDoc.score > 80) {
      notifyOwnerHighCompatibilityInterest(owner.email, owner.name, req.user.name, listingTitle, scoreDoc.score);
    } else {
      notifyOwnerNewInterest(owner.email, owner.name, req.user.name, listingTitle);
    }
  }

  res.status(201).json({
    success: true,
    data: interest
  });
});

// @desc    Get owner's incoming interests
// @route   GET /api/interests/received
// @access  Private/Owner
const getIncomingInterests = asyncHandler(async (req, res) => {
  const interests = await Interest.find({ owner: req.user._id })
    .populate('tenant', 'name email phone')
    .populate('listing', 'location rent roomType')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: interests.length,
    data: interests
  });
});

// @desc    Get tenant's sent interests
// @route   GET /api/interests/sent
// @access  Private/Tenant
const getSentInterests = asyncHandler(async (req, res) => {
  const interests = await Interest.find({ tenant: req.user._id })
    .populate('listing', 'location rent roomType photos')
    .populate('owner', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: interests.length,
    data: interests
  });
});

// @desc    Accept an interest
// @route   PATCH /api/interests/:id/accept
// @access  Private/Owner
const acceptInterest = asyncHandler(async (req, res) => {
  const interest = await Interest.findById(req.params.id).populate('listing');

  if (!interest) {
    res.status(404);
    throw new Error('Interest not found');
  }

  // Check ownership
  if (interest.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to accept this interest');
  }

  if (interest.status !== 'pending') {
    res.status(400);
    throw new Error(`Interest is already ${interest.status}`);
  }

  interest.status = 'accepted';
  await interest.save();

  // Create notification for tenant
  await Notification.create({
    user: interest.tenant,
    type: 'interest_accepted',
    relatedInterest: interest._id,
    message: `Your interest in ${interest.listing.location?.address || 'a listing'} was accepted!`
  });

  // Send Email to tenant
  const tenant = await User.findById(interest.tenant);
  if (tenant && tenant.email) {
    const listingTitle = interest.listing.location?.address || 'a listing';
    const contactInfo = req.user.phone || req.user.email; // Owner accepting is req.user
    notifyTenantRequestAccepted(tenant.email, tenant.name, req.user.name, listingTitle, contactInfo);
  }

  res.status(200).json({
    success: true,
    data: interest
  });
});

// @desc    Decline an interest
// @route   PATCH /api/interests/:id/decline
// @access  Private/Owner
const declineInterest = asyncHandler(async (req, res) => {
  const interest = await Interest.findById(req.params.id).populate('listing');

  if (!interest) {
    res.status(404);
    throw new Error('Interest not found');
  }

  // Check ownership
  if (interest.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to decline this interest');
  }

  if (interest.status !== 'pending') {
    res.status(400);
    throw new Error(`Interest is already ${interest.status}`);
  }

  interest.status = 'declined';
  await interest.save();

  // Create notification for tenant
  await Notification.create({
    user: interest.tenant,
    type: 'interest_declined',
    relatedInterest: interest._id,
    message: `Your interest in ${interest.listing.location?.address || 'a listing'} was declined.`
  });

  // Send Email to tenant
  const tenant = await User.findById(interest.tenant);
  if (tenant && tenant.email) {
    const listingTitle = interest.listing.location?.address || 'a listing';
    notifyTenantRequestDeclined(tenant.email, tenant.name, listingTitle);
  }

  res.status(200).json({
    success: true,
    data: interest
  });
});

// @desc    Get messages for an interest
// @route   GET /api/interests/:id/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const interest = await Interest.findById(req.params.id);

  if (!interest) {
    res.status(404);
    throw new Error('Interest not found');
  }

  // Check if user is participant
  if (
    interest.tenant.toString() !== req.user._id.toString() &&
    interest.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access messages for this interest');
  }

  // Check if accepted
  if (interest.status !== 'accepted') {
    res.status(400);
    throw new Error('Interest is not accepted');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  // Fetch messages, oldest-first (for chat UI)
  const messages = await Message.find({ interest: req.params.id })
    .sort({ createdAt: 1 }) // oldest first
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name role profilePicture');

  const total = await Message.countDocuments({ interest: req.params.id });

  res.status(200).json({
    success: true,
    count: messages.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: messages
  });
});

// @desc    Mark messages as read for an interest
// @route   PATCH /api/interests/:id/messages/read
// @access  Private
const markMessagesRead = asyncHandler(async (req, res) => {
  const interest = await Interest.findById(req.params.id);

  if (!interest) {
    res.status(404);
    throw new Error('Interest not found');
  }

  // Check if user is participant
  if (
    interest.tenant.toString() !== req.user._id.toString() &&
    interest.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access messages for this interest');
  }

  if (interest.status !== 'accepted') {
    res.status(400);
    throw new Error('Interest is not accepted');
  }

  // Mark all unread messages in this interest NOT sent by current user as read
  await Message.updateMany(
    {
      interest: req.params.id,
      sender: { $ne: req.user._id },
      readAt: null
    },
    {
      $set: { readAt: new Date() }
    }
  );

  res.status(200).json({
    success: true,
    message: 'Messages marked as read'
  });
});

module.exports = {
  createInterest,
  getIncomingInterests,
  getSentInterests,
  acceptInterest,
  declineInterest,
  getMessages,
  markMessagesRead
};
