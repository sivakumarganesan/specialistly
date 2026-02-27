import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const creatorProfileSchema = new mongoose.Schema(
  {
    creatorName: String,
    email: String,
    bio: String,
    stripeAccountId: String,
    stripeConnectStatus: {
      type: String,
      enum: ['pending', 'active', 'disabled', 'not_connected'],
      default: 'not_connected',
    },
    stripeConnectUrl: String,
    commissionPercentage: {
      type: Number,
      default: 15,
    },
  },
  { collection: 'creatorprofiles' }
);

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);

const TEST_STRIPE_ACCOUNT_ID = 'acct_1T5SZG8qxZcRPnJ8';

async function updateAllCreatorProfiles() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly';
    console.log(`🔌 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Count existing profiles
    const existingCount = await CreatorProfile.countDocuments({});
    console.log(`📋 Found: ${existingCount} creator profile(s)\n`);

    if (existingCount === 0) {
      console.log('⚠️  No creator profiles found. Creating test profile...\n');
      await CreatorProfile.create({
        creatorName: 'Test Specialist',
        email: 'sivakumarganeshm@gmail.com',
        bio: 'Test specialist for Stripe integration',
        stripeAccountId: TEST_STRIPE_ACCOUNT_ID,
        stripeConnectStatus: 'active',
        commissionPercentage: 15,
      });
      console.log('✅ Created test creator profile\n');
    }

    // Update ALL profiles
    console.log(`🔄 Assigning test Stripe account to ALL creator profiles...`);
    const result = await CreatorProfile.updateMany(
      {},
      {
        stripeAccountId: TEST_STRIPE_ACCOUNT_ID,
        stripeConnectStatus: 'active',
        commissionPercentage: 15,
      }
    );
    
    console.log(`✅ Updated: ${result.modifiedCount} profile(s)`);
    console.log(`   Account ID: ${TEST_STRIPE_ACCOUNT_ID}`);
    console.log(`   Status: active`);
    console.log(`   Commission: 15%\n`);

    // Show all profiles
    console.log('✅ Final Creator Profiles:');
    const allProfiles = await CreatorProfile.find({});
    allProfiles.forEach((profile) => {
      console.log(`   • ${profile.creatorName} (${profile.email})`);
      console.log(`     └─ Stripe: ${profile.stripeAccountId} [${profile.stripeConnectStatus}]`);
    });

    console.log('\n✨ Stripe test account assigned to all creator profiles!');
    console.log('\n💳 Test card numbers:');
    console.log(`   ✓ Charge succeeds:  4242 4242 4242 4242`);
    console.log(`   ✗ Charge declines:  4000 0000 0000 0002`);
    console.log(`   ⚠️  Requires 2FA:    4000 0027 8000 3184`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateAllCreatorProfiles();
