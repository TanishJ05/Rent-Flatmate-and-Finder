const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Placeholder ping route restricted to admin
router.get('/ping', protect, authorize('admin'), asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin ping successful',
    user: req.user,
  });
}));

module.exports = router;
