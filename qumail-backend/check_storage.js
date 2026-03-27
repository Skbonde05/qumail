const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
  email: String,
  storageLimit: Number
});

const User = mongoose.model('User', UserSchema);

async function checkStorage() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log('User storage limits:');
    users.forEach(u => {
      console.log(`${u.email}: ${u.storageLimit / (1024 * 1024 * 1024)} GB`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkStorage();
