const nodemailer = require('nodemailer');

const transporterFromEnv = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

const smtpConfigured = () =>
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_USER !== 'no-reply@qumail.com';

const sendEmail = async (options) => {
  if (!smtpConfigured()) {
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

  const transporter = transporterFromEnv();

  const mailOptions = {
    from: `${process.env.APP_NAME || 'QuMail'} <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
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

/**
 * Relay mail to external MTAs (Gmail, etc.). Set OUTBOUND_SMTP_* or reuse SMTP_* from .env.
 * envelope.to must list only external addresses. Header To/Cc/Bcc can include QuMail addresses for display.
 */
const sendRelayMail = async ({
  envelopeFrom,
  headerFrom,
  replyTo,
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments = [],
  envelopeTo = []
}) => {
  const host = process.env.OUTBOUND_SMTP_HOST || process.env.SMTP_HOST;
  const port = process.env.OUTBOUND_SMTP_PORT || process.env.SMTP_PORT;
  const user = process.env.OUTBOUND_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.OUTBOUND_SMTP_PASS || process.env.SMTP_PASS;
  const secure = (process.env.OUTBOUND_SMTP_SECURE || process.env.SMTP_SECURE) === 'true';

  if (!host || !user || user === 'no-reply@qumail.com') {
    console.log('--- MOCK RELAY (configure SMTP / OUTBOUND_SMTP_* for real delivery) ---');
    console.log('Envelope to:', envelopeTo.join(', '));
    console.log('Subject:', subject);
    console.log('Text:', text?.slice?.(0, 200));
    return { success: true, mock: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const fromHeader = headerFrom || envelopeFrom;
  const nodemailerAttachments = (attachments || [])
    .filter((a) => a && a.data)
    .map((a) => ({
      filename: a.filename || 'attachment',
      content: Buffer.from(a.data, 'base64'),
      contentType: a.contentType || undefined
    }));

  const mailOptions = {
    envelope: {
      from: envelopeFrom,
      to: [...new Set(envelopeTo)]
    },
    from: fromHeader,
    replyTo: replyTo || undefined,
    to,
    cc: cc && cc.length ? cc : undefined,
    bcc: bcc && bcc.length ? bcc : undefined,
    subject,
    text,
    html: html || undefined,
    attachments: nodemailerAttachments.length ? nodemailerAttachments : undefined
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Relay mail sent: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error('Relay send error:', error);
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
  sendPasswordResetEmail,
  sendRelayMail
};
