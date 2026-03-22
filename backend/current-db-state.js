import mongoose from 'mongoose';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 CURRENT DATABASE STATE (Fresh Check):\n');
    
    // Get ALL websites with full details
    const allWebsites = await Website.find({}).lean();
    console.log(`Total websites: ${allWebsites.length}\n`);
    
    allWebsites.forEach((w, i) => {
      console.log(`${i+1}. Website`);
      console.log(`   _id: ${w._id}`);
      console.log(`   Email: ${w.creatorEmail}`);
      console.log(`   specialistId: ${w.specialistId}`);
      console.log(`   specialistId is null: ${w.specialistId === null}`);
      console.log(`   specialistId is undefined: ${w.specialistId === undefined}`);
      console.log('');
    });
    
    // Specifically check for the problematic ID
    console.log('🔎 Checking for 69b1b38293086978a0d070ff:');
    const problematicWebsite = await Website.findById('69b1b38293086978a0d070ff').lean();
    if (problematicWebsite) {
      console.log('   ✅ FOUND!');
      console.log('   Details:', JSON.stringify(problematicWebsite, null, 2));
    } else {
      console.log('   ❌ NOT FOUND');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
