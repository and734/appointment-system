const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10), // Ensure port is number
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Optional: Add proxy, TLS options etc. if needed
  // tls: {
  //   rejectUnauthorized: false // only use for testing with self-signed certs
  // }
});

// Verify connection configuration (optional, run once at startup maybe)
transporter.verify(function (error, success) {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email transporter is ready to send messages.");
  }
});


// Function to send an email
const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email configuration missing in .env file. Skipping email send.");
      return null; // Or throw an error
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM, // sender address from .env
    to: to,                       // list of receivers
    subject: subject,             // Subject line
    text: text,                   // plain text body
    html: html                    // html body
  };

  try {
    console.log(`Sending email to ${to} with subject "${subject}"`);
    let info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
         console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error; // Re-throw error to be handled by caller
  }
};

module.exports = { sendEmail };
