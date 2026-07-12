const express = require('express');
const router = express.Router();
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');
const {
  createListing,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing,
  getListings,
  getListingById
} = require('../controllers/listingController');

router.route('/')
  .get(optionalProtect, getListings)
  .post(protect, authorize('owner'), createListing);

router.route('/mine')
  .get(protect, authorize('owner'), getMyListings);

router.route('/:id')
  .get(getListingById)
  .put(protect, authorize('owner'), updateListing)
  .delete(protect, authorize('owner'), deleteListing);

router.route('/:id/status')
  .patch(protect, authorize('owner'), updateListingStatus);

module.exports = router;
