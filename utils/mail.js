const nodemailer = require('nodemailer');

// Function to send email using Nodemailer
const sendEmail = async (email, subject, html) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: subject,
      html: html,
    };
  
    await transporter.sendMail(mailOptions);
  };
  module.exports = sendEmail;
  ///asdf asdf asdf