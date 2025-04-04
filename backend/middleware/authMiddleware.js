const passport = require('passport');

// Middleware to check if user is authenticated via JWT
const isAuthenticated = passport.authenticate('jwt', { session: false });

// Middleware to check if user has a specific role (e.g., 'admin')
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admin access required' });
};

module.exports = {
  isAuthenticated,
  isAdmin,
};
