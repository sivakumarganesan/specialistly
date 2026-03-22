import mongoose from 'mongoose';
import User from './models/User.js';
import Website from './models/Website.js';
import dotenv from 'dotenv';

dotenv.config();

const websiteId = '69865fdb8842af4984f76df5';

console.log('\n🔧 Fixing website specialistId field\n');

const fixWebsite = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Get website
    const website = await Website.findById(websiteId);
    
    if (!website) {
      console.error('❌ Website not found');
      process.exit(1);
    }

    console.log(`📍 Website: ${website._id}`);
    console.log(`   Creator Email: ${website.creatorEmail}`);
    console.log(`   Current specialistId: ${website.specialistId || '(not set)'}`);

    // Get user by email
    const user = await User.findOne({ email: website.creatorEmail });
    
    if (!user) {
      console.error(`❌ User not found: ${website.creatorEmail}`);
      process.exit(1);
    }

    console.log(`\n👤 Found User:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user._id}`);

    // Update website
    console.log(`\n🔧 Updating website...`);
    website.specialistId = user._id;
    await website.save();

    console.log('✅ Website updated successfully!');
    console.log(`   specialistId is now: ${website.specialistId}`);
    
    console.log('\n✅ You should now be able to upload images!');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixWebsite();
