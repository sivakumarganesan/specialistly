import mongoose from 'mongoose';
import Website from './models/Website.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔧 Fixing all websites with missing specialistId...\n');
    
    // Find all websites
    const websites = await Website.find({});
    console.log(`Found ${websites.length} total websites\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const website of websites) {
      console.log(`Processing website: ${website._id}`);
      console.log(`  Creator Email: ${website.creatorEmail}`);
      console.log(`  Current specialistId: ${website.specialistId}`);
      
      // If specialistId is already set, skip
      if (website.specialistId) {
        console.log('  ✅ Already has specialistId, skipping\n');
        continue;
      }
      
      // Find the user by email
      const user = await User.findOne({ email: website.creatorEmail });
      
      if (!user) {
        console.error(`  ❌ User not found with email: ${website.creatorEmail}\n`);
        errors++;
        continue;
      }
      
      console.log(`  Found user: ${user._id}`);
      
      // Update the website with the specialistId
      website.specialistId = user._id;
      await website.save();
      
      console.log(`  ✅ Updated specialistId to: ${user._id}\n`);
      fixed++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${websites.length}`);
    
    if (fixed > 0) {
      console.log('\n✅ All websites fixed!');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
