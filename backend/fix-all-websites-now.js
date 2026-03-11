import mongoose from 'mongoose';
import Website from './models/Website.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAllWebsites = async () => {
  try {
    console.log('🔧 Fixing ALL websites - Direct database update\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Get all websites without specialistId
    const websitesNeedingFix = await Website.find(
      { $or: [{ specialistId: { $exists: false } }, { specialistId: null }] }
    );

    console.log(`Found ${websitesNeedingFix.length} website(s) needing fix\n`);

    let updated = 0;
    for (const website of websitesNeedingFix) {
      console.log(`🔧 Fixing: ${website._id}`);
      
      if (!website.creatorEmail) {
        console.log('   ⚠️  No creator email - skipping');
        continue;
      }

      const user = await User.findOne({ email: website.creatorEmail });
      if (!user) {
        console.log(`   ⚠️  No user found for ${website.creatorEmail}`);
        continue;
      }

      // Use findByIdAndUpdate to ensure it saves
      const result = await Website.findByIdAndUpdate(
        website._id,
        { specialistId: user._id },
        { new: true }
      );

      console.log(`   ✅ Updated! specialistId is now: ${result.specialistId}`);
      updated++;
    }

    console.log(`\n✅ Fixed ${updated} website(s)`);

    // Verify
    console.log('\n🔍 Verification:');
    const verify = await Website.findOne({ specialistId: { $exists: false } });
    if (verify) {
      console.log('❌ Still have websites without specialistId!');
    } else {
      console.log('✅ All websites now have specialistId!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

fixAllWebsites();
