const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to req, excluding password
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      // Need to use next(error) instead of throwing here since it's not wrapped in asyncHandler by default when called inside another route handler's chain, but actually since we pass it to express it should be fine to throw or next(). Using next() is safer for sync middleware without asyncHandler.
      return next(new Error(`User role ${req.user ? req.user.role : 'undefined'} is not authorized to access this route`));
    }
    next();
  };
};

module.exports = { protect, authorize };
