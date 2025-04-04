const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware'); // Import middleware

// Apply authentication and admin checks to all routes in this file
router.use(isAuthenticated, isAdmin);

// --- Appointment Routes ---
// GET /api/admin/appointments
router.get('/appointments', adminController.getAllAppointments);
// PUT /api/admin/appointments/:id/status
router.put('/appointments/:id/status', adminController.updateAppointmentStatus);

// --- Availability Rule Routes ---
// GET /api/admin/availability-rules
router.get('/availability-rules', adminController.getAvailabilityRules);
// POST /api/admin/availability-rules
router.post('/availability-rules', adminController.createAvailabilityRule);
// PUT /api/admin/availability-rules/:id
router.put('/availability-rules/:id', adminController.updateAvailabilityRule);
// DELETE /api/admin/availability-rules/:id
router.delete('/availability-rules/:id', adminController.deleteAvailabilityRule);

// --- Block Out Time Routes (Optional) ---
router.get('/block-out-times', adminController.getBlockOutTimes);
router.post('/block-out-times', adminController.createBlockOutTime);
router.put('/block-out-times/:id', adminController.updateBlockOutTime); // Optional update endpoint
router.delete('/block-out-times/:id', adminController.deleteBlockOutTime);

module.exports = router;
