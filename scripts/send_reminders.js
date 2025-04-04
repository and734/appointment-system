// This script can be run by system cron or node-cron within the backend process

// If running independently, setup dotenv and Sequelize connection here
// require('dotenv').config({ path: '../backend/.env' }); // Adjust path if needed
// const { Sequelize } = require('sequelize');
// const nodemailer = require('nodemailer');
// const dbConfig = require('../backend/config/database.js')[process.env.NODE_ENV || 'development'];

// Initialize Sequelize (only if running independently)
// const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
//   host: dbConfig.host,
//   dialect: dbConfig.dialect,
//   logging: false,
// });

// Import models (adjust path based on where this script lives relative to models)
// const { Appointment, User } = require('../backend/models')(sequelize); // Pass instance if needed

async function sendReminders() {
  console.log(`[${new Date().toISOString()}] Running reminder job...`);

  try {
    // 1. Connect to DB (if running independently, otherwise reuse backend connection)
    // await sequelize.authenticate(); // Only if independent

    // 2. Query for appointments needing reminders
    const reminderWindowStart = new Date(Date.now() + 23.5 * 60 * 60 * 1000); // ~23.5 hours from now
    const reminderWindowEnd = new Date(Date.now() + 24.5 * 60 * 60 * 1000);   // ~24.5 hours from now

    /*
    const appointmentsToSend = await Appointment.findAll({
      where: {
        start_time: {
          [Sequelize.Op.between]: [reminderWindowStart, reminderWindowEnd],
        },
        status: { // Only remind for active appointments
          [Sequelize.Op.in]: ['scheduled', 'confirmed'],
        },
        reminder_sent: false,
      },
      include: [{ model: User, as: 'customer', attributes: ['email', 'name'] }] // Adjust 'as' if needed
    });
    */
    const appointmentsToSend = []; // Placeholder for query result

    console.log(`Found ${appointmentsToSend.length} appointments requiring reminders.`);

    if (appointmentsToSend.length === 0) {
      return;
    }

    // 3. Setup Nodemailer transport (reuse from backend config/service if possible)
    // const transporter = nodemailer.createTransport({ ... }); // Use config from .env

    // 4. Iterate and send emails
    for (const appt of appointmentsToSend) {
      // const customer = appt.customer;
      // const mailOptions = {
      //   from: process.env.EMAIL_FROM,
      //   to: customer.email,
      //   subject: `Appointment Reminder: ${appt.start_time.toLocaleString()}`,
      //   text: `Hi ${customer.name},\n\nThis is a reminder for your upcoming appointment on ${appt.start_time.toLocaleDateString()} at ${appt.start_time.toLocaleTimeString()}.\n\nSee you soon!`,
      //   html: `<p>Hi ${customer.name},</p><p>This is a reminder for your upcoming appointment on <strong>${appt.start_time.toLocaleDateString()}</strong> at <strong>${appt.start_time.toLocaleTimeString()}</strong>.</p><p>See you soon!</p>`,
      // };

      try {
        // let info = await transporter.sendMail(mailOptions);
        // console.log(`Reminder sent to ${customer.email} for appointment ${appt.id}: ${info.messageId}`);

        // 5. Update reminder_sent flag in DB
        // await appt.update({ reminder_sent: true });

        console.log(`Simulated sending reminder for appointment ID: ${appt.id || 'N/A (placeholder)'}`); // Placeholder log
        // Simulate update
         await new Promise(resolve => setTimeout(resolve, 50)); // Small delay


      } catch (emailError) {
        console.error(`Failed to send reminder for appointment ${appt.id} to ${appt.customer?.email}:`, emailError);
      }
    }

  } catch (error) {
    console.error("Error running reminder job:", error);
  } finally {
    // 6. Close DB connection (if running independently)
    // await sequelize.close();
    console.log(`[${new Date().toISOString()}] Reminder job finished.`);
  }
}

// If running script directly (e.g., node scripts/send_reminders.js)
if (require.main === module) {
  sendReminders();
}

module.exports = sendReminders; // Export if potentially called from backend scheduler service
