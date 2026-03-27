const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
  storageLimit: Number
});

const User = mongoose.model('User', UserSchema);

async function updateStorageLimits() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI not found in .env');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const NEW_LIMIT = 15 * 1024 * 1024 * 1024;

    const result = await User.updateMany(
      { storageLimit: { $ne: NEW_LIMIT } },
      { $set: { storageLimit: NEW_LIMIT } }
    );

    console.log(`Successfully updated ${result.modifiedCount} users to 15GB storage limit.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

updateStorageLimits();
