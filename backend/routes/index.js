const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth');
const appointmentRoutes = require('./appointments');
const adminRoutes = require('./admin'); // Import admin routes

router.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Use imported routes
router.use('/api/auth', authRoutes);
router.use('/api/appointments', appointmentRoutes);
router.use('/api/admin', adminRoutes); // Mount admin routes under /api/admin


module.exports = router;
