const nodemailer = require("nodemailer");

const emailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_APP_PASS,
  },
});

module.exports = emailTransporter;
