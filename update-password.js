import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './backend/models/User.js';

dotenv.config();

const updatePassword = async () => {
  try {
    const email = 'specialistlyapp@gmail.com';
    const newPassword = 'password'; // Change this to new password

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly');
    console.log('✓ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    console.log(`✓ Password updated successfully for ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error.message);
    process.exit(1);
  }
};

updatePassword();
