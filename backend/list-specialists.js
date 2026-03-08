import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const creatorProfileSchema = new mongoose.Schema(
  {
    creatorName: String,
    email: String,
    bio: String,
    stripeAccountId: String,
    stripeConnectStatus: String,
    commissionPercentage: Number,
  },
  { collection: 'creatorprofiles' }
);

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);

async function listSpecialists() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const specialists = await CreatorProfile.find({}).select('creatorName email stripeConnectStatus');
    
    console.log(`📋 Found ${specialists.length} specialist(s):\n`);
    if (specialists.length === 0) {
      console.log('   (none found)');
    } else {
      specialists.forEach((s) => {
        console.log(`   • ${s.creatorName} (${s.email})`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listSpecialists();
