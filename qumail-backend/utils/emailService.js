const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'no-reply@qumail.com') {
    console.log('--- MOCK EMAIL SENT ---');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text || 'SEE HTML VERSION'}`);
    if (options.html) {
      console.log(`HTML: ${options.html}`);
    }
    console.log('-----------------------');
    return { success: true, mock: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.APP_NAME || 'QuMail'} <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please click on the link below to reset your password. This link is valid for 1 hour.</p>
    <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
    <p>If you did not request this, please ignore this email.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'QuMail - Password Reset Request',
    text: `You requested a password reset. Please use the following link: ${resetUrl}`,
    html: message
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
};
