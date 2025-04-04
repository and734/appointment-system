require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path'); // For serving frontend build later
const cron = require('node-cron');

// Import database connection setup (Sequelize)
const db = require('./models'); // This imports models/index.js

// Import routes
const mainRoutes = require('./routes'); // Imports routes/index.js
const { sendAppointmentReminders } = require('./services/cronService'); // <-- Import the reminder function
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

// Body Parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passport Middleware Initialization
app.use(passport.initialize());
require('./config/passport')(passport); // Pass passport instance to config

// --- API Routes ---
app.use(mainRoutes); // Use the main router

// --- Error Handling Middleware (Basic Example) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    // Provide stack trace in development only
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// --- Database Connection & Server Start ---
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established.');
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

      // --- Schedule Cron Job ---
      // Schedule to run every 15 minutes (adjust timing as needed)
      // Syntax: second minute hour day-of-month month day-of-week
      // '*/15 * * * *' = every 15 minutes
      // '0 * * * *' = every hour at minute 0
      // '0 9 * * *' = every day at 9:00 AM (server time)
      const cronSchedule = '*/15 * * * *'; // Run every 15 minutes
      if (cron.validate(cronSchedule)) {
          console.log(`Scheduling reminder job with schedule: ${cronSchedule}`);
          cron.schedule(cronSchedule, () => {
              console.log('Cron job triggered: Running sendAppointmentReminders...');
              sendAppointmentReminders(); // Call the function
          }, {
              // Optional: Set timezone if needed, otherwise uses server timezone
              // timezone: "America/New_York"
          });
      } else {
          console.error("Invalid cron schedule pattern defined:", cronSchedule);
      }

    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

