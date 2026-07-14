const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getUsers,
  toggleUserStatus,
  getListings,
  updateListingStatus,
  getStats
} = require('../controllers/adminController');

const router = express.Router();

// Apply middleware to all routes in this router
router.use(protect);
router.use(authorize('admin'));

// User Management Routes
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);

// Listing Management Routes
router.get('/listings', getListings);
router.patch('/listings/:id/status', updateListingStatus);

// Platform Activity Routes
router.get('/stats', getStats);

module.exports = router;
