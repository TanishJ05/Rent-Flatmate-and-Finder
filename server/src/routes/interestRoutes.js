const express = require('express');
const {
  createInterest,
  getIncomingInterests,
  getSentInterests,
  acceptInterest,
  declineInterest,
  getMessages,
  markMessagesRead
} = require('../controllers/interestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes for tenants
router.route('/')
  .post(protect, authorize('tenant'), createInterest);

router.route('/sent')
  .get(protect, authorize('tenant'), getSentInterests);

// Routes for owners
router.route('/received')
  .get(protect, authorize('owner'), getIncomingInterests);

router.route('/:id/accept')
  .patch(protect, authorize('owner'), acceptInterest);

router.route('/:id/decline')
  .patch(protect, authorize('owner'), declineInterest);

// Shared route for messages within an interest (protected, role checked in controller)
router.route('/:id/messages')
  .get(protect, getMessages);

router.route('/:id/messages/read')
  .patch(protect, markMessagesRead);

module.exports = router;
