const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Mail = require('./models/Mail');

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

async function recalculateStorage() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI not found in .env');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Recalculating storage...`);

    for (const user of users) {
      const userMails = await Mail.find({ owner: user.email });
      let totalSize = 0;
      userMails.forEach(mail => {
        totalSize += calculateMailSize(mail);
      });

      await User.updateOne({ _id: user._id }, { $set: { storageUsed: totalSize } });
      console.log(`Updated ${user.email}: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    }

    console.log('Recalculation complete.');
    process.exit(0);
  } catch (error) {
    console.error('Recalculation failed:', error);
    process.exit(1);
  }
}

recalculateStorage();
