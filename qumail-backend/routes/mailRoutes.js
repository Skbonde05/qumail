const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Mail = require('../models/Mail');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/authMiddleware');
const { isValidEmailAddress, isQumailAddress, QUMAIL_DOMAIN } = require('../config/mailDomain');
const { isPotentialSpam } = require('../utils/spamDetection');
const { sendRelayMail } = require('../utils/emailService');
const {
  generateOTPKey, otpEncrypt, otpDecrypt,
  generateAESKey, generateAESIV, aesEncrypt, aesDecrypt,
  isValidHexKey
} = require('../utils/encryption');
const { cacheMiddleware, clearUserCache } = require('../middleware/cache');
const { mailLimiter, decryptionLimiter } = require('../middleware/rateLimit');

const ccBccEmailsValid = (arr) =>
  !arr || (Array.isArray(arr) && arr.every((e) => typeof e === 'string' && isValidEmailAddress(e)));

// ------------------ HELPERS ------------------
const calculateMailSize = (mail) => {
  let size = 0;
  if (mail.body) size += Buffer.from(mail.body, 'utf8').length;
  if (mail.subject) size += Buffer.from(mail.subject, 'utf8').length;
  if (mail.attachments && Array.isArray(mail.attachments)) {
    mail.attachments.forEach(att => {
      if (att.size) size += att.size;
      else if (att.data) size += Buffer.from(att.data, 'utf8').length;
    });
  }
  return size;
};

// ------------------ SEND EMAIL ------------------
router.post('/send',
  [
    verifyToken,
    body('to').trim().notEmpty().custom(isValidEmailAddress).withMessage('Valid recipient email required'),
    body('subject').optional().trim().isLength({ max: 200 }),
    body('body').trim().notEmpty().withMessage('Message body is required'),
    body('encryptionLevel').optional().isIn(['none', 'otp', 'aes256', 'aes']),
    body('cc').optional().isArray().custom(ccBccEmailsValid).withMessage('Invalid cc address'),
    body('bcc').optional().isArray().custom(ccBccEmailsValid).withMessage('Invalid bcc address'),
    body('attachments').optional().isArray()
  ],
  mailLimiter,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { to, subject, body, encryptionLevel = 'none', cc = [], bcc = [], attachments = [] } = req.body;
      const from = req.user.email;
      const normalizedEncryptionLevel = encryptionLevel === 'aes' ? 'aes256' : encryptionLevel;

      const lowerTo = to.toLowerCase().trim();
      const lowerCc = Array.isArray(cc) ? cc.map((c) => c.toLowerCase().trim()) : [];
      const lowerBcc = Array.isArray(bcc) ? bcc.map((b) => b.toLowerCase().trim()) : [];

      const allRecipientEmails = [...new Set([lowerTo, ...lowerCc, ...lowerBcc])];
      const internalRecipients = allRecipientEmails.filter(isQumailAddress);
      const externalRecipients = allRecipientEmails.filter((e) => !isQumailAddress(e));

      if (normalizedEncryptionLevel !== 'none' && externalRecipients.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message:
            'Encryption only applies to messages sent entirely to your QuMail domain. Remove external addresses or turn encryption off.'
        });
      }

      let recipients = [];
      if (internalRecipients.length > 0) {
        recipients = await User.find({ email: { $in: internalRecipients } }).session(session);
        if (recipients.length < internalRecipients.length) {
          const foundEmails = recipients.map((r) => r.email);
          const missingEmails = internalRecipients.filter((e) => !foundEmails.includes(e));
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            success: false,
            message: `Some @${QUMAIL_DOMAIN} recipients not found: ${missingEmails.join(', ')}`
          });
        }
      }

      // Check Storage Limit for Sender
      const sender = await User.findOne({ email: from }).session(session);
      const estimatedSize = calculateMailSize({ body, subject, attachments });
      if (sender.storageUsed + estimatedSize > sender.storageLimit) {
        await session.abortTransaction();
        session.endSession();
        return res.status(413).json({ success: false, message: 'Storage limit exceeded. Please free up some space.' });
      }
      
      let encryptedBody = body;
      let encryptionType = 'NONE';
      let aesKey = null;
      let aesIV = null;
      let otpKey = null;
      let encryptedAttachments = [];

      if (normalizedEncryptionLevel !== 'none') {
        if (normalizedEncryptionLevel === 'otp') {
          encryptionType = 'OTP';
          
          // Encrypt Body with OTP
          if (!body.startsWith('[otp|') || !body.includes(']:')) {
            const textLength = Buffer.from(body, 'utf8').length;
            const newOtpKey = generateOTPKey(textLength);
            otpKey = newOtpKey;
            encryptedBody = otpEncrypt(body, newOtpKey);
            encryptedBody = `[otp|${newOtpKey}]:${encryptedBody}`;
          } else {
            const match = body.match(/^\[otp\|([^\]]+)\]:([\s\S]*)$/);
            if (match) otpKey = match[1];
            encryptedBody = body;
          }

          // Encrypt Attachments with OTP
          encryptedAttachments = attachments.map(att => {
            const attKey = generateOTPKey(Buffer.from(att.data, 'utf8').length);
            const encData = otpEncrypt(att.data, attKey);
            return {
              ...att,
              data: `[otp|${attKey}]:${encData}`,
              isEncrypted: true
            };
          });
        } else if (normalizedEncryptionLevel === 'aes256') {
          encryptionType = 'AES';
          const sender = await User.findOne({ email: from }).session(session);
          aesKey = sender.encryptionKeys?.aes256 || generateAESKey();
          aesIV = generateAESIV();
          
          // Encrypt Body
          const encryptedData = aesEncrypt(body, aesKey, aesIV);
          encryptedBody = JSON.stringify(encryptedData);

          // Encrypt Attachments
          encryptedAttachments = attachments.map(att => {
            const attIV = generateAESIV();
            const encData = aesEncrypt(att.data, aesKey, attIV);
            return {
              ...att,
              data: JSON.stringify(encData),
              isEncrypted: true
            };
          });
        }
      } else {
        encryptedAttachments = attachments;
      }
      
      const mailId = uuidv4();
      const timestamp = new Date();
      
      // Sent mail for sender (NOT encrypted for sender's view)
      const sentMail = new Mail({
        mailId, from, to: lowerTo, cc: lowerCc, bcc: lowerBcc,
        subject: subject || '(No Subject)',
        body: body, encryption: 'NONE',
        encryptionLevel: normalizedEncryptionLevel || 'none',
        aesKey, aesIV, otpKey,
        folder: 'SENT', owner: from, read: true,
        attachments: attachments, // Plain for sender
        createdAt: timestamp, updatedAt: timestamp
      });
      await sentMail.save({ session });
      
      // Inbox mail for all recipients (ENCRYPTED)
      for (const recipientUser of recipients) {
        const isSpam = isPotentialSpam(subject, body, from, recipientUser.spamList || []);
        
        // If sender is also a recipient, we MUST use a different mailId for the INBOX copy
        // to avoid duplicate key error on { mailId, owner }
        const recipientMailId = (recipientUser.email === from) ? uuidv4() : mailId;
        
        const inboxMail = new Mail({
          mailId: recipientMailId, from, to: lowerTo, 
          cc: lowerCc, 
          bcc: lowerBcc.includes(recipientUser.email) ? [recipientUser.email] : [],
          subject: encryptionType !== 'NONE' ? ` ${subject || 'Encrypted Message'}` : (subject || '(No Subject)'),
          body: encryptedBody, 
          encryption: encryptionType,
          encryptionLevel: normalizedEncryptionLevel || 'none',
          aesKey, aesIV, otpKey,
          folder: isSpam ? 'SPAM' : 'INBOX', owner: recipientUser.email, read: false,
          attachments: encryptedAttachments, // Encrypted for recipient
          createdAt: timestamp, updatedAt: timestamp
        });
        await inboxMail.save({ session });
        
        // Notify recipient (only if not spam)
        if (!isSpam) {
          await Notification.create([{
            userId: recipientUser._id,
            title: 'New Message Received',
            message: `From: ${from}`,
            type: 'info',
            icon: 'Mail'
          }], { session });
        }

        // Update recipient storage usage
        const incSize = calculateMailSize(inboxMail);
        await User.updateOne(
          { _id: recipientUser._id },
          { $inc: { storageUsed: incSize } }
        ).session(session);
      }
      
      // Update sender storage usage (Sent copy)
      const sentSize = calculateMailSize(sentMail);
      await User.updateOne(
        { _id: sender._id },
        { $inc: { storageUsed: sentSize } }
      ).session(session);
      
      await session.commitTransaction();
      session.endSession();

      // Clear cache for sender and all recipients
      clearUserCache(req.user.id);

      let relayResult = null;
      if (externalRecipients.length > 0) {
        const envelopeFrom =
          process.env.OUTBOUND_ENVELOPE_FROM || process.env.SMTP_USER || from;
        const forceFrom = process.env.OUTBOUND_FORCE_FROM;
        const headerFrom = forceFrom
          ? `${from.split('@')[0]} <${forceFrom}>`
          : `"${from.split('@')[0]}" <${from}>`;
        const replyTo = forceFrom ? from : undefined;
        const envelopeTo = [...new Set(externalRecipients)];

        try {
          relayResult = await sendRelayMail({
            envelopeFrom,
            headerFrom,
            replyTo,
            to: lowerTo,
            cc: lowerCc,
            bcc: lowerBcc,
            subject: subject || '(No Subject)',
            text: body,
            html: undefined,
            attachments,
            envelopeTo
          });
        } catch (relayErr) {
          console.error('External relay failed:', relayErr);
          return res.status(502).json({
            success: false,
            message:
              'Saved in QuMail, but delivery to external addresses failed. Check SMTP / OUTBOUND_SMTP_* in .env. ' +
              relayErr.message,
            messageId: mailId,
            internalDelivered: internalRecipients.length > 0
          });
        }
      }

      res.json({
        success: true,
        message: `Email sent successfully via QuMail (${normalizedEncryptionLevel})`,
        messageId: mailId,
        sentAt: timestamp,
        encryption: {
          level: normalizedEncryptionLevel,
          encrypted: normalizedEncryptionLevel !== 'none',
          type: encryptionType
        },
        externalRelay:
          externalRecipients.length > 0 ? (relayResult && relayResult.mock ? 'mock' : 'sent') : null
      });
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      console.error('Send email error:', error);
      res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
    }
  }
);

// Helper for formatting emails
const formatEmail = (mail) => ({
  id: mail.mailId,
  uid: mail.mailId,
  _id: mail._id,
  from: mail.from,
  to: mail.to,
  subject: mail.subject,
  body: mail.body,
  preview: mail.subject || 'No subject',
  date: mail.createdAt,
  originalDate: mail.createdAt,
  read: mail.read,
  starred: mail.starred,
  important: mail.important,
  draft: mail.folder === 'DRAFTS',
  sent: mail.folder === 'SENT',
  trash: mail.trash,
  spam: mail.folder === 'SPAM',
  archived: mail.folder === 'ARCHIVE',
  folder: mail.folder.toLowerCase(),
  encrypted: mail.encryption !== 'NONE' || (mail.encryptionLevel && mail.encryptionLevel !== 'none'),
  encryptionLevel: mail.encryptionLevel || (mail.encryption === 'AES' ? 'aes256' : mail.encryption === 'OTP' ? 'otp' : 'none'),
  requiresDecryption: mail.encryption !== 'NONE',
  cc: mail.cc || [],
  bcc: mail.bcc || [],
  attachments: mail.attachments || [],
  size: (mail.body ? mail.body.length : 0) + (mail.attachments ? mail.attachments.reduce((sum, a) => sum + (a.size || 0), 0) : 0)
});

// ------------------ HELPERS ------------------
const checkSnoozed = async (userEmail) => {
  try {
    const now = new Date();
    // Find snoozed mails where time has passed
    const expiredSnoozed = await Mail.find({
      owner: userEmail,
      folder: 'SNOOZED',
      snoozed: { $lte: now, $ne: null }
    });

    if (expiredSnoozed.length > 0) {
      console.log(`[SNOOZE] Returning ${expiredSnoozed.length} emails to INBOX for ${userEmail}`);
      for (const mail of expiredSnoozed) {
        mail.folder = 'INBOX';
        mail.snoozed = null;
        await mail.save();
      }
    }
  } catch (error) {
    console.error('Check snoozed error:', error);
  }
};

// ------------------ GET FOLDERS ------------------
const getFolderRoute = (folderName) => async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.body;
    const email = req.user.email;
    const skip = (page - 1) * limit;
    
    const query = { owner: email, trash: folderName === 'TRASH' };
    if (folderName !== 'TRASH') {
      query.folder = folderName;
      query.trash = false;
    }

    const [mails, total] = await Promise.all([
      Mail.find(query).select('-aesKey -aesIV').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Mail.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      emails: mails.map(formatEmail),
      count: mails.length,
      total, page, totalPages: Math.ceil(total / limit),
      folder: folderName.toLowerCase()
    });
  } catch (error) {
    console.error(`Fetch ${folderName} error:`, error);
    res.status(500).json({ success: false, message: `Failed to fetch ${folderName.toLowerCase()} emails` });
  }
};

router.post('/inbox', verifyToken, cacheMiddleware(60), async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { page = 1, limit = 50, filter = 'all' } = req.body;
    
    await checkSnoozed(userEmail);
    
    const query = { owner: userEmail, folder: 'INBOX', trash: false };
    const skip = (page - 1) * limit;

    const [mails, total] = await Promise.all([
      Mail.find(query).select('-aesKey -aesIV').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Mail.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      emails: mails.map(formatEmail),
      count: mails.length,
      total, page, totalPages: Math.ceil(total / limit),
      folder: 'inbox'
    });
  } catch (error) {
    console.error('Fetch inbox error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inbox emails' });
  }
});
router.post('/sent', verifyToken, cacheMiddleware(60), getFolderRoute('SENT'));
router.post('/archive', verifyToken, cacheMiddleware(60), getFolderRoute('ARCHIVE'));
router.post('/trash', verifyToken, cacheMiddleware(60), getFolderRoute('TRASH'));

// ------------------ SPECIAL FOLDERS ------------------
const getSpecialFolderRoute = (queryField) => async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.body;
    const email = req.user.email;
    const skip = (page - 1) * limit;
    
    const query = { owner: email, [queryField]: true, trash: false };

    const [mails, total] = await Promise.all([
      Mail.find(query).select('-aesKey -aesIV').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Mail.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      emails: mails.map(formatEmail),
      count: mails.length,
      total, page, totalPages: Math.ceil(total / limit),
      folder: queryField
    });
  } catch (error) {
    console.error(`Fetch ${queryField} error:`, error);
    res.status(500).json({ success: false, message: `Failed to fetch ${queryField} emails` });
  }
};

router.post('/starred', verifyToken, cacheMiddleware(60), getSpecialFolderRoute('starred'));
router.post('/important', verifyToken, cacheMiddleware(60), getSpecialFolderRoute('important'));

// ------------------ LABELS (CUSTOM FOLDERS) ------------------
router.get('/labels', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, labels: user.customLabels || [] });
  } catch (error) {
    console.error('Fetch labels error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labels' });
  }
});

router.post('/labels', verifyToken, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Label name is required' });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newLabel = {
      id: name.toUpperCase().replace(/\s/g, '_'), // Generate a simple ID from name
      name,
      color: color || '#607d8b' // Default color
    };

    if (user.customLabels.some(label => label.id === newLabel.id)) {
      return res.status(409).json({ success: false, message: 'Label with this name already exists' });
    }

    user.customLabels.push(newLabel);
    await user.save();
    res.status(201).json({ success: true, label: newLabel });
  } catch (error) {
    console.error('Create label error:', error);
    res.status(500).json({ success: false, message: 'Failed to create label' });
  }
});

router.put('/labels/:id', verifyToken, async (req, res) => {
  try {
    const paramId = req.params.id.toUpperCase();
    const { name, color } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const idx = user.customLabels.findIndex((l) => l.id === paramId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Label not found' });

    const current = user.customLabels[idx];
    const newName = name !== undefined ? String(name).trim() : current.name;
    if (!newName) return res.status(400).json({ success: false, message: 'Label name is required' });

    const newId = newName.toUpperCase().replace(/\s/g, '_');
    const newColor = color !== undefined ? color : current.color;
    const oldId = current.id;

    if (newId !== oldId) {
      if (user.customLabels.some((l, i) => i !== idx && l.id === newId)) {
        return res.status(409).json({ success: false, message: 'A label with this name already exists' });
      }
      await Mail.updateMany(
        { owner: req.user.email, folder: oldId },
        { $set: { folder: newId } }
      );
      const mailsWithLabel = await Mail.find({ owner: req.user.email, labels: oldId });
      for (const m of mailsWithLabel) {
        m.labels = (m.labels || []).map((lb) => (lb === oldId ? newId : lb));
        await m.save();
      }
    }

    user.customLabels[idx] = { id: newId, name: newName, color: newColor || '#607d8b' };
    await user.save();

    res.json({ success: true, label: user.customLabels[idx] });
  } catch (error) {
    console.error('Update label error:', error);
    res.status(500).json({ success: false, message: 'Failed to update label' });
  }
});

router.delete('/labels/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const initialLength = user.customLabels.length;
    user.customLabels = user.customLabels.filter(label => label.id !== id.toUpperCase());

    if (user.customLabels.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    await user.save();
    // Optionally, move all mails from this deleted custom folder to INBOX or ARCHIVE
    await Mail.updateMany(
      { owner: req.user.email, folder: id.toUpperCase() },
      { $set: { folder: 'INBOX' } }
    );

    res.json({ success: true, message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Delete label error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete label' });
  }
});

// Generic Folder Listing for Custom Folders
router.post('/folder/:folderId', verifyToken, cacheMiddleware(60), async (req, res) => {
  try {
    const { folderId } = req.params;
    const { page = 1, limit = 50 } = req.body;
    const userEmail = req.user.email;
    
    // Check if it's a valid custom folder for this user
    const user = await User.findOne({ email: userEmail });
    const isValid = user.customLabels?.some(l => l.id === folderId.toUpperCase());
    
    if (!isValid) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    const query = { 
      owner: userEmail, 
      trash: false,
      $or: [
        { folder: folderId.toUpperCase() },
        { labels: folderId.toUpperCase() }
      ]
    };
    const skip = (page - 1) * limit;

    const [mails, total] = await Promise.all([
      Mail.find(query).select('-aesKey -aesIV').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Mail.countDocuments(query)
    ]);
    
    res.json({ 
      success: true, 
      emails: mails.map(formatEmail), 
      total, page, 
      totalPages: Math.ceil(total / limit),
      folder: folderId.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ COUNTS ------------------
router.get('/folder-counts', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    // Standard folders
    const [inbox, sent, archive, trash, starred, important, drafts, unread, snoozed, spam] = await Promise.all([
      Mail.countDocuments({ owner: userEmail, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'SENT', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'ARCHIVE', trash: false }),
      Mail.countDocuments({ owner: userEmail, trash: true }),
      Mail.countDocuments({ owner: userEmail, starred: true, trash: false }),
      Mail.countDocuments({ owner: userEmail, important: true, trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'DRAFTS', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'INBOX', read: false, trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'SNOOZED', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'SPAM', trash: false })
    ]);

    // Fetch custom folder counts
    const user = await User.findOne({ email: userEmail }).lean();
    const customLabels = user?.customLabels || [];
    const custom = {};
    
    // Efficiently count all custom labels in parallel
    const labelCounts = await Promise.all(customLabels.map(label => 
      Mail.countDocuments({ 
        owner: userEmail, 
        trash: false,
        $or: [
          { folder: label.id.toUpperCase() },
          { labels: label.id.toUpperCase() }
        ]
      })
    ));

    customLabels.forEach((label, index) => {
      custom[label.id] = labelCounts[index];
    });

    res.json({ success: true, counts: { 
      inbox, sent, archive, trash, starred, important, unread, drafts, snoozed, spam, custom 
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ DRAFTS (before /:mailId so "drafts" is not captured as mailId) ------------------
router.all('/drafts', verifyToken, async (req, res) => {
  const isListing =
    req.method === 'GET' ||
    (req.method === 'POST' &&
      (req.body?.limit || req.body?.page || Object.keys(req.body || {}).length === 0));

  if (isListing) {
    try {
      const limit = parseInt(req.query?.limit ?? req.body?.limit ?? 50, 10);
      const page = parseInt(req.query?.page ?? req.body?.page ?? 1, 10);
      const userEmail = req.user.email;

      const query = { owner: userEmail, folder: 'DRAFTS', trash: false };
      const [emails, total] = await Promise.all([
        Mail.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
        Mail.countDocuments(query)
      ]);

      return res.json({
        success: true,
        emails: emails.map(formatEmail),
        total
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { to, subject, body, cc = [], bcc = [], encryptionLevel = 'none', attachments = [] } = req.body;
      const draft = new Mail({
        mailId: uuidv4(),
        from: req.user.email,
        to: to || '',
        cc,
        bcc,
        subject: subject || '',
        body: body || '',
        encryptionLevel,
        attachments,
        folder: 'DRAFTS',
        owner: req.user.email,
        read: true
      });

      const draftSize = calculateMailSize(draft);

      const user = await User.findOne({ email: req.user.email });
      if (user.storageUsed + draftSize > user.storageLimit) {
        return res.status(413).json({ success: false, message: 'Storage limit exceeded' });
      }

      await draft.save();
      await User.updateOne({ email: req.user.email }, { $inc: { storageUsed: draftSize } });

      return res.json({ success: true, email: formatEmail(draft), draftId: draft._id });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  res.status(405).json({ message: 'Method not allowed' });
});

router.put('/drafts/:id', verifyToken, async (req, res) => {
  try {
    const { to, subject, body, cc, bcc, encryptionLevel, attachments } = req.body;

    const oldDraft = await Mail.findOne({ _id: req.params.id, owner: req.user.email, folder: 'DRAFTS' });
    if (!oldDraft) return res.status(404).json({ success: false, message: 'Draft not found' });

    const oldSize = calculateMailSize(oldDraft);

    const update = {};
    if (to !== undefined) update.to = to;
    if (subject !== undefined) update.subject = subject;
    if (body !== undefined) update.body = body;
    if (cc !== undefined) update.cc = cc;
    if (bcc !== undefined) update.bcc = bcc;
    if (encryptionLevel !== undefined) update.encryptionLevel = encryptionLevel;
    if (attachments !== undefined) update.attachments = attachments;

    update.updatedAt = new Date();

    const draft = await Mail.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.email, folder: 'DRAFTS' },
      { $set: update },
      { new: true }
    );

    const newSize = calculateMailSize(draft);
    const sizeDiff = newSize - oldSize;

    if (sizeDiff !== 0) {
      await User.updateOne({ email: req.user.email }, { $inc: { storageUsed: sizeDiff } });
    }

    res.json({ success: true, draft: formatEmail(draft), draftId: draft._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/drafts/:id', verifyToken, async (req, res) => {
  try {
    const draft = await Mail.findOne({ _id: req.params.id, owner: req.user.email });
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });

    const draftSize = calculateMailSize(draft);
    await Mail.deleteOne({ _id: req.params.id, owner: req.user.email });
    await User.updateOne({ email: req.user.email }, { $inc: { storageUsed: -draftSize } });

    res.json({ success: true, message: 'Draft deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ GET SINGLE EMAIL ------------------
router.get('/:mailId', verifyToken, async (req, res) => {
  try {
    const mailId = req.params.mailId;
    const userEmail = req.user.email;
    
    const mail = await Mail.findOne({ mailId, owner: userEmail }).select('+aesKey +aesIV +otpKey');
    if (!mail) return res.status(404).json({ success: false, message: 'Email not found' });
    
    if (mail.folder === 'INBOX' && !mail.read) {
      mail.read = true;
      await mail.save();
    }
    
    const response = { ...formatEmail(mail), aesKey: mail.aesKey, aesIV: mail.aesIV, otpKey: mail.otpKey, snoozed: mail.snoozed, labels: mail.labels || [] };
    
    // Auto-decrypt AES Body
    if (mail.encryption === 'AES' && mail.aesKey) {
      try {
        const encryptedData = JSON.parse(mail.body);
        response.body = aesDecrypt(encryptedData, mail.aesKey);
        response.decrypted = true;
        response.requiresDecryption = false;

        // Auto-decrypt AES Attachments
        if (response.attachments && response.attachments.length > 0) {
          response.attachments = response.attachments.map(att => {
            if (att.isEncrypted) {
              try {
                const encAttData = JSON.parse(att.data);
                return { ...att, data: aesDecrypt(encAttData, mail.aesKey), isEncrypted: false };
              } catch (e) {
                return att;
              }
            }
            return att;
          });
        }
      } catch (e) {
        console.error(`[DECRYPT] Automatic AES decryption failed for mail ${mailId}:`, e.message);
      }
    }
    
    res.json({ success: true, email: response });
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ success: false, message: 'Failed to get email' });
  }
});

// ------------------ UPDATE EMAIL STATUS ------------------
router.put('/:mailId/status', verifyToken, async (req, res) => {
  try {
    const { mailId } = req.params;
    const { action, folder, snoozeDate } = req.body;
    const userEmail = req.user.email;
    
    const mail = await Mail.findOne({ mailId, owner: userEmail });
    if (!mail) return res.status(404).json({ success: false, message: 'Email not found' });
    
    let update = {};
    switch (action) {
      case 'star': update.starred = true; break;
      case 'unstar': update.starred = false; break;
      case 'toggle-star': update.starred = !mail.starred; break;
      case 'important': update.important = true; break;
      case 'unimportant': update.important = false; break;
      case 'toggle-important': update.important = !mail.important; break;
      case 'read': update.read = true; break;
      case 'unread': update.read = false; break;
      case 'toggle-read': update.read = !mail.read; break;
      case 'archive': update.folder = 'ARCHIVE'; update.trash = false; update.snoozed = null; break;
      case 'unarchive': update.folder = mail.to === userEmail ? 'INBOX' : 'SENT'; update.trash = false; break;
      case 'trash': 
        if (mail.trash) {
          const mailSize = calculateMailSize(mail);
          await Mail.deleteOne({ mailId, owner: userEmail });
          await User.updateOne({ email: userEmail }, { $inc: { storageUsed: -mailSize } });
          return res.json({ success: true, message: 'Email permanently deleted' });
        }
        update.trash = true; 
        update.snoozed = null;
        break;
      case 'restore': update.trash = false; break;
      case 'delete': 
        const delSize = calculateMailSize(mail);
        await Mail.deleteOne({ mailId, owner: userEmail });
        await User.updateOne({ email: userEmail }, { $inc: { storageUsed: -delSize } });
        return res.json({ success: true, message: 'Email permanently deleted' });
      case 'snooze': 
        update.snoozed = new Date(snoozeDate); 
        update.folder = 'SNOOZED'; 
        update.read = false; // Snoozed emails are typically unread
        break;
      case 'unsnooze': 
        update.snoozed = null; 
        update.folder = 'INBOX'; 
        break;
      case 'spam':
        update.folder = 'SPAM';
        update.snoozed = null;
        update.trash = false;
        // Add sender to spamList
        const user = await User.findOne({ email: userEmail });
        if (user && !user.spamList.includes(mail.from.toLowerCase())) {
          user.spamList.push(mail.from.toLowerCase());
          await user.save();
        }
        break;
      case 'not-spam':
        update.folder = 'INBOX';
        // Remove sender from spamList
        const suser = await User.findOne({ email: userEmail });
        if (suser) {
          suser.spamList = suser.spamList.filter(e => e !== mail.from.toLowerCase());
          await suser.save();
        }
        break;
      case 'move': 
        update.folder = folder.toUpperCase(); 
        update.trash = false; 
        update.snoozed = null; // Moving out of snoozed folder
        break;
    }
    
    await Mail.updateOne({ mailId, owner: userEmail }, { $set: update });
    const updated = await Mail.findOne({ mailId, owner: userEmail });
    
    // Clear user cache after status change
    clearUserCache(userEmail);
    
    res.json({ success: true, email: formatEmail(updated) });
  } catch (error) {
    console.error('Update email status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ BATCH ACTIONS ------------------
router.post('/batch-update', verifyToken, async (req, res) => {
  try {
    const { emailIds, action, folder } = req.body;
    const userEmail = req.user.email;
    
    let update = {};
    switch (action) {
      case 'star': update = { $set: { starred: true } }; break;
      case 'unstar': update = { $set: { starred: false } }; break;
      case 'read': update = { $set: { read: true } }; break;
      case 'unread': update = { $set: { read: false } }; break;
      case 'archive': update = { $set: { folder: 'ARCHIVE', trash: false, snoozed: null } }; break;
      case 'trash': 
        // Identify which are already in trash (will be permanently deleted) vs which are just being trashed
        const existingMails = await Mail.find({ mailId: { $in: emailIds }, owner: userEmail });
        const alreadyInTrashIds = existingMails.filter(m => m.trash).map(m => m.mailId);
        const newlyTrashingIds = existingMails.filter(m => !m.trash).map(m => m.mailId);

        if (alreadyInTrashIds.length > 0) {
          const mailsToDeleteForever = existingMails.filter(m => m.trash);
          let reclaimed = 0;
          mailsToDeleteForever.forEach(m => reclaimed += calculateMailSize(m));
          
          await Mail.deleteMany({ mailId: { $in: alreadyInTrashIds }, owner: userEmail });
          await User.updateOne({ email: userEmail }, { $inc: { storageUsed: -reclaimed } });
        }

        if (newlyTrashingIds.length > 0) {
          await Mail.updateMany(
            { mailId: { $in: newlyTrashingIds }, owner: userEmail },
            { $set: { trash: true, snoozed: null } }
          );
        }
        return res.json({ success: true, deleted: alreadyInTrashIds.length, trashed: newlyTrashingIds.length });

      case 'restore': update = { $set: { trash: false } }; break;
      case 'important': update = { $set: { important: true } }; break;
      case 'unimportant': update = { $set: { important: false } }; break;
      case 'snooze': update = { $set: { folder: 'SNOOZED', snoozed: new Date(req.body.snoozeDate || Date.now() + 86400000) } }; break;
      case 'task': update = { $set: { folder: 'TASKS', trash: false } }; break;
      case 'spam': 
        update = { $set: { folder: 'SPAM', trash: false, snoozed: null } }; 
        // Also add senders to spam list
        const mailsToSpam = await Mail.find({ mailId: { $in: emailIds }, owner: userEmail });
        const spamSenders = [...new Set(mailsToSpam.map(m => m.from.toLowerCase()))];
        await User.updateOne({ email: userEmail }, { $addToSet: { spamList: { $each: spamSenders } } });
        break;
      case 'delete':
        const mailsToDelete = await Mail.find({ mailId: { $in: emailIds }, owner: userEmail });
        let totalSizeToReclaim = 0;
        mailsToDelete.forEach(m => totalSizeToReclaim += calculateMailSize(m));
        
        const del = await Mail.deleteMany({ mailId: { $in: emailIds }, owner: userEmail });
        await User.updateOne({ email: userEmail }, { $inc: { storageUsed: -totalSizeToReclaim } });
        return res.json({ success: true, count: del.deletedCount, reclaimed: totalSizeToReclaim });
      case 'move': update = { $set: { folder: (folder || 'INBOX').toUpperCase(), trash: false, snoozed: null } }; break;
      case 'label':
        const { labelId } = req.body;
        update = { $addToSet: { labels: labelId } };
        break;
      case 'unlabel':
        const { labelId: ulId } = req.body;
        update = { $pull: { labels: ulId } };
        break;
    }

    if (['toggle-star', 'toggle-important', 'toggle-read', 'unarchive'].includes(action)) {
      // Complex logic for toggles
      const emails = await Mail.find({ mailId: { $in: emailIds }, owner: userEmail });
      const ops = emails.map(m => {
        let u = {};
        if (action === 'toggle-star') u = { starred: !m.starred };
        else if (action === 'toggle-important') u = { important: !m.important };
        else if (action === 'toggle-read') u = { read: !m.read };
        else if (action === 'unarchive') u = { folder: m.to === userEmail ? 'INBOX' : 'SENT', trash: false };
        return { updateOne: { filter: { mailId: m.mailId, owner: userEmail }, update: { $set: u } } };
      });
      await Mail.bulkWrite(ops);
      return res.json({ success: true, count: ops.length });
    }

    const result = await Mail.updateMany({ mailId: { $in: emailIds }, owner: userEmail }, update);
    res.json({ success: true, count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/move-to-folder', verifyToken, async (req, res) => {
    try {
      const { emailIds, targetFolder } = req.body;
      const userEmail = req.user.email;
      const update = targetFolder === 'trash' ? { trash: true, snoozed: null } : { folder: targetFolder.toUpperCase(), trash: false, snoozed: null };
      const result = await Mail.updateMany({ mailId: { $in: emailIds }, owner: userEmail }, { $set: update });
      res.json({ success: true, count: result.modifiedCount });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});

// ------------------ SEARCH ------------------
router.post('/search', verifyToken, async (req, res) => {
  try {
    const { query, folder, limit = 50 } = req.body;
    const userEmail = req.user.email;
    const searchQuery = {
      owner: userEmail,
      trash: folder === 'trash',
      $or: [
        { subject: { $regex: query, $options: 'i' } },
        { body: { $regex: query, $options: 'i' } },
        { from: { $regex: query, $options: 'i' } },
        { to: { $regex: query, $options: 'i' } }
      ]
    };
    if (folder && !['all', 'trash'].includes(folder)) searchQuery.folder = folder.toUpperCase();
    if (folder === 'starred') { delete searchQuery.folder; searchQuery.starred = true; }
    if (folder === 'important') { delete searchQuery.folder; searchQuery.important = true; }

    const mails = await Mail.find(searchQuery).select('-aesKey -aesIV').sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, emails: mails.map(formatEmail), total: await Mail.countDocuments(searchQuery) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ DECRYPT ------------------
router.post('/decrypt', verifyToken, decryptionLimiter, async (req, res) => {
  try {
    const { emailId, encryptionKey } = req.body;
    const userEmail = req.user.email;
    
    // Explicitly select keys as they are excluded by default
    const mail = await Mail.findOne({ mailId: emailId, owner: userEmail }).select('+aesKey +aesIV +otpKey');
    if (!mail) return res.status(404).json({ success: false, message: 'Email not found' });
    
    let decryptedBody = mail.body;
    let decryptedAttachments = mail.attachments || [];
    let usedKey = encryptionKey;

    if (mail.encryption === 'AES') {
      try {
        const encryptedData = JSON.parse(mail.body);
        decryptedBody = aesDecrypt(encryptedData, mail.aesKey);

        // Decrypt AES Attachments
        decryptedAttachments = decryptedAttachments.map(att => {
          if (att.isEncrypted) {
            try {
              const encAttData = JSON.parse(att.data);
              return { ...att, data: aesDecrypt(encAttData, mail.aesKey), isEncrypted: false };
            } catch (e) { return att; }
          }
          return att;
        });
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid AES format: ' + e.message });
      }
    } else if (mail.encryption === 'OTP') {
      let ciphertext = mail.body;
      let extractKey = encryptionKey;

      if (mail.body.startsWith('[otp|') && mail.body.includes(']:')) {
        const match = mail.body.match(/^\[otp\|([^\]]+)\]:([\s\S]*)$/);
        if (match) {
          extractKey = encryptionKey || match[1] || mail.otpKey;
          ciphertext = match[2];
        }
      } else if (!extractKey && mail.otpKey) {
        extractKey = mail.otpKey;
      }

      if (!extractKey) {
        return res.status(400).json({ success: false, message: 'OTP key is required for decryption' });
      }

      try {
        decryptedBody = otpDecrypt(ciphertext, extractKey);

        // Decrypt OTP Attachments (Note: OTP attachments have their OWN keys embedded)
        decryptedAttachments = decryptedAttachments.map(att => {
          if (att.isEncrypted && att.data.startsWith('[otp|')) {
            try {
              const match = att.data.match(/^\[otp\|([^\]]+)\]:([\s\S]*)$/);
              if (match) {
                return { ...att, data: otpDecrypt(match[2], match[1]), isEncrypted: false };
              }
            } catch (e) { return att; }
          }
          return att;
        });
      } catch (e) {
        return res.status(400).json({ success: false, message: 'OTP decryption failed: ' + e.message });
      }
    } else {
      return res.json({ success: true, decrypted: mail.body, attachments: mail.attachments, alreadyDecrypted: true });
    }
    
    // Mark as read after success
    if (!mail.read) { 
      mail.read = true; 
      await mail.save(); 
    }
    
    res.json({ 
      success: true, 
      decrypted: decryptedBody, 
      attachments: decryptedAttachments,
      emailId: mail.mailId,
      encryptionUsed: mail.encryption,
      isJson: typeof decryptedBody === 'object' || (typeof decryptedBody === 'string' && decryptedBody.startsWith('{'))
    });
  } catch (error) {
    console.error('Decryption route error:', error);
    res.status(500).json({ success: false, message: 'Decryption encountered an error: ' + error.message });
  }
});

// ------------------ SNOOZED FOLDER ------------------
router.post('/snoozed', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { page = 1, limit = 50 } = req.body;
    
    await checkSnoozed(userEmail);
    
    const count = await Mail.countDocuments({ owner: userEmail, folder: 'SNOOZED', trash: false });
    const emails = await Mail.find({ owner: userEmail, folder: 'SNOOZED', trash: false })
      .sort({ snoozed: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
      
    res.json({ success: true, emails: emails.map(formatEmail), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ SPAM FOLDER ------------------
router.post('/spam', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { page = 1, limit = 50 } = req.body;
    
    const count = await Mail.countDocuments({ owner: userEmail, folder: 'SPAM', trash: false });
    const emails = await Mail.find({ owner: userEmail, folder: 'SPAM', trash: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
      
    res.json({ success: true, emails: emails.map(formatEmail), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
