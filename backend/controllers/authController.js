const db = require('../models');
const User = db.User;
const authService = require('../services/authService');
const passport = require('passport');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }
   if (password.length < 6) { // Example: Basic password length check
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
   }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Create new user (password will be hashed by the model hook)
    const newUser = await User.create({
      name,
      email,
      // Pass the plain password, the hook will hash it before saving
      // IMPORTANT: Ensure the hook uses 'password_hash' as the field name if you pass it here
      // OR adjust the hook to work if you pass a 'password' field instead.
      // Let's adjust the call to match the field name used in the hook:
      password_hash: password,
      role: 'customer' // Default role
    });

    // Generate JWT for the new user
    const token = authService.generateToken(newUser);

    // Respond with token and user info (excluding password)
    res.status(201).json({
        message: 'User registered successfully!',
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    });

  } catch (error) {
     console.error("Registration error:", error);
     // Handle potential validation errors from Sequelize model
     if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Validation Error', errors: messages });
     }
    next(error); // Pass other errors to the global error handler
  }
};

// POST /api/auth/login
exports.login = (req, res, next) => {
  // Use Passport's local strategy for authentication
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error("Login authentication error:", err);
      return next(err); // Pass internal errors to error handler
    }
    if (!user) {
      // Authentication failed (user not found or password mismatch)
      // 'info' might contain message from LocalStrategy like 'Incorrect email.' or 'Incorrect password.'
      return res.status(401).json({ message: info?.message || 'Login failed. Check email and password.' });
    }

    // Authentication successful, user object is available
    // Generate JWT for the authenticated user
    const token = authService.generateToken(user);

    // Respond with token and user info
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  })(req, res, next); // Don't forget to invoke the middleware function returned by passport.authenticate
};


// GET /api/auth/me (Protected Route Example)
// We need the isAuthenticated middleware here
const { isAuthenticated } = require('../middleware/authMiddleware');

exports.getCurrentUser = [ // Use array to apply middleware
    isAuthenticated, // Apply JWT authentication middleware first
    (req, res) => {
        // If isAuthenticated passes, req.user contains the authenticated user object from JWT strategy
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' }); // Should technically be caught by isAuthenticated
        }
        // Return user information (excluding sensitive data)
        res.status(200).json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        });
    }
];

// POST /api/auth/logout (Stateless - Client just deletes token)
// No explicit backend action needed for stateless JWT logout,
// but you might implement token blacklisting for enhanced security if needed.
exports.logout = (req, res) => {
    // In a stateless JWT setup, logout is handled client-side by discarding the token.
    // Optionally, you could implement a server-side token blacklist here if desired.
    res.status(200).json({ message: 'Logged out successfully (client should clear token).' });
};
