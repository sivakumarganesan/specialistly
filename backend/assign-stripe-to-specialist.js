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
const TARGET_EMAIL = 'sivakumarganeshm@gmail.com';

async function assignTestStripeAccount() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly';
    console.log(`🔌 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the specialist by email
    console.log(`📋 Looking for specialist: ${TARGET_EMAIL}`);
    const specialist = await CreatorProfile.findOne({ email: TARGET_EMAIL });

    if (!specialist) {
      console.log(`❌ No specialist found with email: ${TARGET_EMAIL}\n`);
      console.log('Available specialists:');
      const allSpecialists = await CreatorProfile.find({}).select('creatorName email');
      if (allSpecialists.length === 0) {
        console.log('  (none found)');
      } else {
        allSpecialists.forEach((s) => {
          console.log(`  • ${s.creatorName} (${s.email})`);
        });
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`✅ Found specialist: ${specialist.creatorName}\n`);

    // Show before state
    console.log('📊 Before Update:');
    console.log(`   Name: ${specialist.creatorName}`);
    console.log(`   Email: ${specialist.email}`);
    console.log(`   Stripe Account: ${specialist.stripeAccountId || '(not connected)'}`);
    console.log(`   Status: ${specialist.stripeConnectStatus}\n`);

    // Update with test account
    console.log(`🔄 Assigning test Stripe account...`);
    specialist.stripeAccountId = TEST_STRIPE_ACCOUNT_ID;
    specialist.stripeConnectStatus = 'active';
    specialist.commissionPercentage = 15;
    await specialist.save();

    console.log(`✅ Successfully assigned!\n`);

    // Show after state
    console.log('📊 After Update:');
    console.log(`   Name: ${specialist.creatorName}`);
    console.log(`   Email: ${specialist.email}`);
    console.log(`   Stripe Account: ${specialist.stripeAccountId}`);
    console.log(`   Status: ${specialist.stripeConnectStatus}`);
    console.log(`   Commission: ${specialist.commissionPercentage}%\n`);

    console.log('✨ Ready to test payments!');
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

assignTestStripeAccount();
