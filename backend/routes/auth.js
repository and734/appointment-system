const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// No need to import isAuthenticated here, it's applied in the controller for /me

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me - Get current logged-in user details (Protected)
router.get('/me', authController.getCurrentUser); // Middleware is applied inside the controller function array

// POST /api/auth/logout (Optional - demonstrates endpoint exists)
router.post('/logout', authController.logout);

// --- TODO: Add Social Login Routes ---
// GET /api/auth/google
// GET /api/auth/google/callback
// GET /api/auth/facebook
// GET /api/auth/facebook/callback

module.exports = router;
