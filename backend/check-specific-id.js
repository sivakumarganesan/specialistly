import mongoose from 'mongoose';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

const checkSpecificWebsite = async () => {
  try {
    console.log('🔍 Checking for website: 69b1b38293086978a0d070ff\n');
    await mongoose.connect(process.env.MONGODB_URI);

    const website = await Website.findById('69b1b38293086978a0d070ff');
    
    if (website) {
      console.log('✅ Website found!');
      console.log(JSON.stringify(website.toObject(), null, 2));
    } else {
      console.log('❌ Website not found');
    }

    // Also check by email to find all websites
    console.log('\n\n📋 All websites in database:');
    const allWebsites = await Website.find({});
    console.log(`Total: ${allWebsites.length}`);
    allWebsites.forEach((w, i) => {
      console.log(`\n${i + 1}. ID: ${w._id}`);
      console.log(`   Creator: ${w.creatorEmail}`);
      console.log(`   specialistId: ${w.specialistId}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkSpecificWebsite();
