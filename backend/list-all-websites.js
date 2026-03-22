import mongoose from 'mongoose';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

const listAllWebsites = async () => {
  try {
    console.log('📋 Listing all websites\n');
    await mongoose.connect(process.env.MONGODB_URI);

    const websites = await Website.find({}).lean();
    
    console.log(`Found ${websites.length} websites:\n`);
    
    websites.forEach((w, i) => {
      console.log(`${i + 1}. ${w._id}`);
      console.log(`   Creator: ${w.creatorEmail}`);
      console.log(`   specialistId: ${w.specialistId || 'undefined'}`);
      console.log(`   Created: ${w.createdAt}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

listAllWebsites();
