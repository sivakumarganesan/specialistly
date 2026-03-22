import mongoose from 'mongoose';
import User from './models/User.js';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

const websiteId = '69865fdb8842af4984f76df5';

console.log('\n🔍 Website Ownership Diagnostic\n');
console.log('=' .repeat(50));

const diagnose = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get website
    console.log(`🔎 Checking website: ${websiteId}`);
    const website = await Website.findById(websiteId).lean();
    
    if (!website) {
      console.error('❌ Website not found in database');
      process.exit(1);
    }

    console.log(`✅ Website found: ${website.name || '(no name)'}`);
    console.log(`   Full website doc:`, JSON.stringify(website, null, 2));
    console.log('');

    // Get owner
    console.log('👤 CURRENT OWNER:');
    const owner = await User.findById(website.specialistId);
    
    if (owner) {
      console.log(`   Email: ${owner.email}`);
      console.log(`   Name: ${owner.name}`);
      console.log(`   User ID: ${owner._id}`);
    } else {
      console.log(`   ❌ Owner user not found (ID: ${website.specialistId})`);
    }

    console.log('\n👥 ALL SPECIALISTS IN DATABASE:');
    const specialists = await User.find({ isSpecialist: true }, 'email name _id');
    
    if (specialists.length === 0) {
      console.log('   ❌ No specialists found');
    } else {
      specialists.forEach((user, idx) => {
        if (!user._id) {
          console.log(`   ${idx + 1}. ❌ User without ID`);
          return;
        }
        const isOwner = website.specialistId && user._id.toString() === website.specialistId.toString();
        const indicator = isOwner ? ' 👈 OWNS THIS WEBSITE' : '';
        console.log(`   ${idx + 1}. ${user.email} (${user.name})${indicator}`);
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n💡 HOW TO FIX:');
    console.log('   1. Log in with the correct account:');
    
    if (owner) {
      console.log(`      Email: ${owner.email}`);
    } else {
      console.log(`      (The original owner account is not found)`);
    }
    
    console.log('   2. Try uploading the image again\n');
    console.log('   OR if you want to reassign ownership to a different user:');
    console.log('   node fix-website-owner.js <email> 69865fdb8842af4984f76df5\n');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

diagnose();
