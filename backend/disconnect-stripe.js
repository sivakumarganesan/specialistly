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
    stripeConnectUrl: String,
    stripeOnboardingExpires: Date,
    commissionPercentage: Number,
  },
  { collection: 'creatorprofiles' }
);

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);

async function disconnectStripe() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the specialist
    const specialist = await CreatorProfile.findOne({ 
      email: 'sivakumarganeshm@gmail.com' 
    });

    if (!specialist) {
      console.log('❌ Specialist not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📋 Current Status:');
    console.log(`   Name: ${specialist.creatorName}`);
    console.log(`   Email: ${specialist.email}`);
    console.log(`   Stripe Account: ${specialist.stripeAccountId || 'Not connected'}`);
    console.log(`   Status: ${specialist.stripeConnectStatus}\n`);

    if (!specialist.stripeAccountId) {
      console.log('ℹ️  Already disconnected - no Stripe account to remove');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Reset Stripe connection
    console.log('🔄 Disconnecting Stripe account...\n');
    specialist.stripeAccountId = null;
    specialist.stripeConnectStatus = 'not_connected';
    specialist.stripeConnectUrl = null;
    specialist.stripeOnboardingExpires = null;
    await specialist.save();

    console.log('✅ Stripe account disconnected!\n');
    console.log('📋 New Status:');
    console.log(`   Stripe Account: Not connected`);
    console.log(`   Status: not_connected\n`);

    console.log('✨ Specialist can now connect a new Stripe account!');
    console.log('\nNext steps:');
    console.log('1. Specialist logs in to the app');
    console.log('2. Go to Settings/Stripe Connection');
    console.log('3. Click "Connect Stripe Account"');
    console.log('4. Complete Stripe onboarding with test account');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

disconnectStripe();
