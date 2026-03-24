const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Mail = require('../models/Mail');
const Notification = require('../models/Notification');
const { verifyToken, validateQumailEmail } = require('../middleware/authMiddleware');
const { 
  generateOTPKey, otpEncrypt, otpDecrypt,
  generateAESKey, generateAESIV, aesEncrypt, aesDecrypt,
  isValidHexKey
} = require('../utils/encryption');

// ------------------ SEND EMAIL ------------------
router.post('/send', 
  [
    verifyToken,
    body('to').isEmail().withMessage('Valid recipient email required').custom(validateQumailEmail).withMessage('Can only send to @qumail.com addresses'),
    body('subject').optional().trim().isLength({ max: 200 }),
    body('body').trim().notEmpty().withMessage('Message body is required'),
    body('encryptionLevel').optional().isIn(['none', 'otp', 'aes256', 'aes'])
  ],
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
      
      const { to, subject, body, encryptionLevel = 'none' } = req.body;
      const from = req.user.email;
      const normalizedEncryptionLevel = encryptionLevel === 'aes' ? 'aes256' : encryptionLevel;
      
      const lowerTo = to.toLowerCase().trim();
      const recipient = await User.findOne({ email: lowerTo }).session(session);
      if (!recipient) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Recipient @qumail.com address not found' });
      }
      
      let encryptedBody = body;
      let encryptionType = 'NONE';
      let aesKey = null;
      let aesIV = null;
      
      if (normalizedEncryptionLevel !== 'none') {
        if (normalizedEncryptionLevel === 'otp') {
          encryptionType = 'OTP';
          if (!body.startsWith('[otp|') || !body.includes(']:')) {
            const textLength = Buffer.from(body, 'utf8').length;
            const otpKey = generateOTPKey(textLength);
            encryptedBody = otpEncrypt(body, otpKey);
            encryptedBody = `[otp|${otpKey}]:${encryptedBody}`;
          }
        } else if (normalizedEncryptionLevel === 'aes256') {
          encryptionType = 'AES';
          const sender = await User.findOne({ email: from }).session(session);
          aesKey = sender.encryptionKeys?.aes256 || generateAESKey();
          aesIV = generateAESIV();
          const encryptedData = aesEncrypt(body, aesKey, aesIV);
          encryptedBody = JSON.stringify(encryptedData);
        }
      }
      
      const mailId = uuidv4();
      const timestamp = new Date();
      
      // Sent mail for sender
      const sentMail = new Mail({
        mailId, from, to: lowerTo,
        subject: subject || '(No Subject)',
        body: body, encryption: 'NONE',
        folder: 'SENT', owner: from, read: true,
        createdAt: timestamp, updatedAt: timestamp
      });
      await sentMail.save({ session });
      
      // Inbox mail for recipient
      const inboxMail = new Mail({
        mailId, from, to: lowerTo,
        subject: encryptionType !== 'NONE' ? `🔒 ${subject || 'Encrypted Message'}` : (subject || '(No Subject)'),
        body: encryptedBody, encryption: encryptionType,
        aesKey, aesIV, folder: 'INBOX', owner: lowerTo, read: false,
        createdAt: timestamp, updatedAt: timestamp
      });
      await inboxMail.save({ session });
      
      // Notify recipient
      await Notification.create([{
        userId: recipient._id,
        title: 'New Message Received',
        message: `From: ${from}`,
        type: 'info',
        icon: 'Mail'
      }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      res.json({
        success: true,
        message: `Email sent successfully via QuMail (${normalizedEncryptionLevel})`,
        messageId: mailId,
        sentAt: timestamp,
        encryption: { level: normalizedEncryptionLevel, encrypted: normalizedEncryptionLevel !== 'none', type: encryptionType }
      });
      
    } catch (error) {
      if (session.inAtomTransaction()) await session.abortTransaction();
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
  spam: false,
  archived: mail.folder === 'ARCHIVE',
  folder: mail.folder.toLowerCase(),
  encrypted: mail.encryption !== 'NONE',
  encryptionLevel: mail.encryption === 'AES' ? 'aes256' : mail.encryption === 'OTP' ? 'otp' : 'none',
  requiresDecryption: mail.encryption !== 'NONE',
  attachments: [],
  size: mail.body ? mail.body.length : 0
});

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
      Mail.find(query).select('-aesKey -aesIV').sort({ createdAt: -1 }).skip(skip).limit(limit),
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

router.post('/inbox', verifyToken, getFolderRoute('INBOX'));
router.post('/sent', verifyToken, getFolderRoute('SENT'));
router.post('/archive', verifyToken, getFolderRoute('ARCHIVE'));
router.post('/trash', verifyToken, getFolderRoute('TRASH'));

// ------------------ SPECIAL FOLDERS ------------------
const getSpecialFolderRoute = (queryField) => async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.body;
    const email = req.user.email;
    const skip = (page - 1) * limit;
    
    const query = { owner: email, [queryField]: true, trash: false };

    const [mails, total] = await Promise.all([
      Mail.find(query).select('-aesKey -aesIV').sort({ createdAt: -1 }).skip(skip).limit(limit),
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

router.post('/starred', verifyToken, getSpecialFolderRoute('starred'));
router.post('/important', verifyToken, getSpecialFolderRoute('important'));

// ------------------ COUNTS ------------------
router.get('/folder-counts', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const [inbox, sent, archive, trash, starred, important, drafts, unread] = await Promise.all([
      Mail.countDocuments({ owner: userEmail, folder: 'INBOX', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'SENT', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'ARCHIVE', trash: false }),
      Mail.countDocuments({ owner: userEmail, trash: true }),
      Mail.countDocuments({ owner: userEmail, starred: true, trash: false }),
      Mail.countDocuments({ owner: userEmail, important: true, trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'DRAFTS', trash: false }),
      Mail.countDocuments({ owner: userEmail, folder: 'INBOX', read: false, trash: false })
    ]);
    res.json({ success: true, counts: { inbox, sent, archive, trash, starred, important, unread, drafts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ GET SINGLE EMAIL ------------------
router.get('/:mailId', verifyToken, async (req, res) => {
  try {
    const mailId = req.params.mailId;
    const userEmail = req.user.email;
    
    const mail = await Mail.findOne({ mailId, owner: userEmail }).select('+aesKey +aesIV');
    if (!mail) return res.status(404).json({ success: false, message: 'Email not found' });
    
    if (mail.folder === 'INBOX' && !mail.read) {
      mail.read = true;
      await mail.save();
    }
    
    const response = { ...formatEmail(mail), aesKey: mail.aesKey, aesIV: mail.aesIV, snoozed: mail.snoozed, labels: mail.labels || [] };
    
    if (mail.encryption === 'AES' && mail.aesKey && mail.aesIV) {
      try {
        response.body = aesDecrypt(JSON.parse(mail.body), mail.aesKey);
        response.decrypted = true;
        response.requiresDecryption = false;
      } catch (e) {}
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
      case 'archive': update.folder = 'ARCHIVE'; update.trash = false; break;
      case 'unarchive': update.folder = mail.to === userEmail ? 'INBOX' : 'SENT'; update.trash = false; break;
      case 'trash': update.trash = true; break;
      case 'restore': update.trash = false; break;
      case 'delete': 
        await Mail.deleteOne({ mailId, owner: userEmail });
        return res.json({ success: true, message: 'Email permanently deleted' });
      case 'snooze': update.snoozed = new Date(snoozeDate); break;
      case 'unsnooze': update.snoozed = null; break;
      case 'move': update.folder = folder.toUpperCase(); update.trash = false; break;
    }
    
    await Mail.updateOne({ mailId, owner: userEmail }, { $set: update });
    const updated = await Mail.findOne({ mailId, owner: userEmail });
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
      case 'archive': update = { $set: { folder: 'ARCHIVE', trash: false } }; break;
      case 'trash': update = { $set: { trash: true } }; break;
      case 'restore': update = { $set: { trash: false } }; break;
      case 'delete':
        const del = await Mail.deleteMany({ mailId: { $in: emailIds }, owner: userEmail });
        return res.json({ success: true, count: del.deletedCount });
      case 'move': update = { $set: { folder: folder.toUpperCase(), trash: false } }; break;
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
      const update = targetFolder === 'trash' ? { trash: true } : { folder: targetFolder.toUpperCase(), trash: false };
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

    const mails = await Mail.find(searchQuery).select('-aesKey -aesIV').sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, emails: mails.map(formatEmail), total: await Mail.countDocuments(searchQuery) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------ DECRYPT ------------------
router.post('/decrypt', verifyToken, async (req, res) => {
  try {
    const { emailId, encryptionKey } = req.body;
    const userEmail = req.user.email;
    const mail = await Mail.findOne({ mailId: emailId, owner: userEmail }).select('+aesKey +aesIV');
    if (!mail) return res.status(404).json({ success: false, message: 'Email not found' });
    
    let decryptedBody;
    if (mail.encryption === 'AES') {
      decryptedBody = aesDecrypt(JSON.parse(mail.body), mail.aesKey);
    } else if (mail.encryption === 'OTP') {
      decryptedBody = otpDecrypt(mail.body, encryptionKey);
    } else {
      return res.json({ success: true, decrypted: mail.body, alreadyDecrypted: true });
    }
    
    if (!mail.read) { mail.read = true; await mail.save(); }
    res.json({ success: true, decrypted: decryptedBody, emailId: mail.mailId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Decryption failed: ' + error.message });
  }
});


// ------------------ DRAFTS ------------------
router.post('/drafts', verifyToken, async (req, res) => {
  try {
    const drafts = await Mail.find({ owner: req.user.email, folder: 'DRAFTS', trash: false }).sort({ updatedAt: -1 });
    res.json({ success: true, drafts: drafts.map(d => ({ id: d._id, mailId: d.mailId, to: d.to, subject: d.subject, body: d.body, date: d.updatedAt })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/drafts/create', verifyToken, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const draft = new Mail({ mailId: uuidv4(), from: req.user.email, to, subject, body, folder: 'DRAFTS', owner: req.user.email, read: true });
    await draft.save();
    res.json({ success: true, draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/drafts/:id', verifyToken, async (req, res) => {
    try {
      await Mail.findOneAndDelete({ _id: req.params.id, owner: req.user.email });
      res.json({ success: true, message: 'Draft deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
