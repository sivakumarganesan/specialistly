#!/usr/bin/env node
/**
 * Script to reassign website ownership to current user
 * Usage: node fix-website-owner.js <userEmail> <websiteId>
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '/backend/.env') });

// Import models
import User from './backend/models/User.js';
import Website from './backend/models/Website.js';

const [, , userEmail, websiteId] = process.argv;

if (!userEmail || !websiteId) {
  console.log('Usage: node fix-website-owner.js <userEmail> <websiteId>');
  console.log('Example: node fix-website-owner.js user@example.com 69865fdb8842af4984f76df5');
  process.exit(1);
}

const fixOwnership = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set in .env');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      console.log('\nℹ️  Available users:');
      const users = await User.find({}, 'name email _id').limit(10);
      users.forEach(u => console.log(`   - ${u.email} (${u.name})`));
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}`);

    // Find website
    const website = await Website.findById(websiteId);
    if (!website) {
      console.error(`❌ Website not found: ${websiteId}`);
      process.exit(1);
    }

    console.log(`\n✅ Found website: ${website.name}`);
    console.log(`   Current owner ID: ${website.specialistId}`);
    console.log(`   New owner ID: ${user._id}`);

    // Update ownership
    website.specialistId = user._id;
    await website.save();

    console.log('\n✅ Website ownership updated successfully!');
    console.log(`   ${website.name} is now owned by ${user.email}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

fixOwnership();
