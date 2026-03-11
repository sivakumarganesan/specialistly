import mongoose from 'mongoose';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Searching for website: 69b1b38293086978a0d070ff\n');
    
    const website = await Website.findById('69b1b38293086978a0d070ff');
    
    if (website) {
      console.log('✅ FOUND!');
      console.log(JSON.stringify(website.toObject(), null, 2));
    } else {
      console.log('❌ Not found via findById\n');
      
      // Try finding by any field
      console.log('📋 All websites in database:');
      const all = await Website.find({});
      console.log(`Total: ${all.length}\n`);
      
      all.forEach((w, i) => {
        console.log(`${i+1}. ${w._id}`);
        console.log(`   Email: ${w.creatorEmail}`);
        console.log(`   specialistId: ${w.specialistId}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
