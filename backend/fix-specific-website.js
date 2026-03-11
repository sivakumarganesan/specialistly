import mongoose from 'mongoose';
import Website from './models/Website.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixSpecificWebsite = async (websiteId) => {
  try {
    console.log(`🔧 Fixing website: ${websiteId}\n`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const website = await Website.findById(websiteId);
    
    if (!website) {
      console.error(`❌ Website not found: ${websiteId}`);
      process.exit(1);
    }

    console.log(`📍 Website: ${website._id}`);
    console.log(`   Creator Email: ${website.creatorEmail}`);
    console.log(`   Current specialistId: ${website.specialistId || 'undefined'}`);

    if (!website.creatorEmail) {
      console.error('❌ Website has no creatorEmail');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: website.creatorEmail });
    
    if (!user) {
      console.error(`❌ User not found for ${website.creatorEmail}`);
      process.exit(1);
    }

    console.log(`\n👤 Found user:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user._id}`);

    // Update website
    console.log(`\n🔧 Updating website...`);
    const updated = await Website.findByIdAndUpdate(
      websiteId,
      { specialistId: user._id },
      { new: true }
    );

    console.log(`✅ Website updated!`);
    console.log(`   specialistId is now: ${updated.specialistId}`);

    await mongoose.disconnect();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const websiteId = process.argv[2];
if (!websiteId) {
  console.log('Usage: node fix-specific-website.js <websiteId>');
  console.log('Example: node fix-specific-website.js 69b1b38293086978a0d070ff');
  process.exit(1);
}

fixSpecificWebsite(websiteId);
