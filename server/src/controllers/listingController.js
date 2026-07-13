const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const TenantProfile = require('../models/TenantProfile');
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

// @desc    Get all listings (public browse with optional personalization)
// @route   GET /api/listings
// @access  Public (optional auth)
const getListings = asyncHandler(async (req, res) => {
  const { city, area, minRent, maxRent, roomType, furnishingStatus, page = 1, limit = 10 } = req.query;

  // 1. Build match query
  const matchQuery = { status: 'active' };

  if (city) matchQuery['location.city'] = { $regex: new RegExp(city, 'i') };
  if (area) matchQuery['location.area'] = { $regex: new RegExp(area, 'i') };
  if (roomType) matchQuery.roomType = roomType;
  if (furnishingStatus) matchQuery.furnishingStatus = furnishingStatus;

  if (minRent || maxRent) {
    matchQuery.rent = {};
    if (minRent) {
      if (isNaN(minRent)) {
        res.status(400);
        throw new Error('minRent must be a valid number');
      }
      matchQuery.rent.$gte = Number(minRent);
    }
    if (maxRent) {
      if (isNaN(maxRent)) {
        res.status(400);
        throw new Error('maxRent must be a valid number');
      }
      matchQuery.rent.$lte = Number(maxRent);
    }
  }

  let pageNum = parseInt(page, 10);
  let limitNum = parseInt(limit, 10);
  
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  
  const skip = (pageNum - 1) * limitNum;

  // 2. Check if user is a tenant with a profile
  let tenantId = null;
  if (req.user && req.user.role === 'tenant') {
    const profile = await TenantProfile.findOne({ user: req.user._id });
    if (profile) {
      tenantId = req.user._id;
    }
  }

  // 3. Build aggregation pipeline
  const pipeline = [
    { $match: matchQuery }
  ];

  if (tenantId) {
    pipeline.push({
      $lookup: {
        from: 'compatibilityscores',
        let: { listingId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$listing', '$$listingId'] },
                  { $eq: ['$tenant', new mongoose.Types.ObjectId(tenantId)] }
                ]
              }
            }
          }
        ],
        as: 'scoreData'
      }
    });

    pipeline.push({
      $addFields: {
        compatibilityScore: {
          $cond: {
            if: { $gt: [{ $size: '$scoreData' }, 0] },
            then: { $arrayElemAt: ['$scoreData.score', 0] },
            else: null
          }
        },
        needsScoring: {
          $cond: {
            if: { $gt: [{ $size: '$scoreData' }, 0] },
            then: false,
            else: true
          }
        }
      }
    });

    pipeline.push({
      $project: {
        scoreData: 0
      }
    });

    pipeline.push({
      $sort: {
        compatibilityScore: -1,
        createdAt: -1
      }
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1
      }
    });
  }

  // 4. Facet for pagination
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'totalCount' }],
      data: [{ $skip: skip }, { $limit: limitNum }]
    }
  });

  const results = await Listing.aggregate(pipeline);

  const totalCount = results[0].metadata[0] ? results[0].metadata[0].totalCount : 0;
  const totalPages = Math.ceil(totalCount / limitNum);
  const data = results[0].data;

  // Compute missing scores for the current page
  if (tenantId) {
    const { getOrComputeScore } = require('../services/compatibilityService');
    await Promise.all(data.map(async (listing) => {
      if (listing.needsScoring) {
        // This is a synchronous per-request tradeoff suitable for this assignment scale.
        // It computes scores on-the-fly for the current page only.
        const scoreDoc = await getOrComputeScore(tenantId, listing._id);
        if (scoreDoc) {
          listing.compatibilityScore = scoreDoc.score;
          listing.needsScoring = false;
        }
      }
    }));
  }

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages,
    totalCount,
    data
  });
});

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('owner', 'name email');

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  res.status(200).json({
    success: true,
    data: listing
  });
});

// @desc    Force recompute compatibility score for a listing
// @route   POST /api/listings/:id/compatibility
// @access  Private/Tenant
const recomputeCompatibility = asyncHandler(async (req, res) => {
  const { getOrComputeScore } = require('../services/compatibilityService');
  const scoreDoc = await getOrComputeScore(req.user._id, req.params.id, true);
  
  if (!scoreDoc) {
    res.status(400);
    throw new Error('Tenant profile incomplete, cannot compute score.');
  }

  res.status(200).json({
    success: true,
    data: scoreDoc
  });
});

module.exports = {
  createListing,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing,
  getListings,
  getListingById,
  recomputeCompatibility
};
