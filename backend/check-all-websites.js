import mongoose from 'mongoose';
import Website from './models/Website.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAllWebsites = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Get all websites
    const allWebsites = await Website.find({}).lean();
    console.log(`Found ${allWebsites.length} total website(s)\n`);

    for (const website of allWebsites) {
      console.log(`📍 Website: ${website._id}`);
      console.log(`   Creator Email: ${website.creatorEmail}`);
      console.log(`   Has specialistId: ${!!website.specialistId}`);
      console.log(`   specialistId value: ${website.specialistId || 'undefined'}`);
      
      if (website.creatorEmail) {
        const user = await User.findOne({ email: website.creatorEmail });
        if (user) {
          console.log(`   User found: ${user.name}`);
          console.log(`   User ID: ${user._id}`);
        } else {
          console.log(`   ⚠️  No user found for ${website.creatorEmail}`);
        }
      }
      console.log('');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkAllWebsites();
