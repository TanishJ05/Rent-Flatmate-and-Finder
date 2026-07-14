const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const {
  getUsers,
  deactivateUser,
  activateUser,
  getListings,
  deleteListing,
  getActivity
} = require('../controllers/adminController');

const router = express.Router();

// Apply middleware to all routes in this router
router.use(protect);
router.use(authorize('admin'));

// User Management Routes
router.get('/users', getUsers);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/users/:id/activate', activateUser);

// Listing Management Routes
router.get('/listings', getListings);
router.delete('/listings/:id', deleteListing);

// Platform Activity Routes
router.get('/activity', getActivity);

module.exports = router;
