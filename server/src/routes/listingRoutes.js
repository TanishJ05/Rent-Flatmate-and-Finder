const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createListing,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing
} = require('../controllers/listingController');

// All routes require authentication and 'owner' role
router.use(protect);
router.use(authorize('owner'));

router.route('/')
  .post(createListing);

router.route('/mine')
  .get(getMyListings);

router.route('/:id')
  .put(updateListing)
  .delete(deleteListing);

router.route('/:id/status')
  .patch(updateListingStatus);

module.exports = router;
