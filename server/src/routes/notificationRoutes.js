const express = require('express');
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.route('/mine')
  .get(getMyNotifications);

router.route('/:id/read')
  .patch(markAsRead);

module.exports = router;
