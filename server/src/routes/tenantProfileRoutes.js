const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createOrUpdateProfile,
  getMyProfile
} = require('../controllers/tenantProfileController');

router.use(protect);
router.use(authorize('tenant'));

router.route('/')
  .post(createOrUpdateProfile)
  .put(createOrUpdateProfile);

router.route('/me')
  .get(getMyProfile);

module.exports = router;
