import mongoose from 'mongoose';
import User from './backend/models/User.js';
import Website from './backend/models/Website.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const checkWebsiteOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const websiteId = '69865fdb8842af4984f76df5';
    
    // Find the website
    const website = await Website.findById(websiteId);
    if (!website) {
      console.error('❌ Website not found');
      return;
    }

    console.log('\n📍 Website Details:');
    console.log('   ID:', website._id);
    console.log('   Name:', website.name);
    console.log('   Domain:', website.domain);
    console.log('   Specialist ID (Owner):', website.specialistId);
    console.log('   Specialist ID Type:', typeof website.specialistId);

    // Find the user that owns this website
    const owner = await User.findById(website.specialistId);
    if (owner) {
      console.log('\n👤 Website Owner:');
      console.log('   Name:', owner.name);
      console.log('   Email:', owner.email);
      console.log('   User ID:', owner._id);
      console.log('   Is Specialist:', owner.isSpecialist);
    } else {
      console.error('   ❌ Owner user not found in database');
    }

    // List all users (for reference)
    const allUsers = await User.find({}, 'name email isSpecialist _id').limit(10);
    console.log('\n📋 All Users in Database:');
    allUsers.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkWebsiteOwner();
