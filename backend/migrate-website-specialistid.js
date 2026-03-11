import mongoose from 'mongoose';
import User from './models/User.js';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔄 Migrating ALL websites to have specialistId\n');

const migrateAllWebsites = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Find all websites without specialistId
    const websitesNeedingFix = await Website.find(
      { $or: [{ specialistId: { $exists: false } }, { specialistId: null }] }
    );

    console.log(`Found ${websitesNeedingFix.length} website(s) needing specialistId`);
    
    if (websitesNeedingFix.length === 0) {
      console.log('✅ All websites already have specialistId');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const website of websitesNeedingFix) {
      try {
        console.log(`\n🔧 Processing: ${website._id}`);
        console.log(`   Creator Email: ${website.creatorEmail}`);

        if (!website.creatorEmail) {
          console.log('   ⚠️  No creatorEmail - skipping');
          failed++;
          continue;
        }

        // Find user by email
        const user = await User.findOne({ email: website.creatorEmail });
        
        if (!user) {
          console.log(`   ⚠️  User not found for ${website.creatorEmail} - skipping`);
          failed++;
          continue;
        }

        // Update website
        website.specialistId = user._id;
        await website.save();
        
        console.log(`   ✅ Updated with specialistId: ${user._id}`);
        updated++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

migrateAllWebsites();
