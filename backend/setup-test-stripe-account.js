import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas
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

async function setupTestStripeAccounts() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly';
    console.log(`🔌 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check for existing specialist profiles
    console.log('📋 Checking specialist profiles...');
    const allSpecialists = await CreatorProfile.find({});
    console.log(`Found: ${allSpecialists.length} specialist profiles\n`);

    if (allSpecialists.length === 0) {
      console.log('⚠️  No specialist profiles found in database.');
      console.log('\nTo create a test specialist:');
      console.log('1. Sign up as a specialist on the frontend');
      console.log('2. Re-run this script to assign Stripe account');
      console.log('\nOr manually insert a CreatorProfile document with email matching a user.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show existing specialists
    console.log('👥 Existing Specialists:');
    allSpecialists.forEach((s) => {
      console.log(`  • ${s.creatorName} (${s.email})`);
      if (s.stripeAccountId) {
        console.log(`    └─ Stripe: ${s.stripeAccountId} [${s.stripeConnectStatus}]`);
      } else {
        console.log(`    └─ Stripe: Not connected`);
      }
    });

    // Update all with test account
    console.log(`\n🔄 Assigning test Stripe account to all specialists...`);
    const result = await CreatorProfile.updateMany(
      {},
      {
        stripeAccountId: TEST_STRIPE_ACCOUNT_ID,
        stripeConnectStatus: 'active',
        commissionPercentage: 15,
      }
    );
    
    console.log(`✅ Updated: ${result.modifiedCount} specialist(s)`);
    console.log(`   Account ID: ${TEST_STRIPE_ACCOUNT_ID}`);
    console.log(`   Status: active`);
    console.log(`   Commission: 15%\n`);

    // Show updated list
    console.log('✅ Final Specialist Setup:');
    const updated = await CreatorProfile.find({});
    updated.forEach((s) => {
      console.log(`  • ${s.creatorName} (${s.email})`);
      console.log(`    └─ Stripe: ${s.stripeAccountId} [${s.stripeConnectStatus}]`);
    });

    console.log('\n✨ Stripe test setup complete!');
    console.log('\n💳 Test card numbers:');
    console.log(`  ✓ Charge succeeds:  4242 4242 4242 4242`);
    console.log(`  ✗ Charge declines:  4000 0000 0000 0002`);
    console.log(`  ⚠️  Requires auth:    4000 0027 8000 3184`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupTestStripeAccounts();
