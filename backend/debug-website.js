import mongoose from 'mongoose';
import Website from './models/Website.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const debugWebsite = async () => {
  try {
    console.log('🔍 Debugging website specialistId issue\n');
    await mongoose.connect(process.env.MONGODB_URI);

    const website = await Website.findById('69865fdb8842af4984f76df5');
    console.log('Website found:');
    console.log(`  _id: ${website._id}`);
    console.log(`  creatorEmail: ${website.creatorEmail}`);
    console.log(`  specialistId: ${website.specialistId}`);
    console.log(`  Full doc:`, JSON.stringify(website.toObject(), null, 2));

    const user = await User.findOne({ email: website.creatorEmail });
    console.log('\nUser found:');
    console.log(`  _id: ${user._id}`);
    console.log(`  _id type: ${typeof user._id}`);
    console.log(`  _id toString: ${user._id.toString()}`);
    console.log(`  email: ${user.email}`);

    // Try direct update
    console.log('\n🔧 Attempting direct update...');
    const userIdValue = user._id;
    console.log(`   Setting specialistId to: ${userIdValue}`);
    
    const updated = await Website.findByIdAndUpdate(
      website._id,
      { $set: { specialistId: userIdValue } },
      { new: true }
    );

    console.log(`\n✅ After update:`);
    console.log(`   specialistId: ${updated.specialistId}`);
    console.log(`   Full doc:`, JSON.stringify(updated.toObject(), null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

debugWebsite();
