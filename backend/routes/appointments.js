const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Import auth middleware

// All appointment routes require authentication
router.use(isAuthenticated);

// GET /api/appointments/available?startDate=...&endDate=... - Get available slots
router.get('/available', appointmentController.getAvailableSlots);

// POST /api/appointments/book - Book a new appointment
router.post('/book', appointmentController.bookAppointment);

// GET /api/appointments/my - Get appointments for the logged-in user
router.get('/my', appointmentController.getMyAppointments);

// PUT /api/appointments/:id/cancel - Cancel an appointment (by customer)
router.put('/:id/cancel', appointmentController.cancelAppointment);


module.exports = router;
