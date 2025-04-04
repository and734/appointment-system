const { Op } = require('sequelize');
const db = require('../models'); // Access models via index
const Appointment = db.Appointment;
const User = db.User;
const { sendEmail } = require('./emailService'); // Import the email sending function
require('dotenv').config();

const sendAppointmentReminders = async () => {
    console.log(`[${new Date().toISOString()}] Running sendAppointmentReminders job...`);

    const reminderHoursBefore = parseInt(process.env.REMINDER_HOURS_BEFORE || '24', 10);
    if (isNaN(reminderHoursBefore) || reminderHoursBefore <= 0) {
        console.error("Invalid REMINDER_HOURS_BEFORE configuration in .env. Aborting reminder job.");
        return;
    }

    // Calculate the time window for reminders
    const now = new Date();
    // Reminder window START: slightly less than target hours before (e.g., 24.5 hrs)
    const reminderWindowStart = new Date(now.getTime() + (reminderHoursBefore * 60 - 15) * 60000); // e.g., 23h 45m from now
     // Reminder window END: slightly more than target hours before (e.g., 23.5 hrs)
    const reminderWindowEnd = new Date(now.getTime() + (reminderHoursBefore * 60 + 15) * 60000);   // e.g., 24h 15m from now

    console.log(`Reminder Window (UTC): ${reminderWindowStart.toISOString()} - ${reminderWindowEnd.toISOString()}`);

    try {
        // Find appointments within the window that haven't had a reminder sent
        // and are in a status that should receive a reminder
        const appointmentsToSend = await Appointment.findAll({
            where: {
                start_time: {
                    [Op.between]: [reminderWindowStart, reminderWindowEnd],
                },
                status: {
                    [Op.in]: ['scheduled', 'confirmed'], // Only remind for these statuses
                },
                reminder_sent: false, // Only send if not already sent
            },
            include: [{ // Include customer details needed for the email
                model: User,
                as: 'customer', // Make sure alias matches association
                attributes: ['email', 'name'] // Get email and name
            }]
        });

        console.log(`Found ${appointmentsToSend.length} appointments requiring reminders.`);

        if (appointmentsToSend.length === 0) {
            console.log("No reminders to send in this run.");
            return; // Nothing to do
        }

        // Iterate and send emails
        for (const appt of appointmentsToSend) {
            if (!appt.customer || !appt.customer.email) {
                 console.warn(`Skipping reminder for appointment ID ${appt.id}: Missing customer email.`);
                 continue; // Skip if customer data or email is missing
            }

            const customer = appt.customer;
            const appointmentTime = new Date(appt.start_time); // Ensure it's a Date object

            // Format date/time nicely for the email (adjust locale/options as needed)
            const formattedDate = appointmentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = appointmentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            const subject = `Appointment Reminder - ${formattedDate}`;
            const textBody = `Hi ${customer.name || 'Customer'},\n\nThis is a friendly reminder for your upcoming appointment scheduled for:\n\n${formattedDate} at ${formattedTime}\n\nLocation/Details: [Add any relevant details here, e.g., address, video link]\n\nWe look forward to seeing you!\n\nSincerely,\nYour Business Name`; // Customize Your Business Name
            const htmlBody = `
                <p>Hi ${customer.name || 'Customer'},</p>
                <p>This is a friendly reminder for your upcoming appointment scheduled for:</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formattedTime}</p>
                <p><strong>Location/Details:</strong> [Add any relevant details here, e.g., address, video link]</p>
                <p>We look forward to seeing you!</p>
                <p>Sincerely,<br/>Your Business Name</p>
            `; // Customize Your Business Name

            try {
                await sendEmail({
                    to: customer.email,
                    subject: subject,
                    text: textBody,
                    html: htmlBody,
                });

                // IMPORTANT: Update the reminder_sent flag in the database
                await appt.update({ reminder_sent: true });
                console.log(`Reminder sent successfully for appointment ID ${appt.id} to ${customer.email}`);

            } catch (emailError) {
                 // Log error but continue trying to send other reminders
                console.error(`Failed to process reminder for appointment ID ${appt.id} to ${customer.email}:`, emailError);
                // Decide if you want to retry later or mark as failed
            }
        } // End for loop

    } catch (error) {
        console.error("Error occurred during the sendAppointmentReminders job:", error);
    } finally {
        console.log(`[${new Date().toISOString()}] Finished sendAppointmentReminders job.`);
    }
};

// Export the function so it can be scheduled
module.exports = {
    sendAppointmentReminders,
};
