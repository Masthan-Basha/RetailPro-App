const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER || 'mock_user',
    pass: process.env.EMAIL_PASS || 'mock_pass',
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: `"RetailPro" <${process.env.EMAIL_FROM || 'no-reply@retailpro.com'}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
};

module.exports = sendEmail;
