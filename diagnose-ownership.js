#!/usr/bin/env node
/**
 * Auto-detect issue: Shows current logged-in user vs. website owner
 * Also provides recommendation to fix
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const backendEnvPath = path.join(__dirname, 'backend', '.env');
dotenv.config({ path: backendEnvPath });

console.log('🔍 Analyzing website ownership issue...\n');

const diagnose = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not configured');
      return;
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);

    // Dynamic imports for models
    const userModule = await import('./backend/models/User.js');
    const websiteModule = await import('./backend/models/Website.js');
    const User = userModule.default;
    const Website = websiteModule.default;

    const websiteId = '69865fdb8842af4984f76df5';
    
    // Get website
    const website = await Website.findById(websiteId);
    if (!website) {
      console.error('❌ Website not found');
      process.exit(1);
    }

    // Get owner
    const owner = await User.findById(website.specialistId);
    
    console.log('\n📍 WEBSITE DETAILS:');
    console.log(`   ID: ${website._id}`);
    console.log(`   Name: ${website.name}`);
    console.log(`   Owner Email: ${owner ? owner.email : 'Unknown'}`);
    console.log(`   Owner ID: ${website.specialistId}`);

    console.log('\n👥 AVAILABLE USERS (for reference):');
    const users = await User.find({ isSpecialist: true }, 'email name _id').lean();
    users.forEach((u, i) => {
      const isOwner = u._id.toString() === website.specialistId.toString();
      console.log(`   ${i + 1}. ${u.email} (${u.name}) ${isOwner ? '👈 CURRENT OWNER' : ''}`);
    });

    console.log('\n💡 SOLUTION:');
    console.log('   To fix the ownership issue, you need to:');
    console.log('   1. Log in with the account that owns the website:');
    console.log(`      Email: ${owner ? owner.email : 'Unknown'}`);
    console.log('   2. Then try uploading the image again');
    console.log('\n   OR');
    console.log('   If you want to reassign ownership, run:');
    console.log(`   node fix-website-owner.js <your-email> ${websiteId}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

diagnose().catch(console.error);
