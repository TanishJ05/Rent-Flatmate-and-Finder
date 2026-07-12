const Listing = require('../models/Listing');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create new listing
// @route   POST /api/listings
// @access  Private/Owner
const createListing = asyncHandler(async (req, res) => {
  const { location, rent, availableFrom, roomType, furnishingStatus, photos, description } = req.body;

  // Input validation
  let errors = {};

  if (rent === undefined || rent <= 0) {
    errors.rent = 'Rent must be a positive number greater than 0';
  }

  if (availableFrom) {
    const availableDate = new Date(availableFrom);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    if (availableDate < today) {
      errors.availableFrom = 'Available date cannot be in the past';
    }
  } else {
    errors.availableFrom = 'Available date is required';
  }

  const validRoomTypes = ['private', 'shared', 'studio'];
  if (!validRoomTypes.includes(roomType)) {
    errors.roomType = `Room type must be one of: ${validRoomTypes.join(', ')}`;
  }

  const validFurnishing = ['furnished', 'semi-furnished', 'unfurnished'];
  if (!validFurnishing.includes(furnishingStatus)) {
    errors.furnishingStatus = `Furnishing status must be one of: ${validFurnishing.join(', ')}`;
  }

  if (!location || !location.city || !location.area || !location.address) {
    errors.location = 'Location (city, area, address) is required';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400);
    return res.json({ success: false, message: 'Validation Error', errors });
  }

  // Note: For this assignment, we accept photo URLs as strings in the request body.
  // In a production app, we would use multer + cloud storage (e.g., AWS S3 or Cloudinary) 
  // to handle actual file uploads, storing the returned URLs here instead.

  const listing = await Listing.create({
    owner: req.user._id,
    location,
    rent,
    availableFrom,
    roomType,
    furnishingStatus,
    photos: photos || [],
    description
  });

  res.status(201).json({
    success: true,
    data: listing
  });
});

// @desc    Get owner's listings
// @route   GET /api/listings/mine
// @access  Private/Owner
const getMyListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id });

  res.status(200).json({
    success: true,
    data: listings
  });
});

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private/Owner
const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Check ownership
  if (listing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this listing');
  }

  const updatedListing = await Listing.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedListing
  });
});

// @desc    Update listing status
// @route   PATCH /api/listings/:id/status
// @access  Private/Owner
const updateListingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'filled'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Check ownership
  if (listing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this listing');
  }

  listing.status = status;
  await listing.save();
  
  // Contract: Filled listings must disappear from tenant search results
  // We will enforce this in the browse query by adding { status: 'active' }

  res.status(200).json({
    success: true,
    data: listing
  });
});

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private/Owner
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Check ownership
  if (listing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this listing');
  }

  await listing.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  createListing,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing
};
