import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define CreatorProfile schema inline (simplified)
const creatorProfileSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    creatorName: String,
    specialization: String,
    stripeAccountId: String,
    stripeConnectStatus: {
      type: String,
      enum: ['not_connected', 'pending', 'active'],
      default: 'not_connected',
    },
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
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Option 1: Update ALL specialist profiles with test account
    console.log('\n📋 Finding all specialist profiles...');
    const allSpecialists = await CreatorProfile.find({});
    console.log(`Found ${allSpecialists.length} specialist profiles`);

    if (allSpecialists.length > 0) {
      console.log('\n🔄 Updating all specialists with test Stripe account...');
      const result = await CreatorProfile.updateMany(
        {},
        {
          stripeAccountId: TEST_STRIPE_ACCOUNT_ID,
          stripeConnectStatus: 'active',
          commissionPercentage: 15,
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} specialist profiles`);
      console.log(`   Stripe Account ID: ${TEST_STRIPE_ACCOUNT_ID}`);
      console.log(`   Status: active`);
      console.log(`   Commission: 15%`);
    }

    // Show updated specialists
    console.log('\n📊 Updated Specialists:');
    const updated = await CreatorProfile.find({
      stripeAccountId: TEST_STRIPE_ACCOUNT_ID,
    }).select('creatorName email stripeConnectStatus');
    
    updated.forEach((specialist) => {
      console.log(`  • ${specialist.creatorName} (${specialist.email}) - ${specialist.stripeConnectStatus}`);
    });

    console.log('\n✅ Setup complete! You can now test course enrollment with payment.');
    console.log(`\nTest card numbers to use:`);
    console.log(`  ✓ Success: 4242 4242 4242 4242`);
    console.log(`  ✗ Decline: 4000 0000 0000 0002`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupTestStripeAccounts();
