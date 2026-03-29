const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Mail = require('../models/Mail');
const Notification = require('../models/Notification');
const { isQumailAddress, QUMAIL_DOMAIN } = require('../config/mailDomain');
const { isPotentialSpam } = require('./spamDetection');

const calculateMailSize = (mail) => {
  let size = 0;
  if (mail.body) size += Buffer.from(mail.body, 'utf8').length;
  if (mail.subject) size += Buffer.from(mail.subject, 'utf8').length;
  if (mail.attachments && Array.isArray(mail.attachments)) {
    mail.attachments.forEach((att) => {
      if (att.size) size += att.size;
      else if (att.data) size += Buffer.from(att.data, 'utf8').length;
    });
  }
  return size;
};

const addressesFromParsed = (field) => {
  if (!field || !field.value) return [];
  return field.value.map((v) => (v.address || '').toLowerCase()).filter(Boolean);
};

/**
 * Inbound SMTP for @QUMAIL_DOMAIN. Enable with INBOUND_SMTP_ENABLED=true.
 * Production: point MX to this host; bind port 25 (set INBOUND_SMTP_PORT).
 */
function startInboundSmtp() {
  if (process.env.INBOUND_SMTP_ENABLED !== 'true') {
    console.log('[inbound-smtp] Disabled (INBOUND_SMTP_ENABLED=true to accept mail from Gmail etc.)');
    return null;
  }

  const port = parseInt(process.env.INBOUND_SMTP_PORT || '2525', 10);
  const host = process.env.INBOUND_SMTP_HOST || '0.0.0.0';
  const maxSize = parseInt(process.env.INBOUND_SMTP_MAX_MB || '25', 10) * 1024 * 1024;

  const server = new SMTPServer({
    logger: process.env.INBOUND_SMTP_DEBUG === 'true',
    size: maxSize,
    disabledCommands: process.env.INBOUND_SMTP_REQUIRE_AUTH === 'true' ? [] : ['AUTH'],
    hidePIPELINING: true,
    onMailFrom(address, session, callback) {
      callback();
    },
    onRcptTo(address, session, callback) {
      const addr = (address.address || '').toLowerCase();
      if (!isQumailAddress(addr)) {
        return callback(new Error(`550 not accepting mail for non-${QUMAIL_DOMAIN} recipients`));
      }
      User.exists({ email: addr })
        .then((ok) => {
          if (!ok) return callback(new Error('550 mailbox unavailable'));
          callback();
        })
        .catch((err) => callback(err));
    },
    onData(stream, session, callback) {
      simpleParser(stream)
        .then(async (parsed) => {
          const rcptList = [...new Set((session.envelope.rcptTo || []).map((r) => r.address.toLowerCase()))]
            .filter(isQumailAddress);

          const fromAddr = (parsed.from?.value?.[0]?.address || session.envelope.mailFrom?.address || 'unknown@invalid')
            .toLowerCase();

          let textBody = parsed.text || '';
          const htmlBody = parsed.html || '';
          if (!textBody && htmlBody) {
            textBody = htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          }
          if (!textBody) textBody = '(No body)';

          const subject = (parsed.subject || '(No Subject)').trim() || '(No Subject)';
          const toHeader = addressesFromParsed(parsed.to);
          const primaryTo = (toHeader[0] || rcptList[0] || '').toLowerCase();

          const ccList = addressesFromParsed(parsed.cc);
          const bccList = addressesFromParsed(parsed.bcc);

          const attachments = (parsed.attachments || []).map((att) => ({
            filename: att.filename || 'attachment',
            contentType: att.contentType || 'application/octet-stream',
            size: att.size || (att.content ? att.content.length : 0),
            data: att.content ? att.content.toString('base64') : ''
          }));

          const mailId = uuidv4();
          const timestamp = new Date();
          const draftMail = {
            body: textBody,
            subject,
            attachments
          };
          const perUserSize = calculateMailSize(draftMail);

          const recipientUsers = await User.find({ email: { $in: rcptList } });
          for (const u of recipientUsers) {
            if (u.storageUsed + perUserSize > u.storageLimit) {
              console.warn(`[inbound-smtp] Storage full for ${u.email}, rejecting delivery`);
              throw new Error('452 storage quota exceeded for recipient');
            }
          }

          for (const ownerEmail of rcptList) {
            const recipientUser = recipientUsers.find((u) => u.email === ownerEmail);
            if (!recipientUser) continue;

            const isSpam = isPotentialSpam(subject, textBody, fromAddr, recipientUser.spamList || []);

            const inboxMail = new Mail({
              mailId,
              from: fromAddr,
              to: primaryTo || ownerEmail,
              cc: ccList,
              bcc: bccList.filter((e) => e === ownerEmail),
              subject,
              body: textBody,
              encryption: 'NONE',
              encryptionLevel: 'none',
              folder: isSpam ? 'SPAM' : 'INBOX',
              owner: ownerEmail,
              read: false,
              attachments,
              createdAt: timestamp,
              updatedAt: timestamp
            });

            const incSize = calculateMailSize(inboxMail);

            await inboxMail.save();

            if (!isSpam) {
              await Notification.create({
                userId: recipientUser._id,
                title: 'New Message Received',
                message: `From: ${fromAddr}`,
                type: 'info',
                icon: 'Mail'
              });
            }

            await User.updateOne({ _id: recipientUser._id }, { $inc: { storageUsed: incSize } });
          }

          callback();
        })
        .catch((err) => {
          console.error('[inbound-smtp] onData error:', err.message);
          callback(err);
        });
    }
  });

  server.on('error', (err) => console.error('[inbound-smtp] server error:', err.message));

  server.listen(port, host, () => {
    console.log(`[inbound-smtp] Listening on ${host}:${port} for *@${QUMAIL_DOMAIN}`);
  });

  return server;
}

module.exports = { startInboundSmtp };
