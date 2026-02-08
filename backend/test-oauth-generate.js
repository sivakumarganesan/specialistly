import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserOAuthToken from './models/UserOAuthToken.js';
import User from './models/User.js';
import userManagedOAuthService from './services/userManagedOAuthService.js';

dotenv.config();

async function testOAuthFlow() {
  try {
    console.log('\n🧪 TESTING OAUTH TOKEN SAVE FLOW\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Get specialist
    const specialist = await User.findOne({ email: 'sivakumarganeshm@gmail.com' });
    if (!specialist) {
      console.error('❌ Specialist not found');
      process.exit(1);
    }
    
    console.log(`\n👤 Testing with specialist: ${specialist.name} (${specialist._id})`);
    
    // Step 1: Generate authorization URL
    console.log('\n📋 Step 1: Generate Authorization URL');
    const authResult = await userManagedOAuthService.generateAuthorizationUrl(specialist._id.toString());
    
    if (!authResult.success) {
      console.error(`❌ Failed to generate URL: ${authResult.error}`);
      process.exit(1);
    }
    
    console.log(`✓ Authorization URL generated`);
    console.log(`  State: ${authResult.state.substring(0, 20)}...`);
    
    // Verify state was saved
    let tokenRecord = await UserOAuthToken.findOne({ userId: specialist._id });
    if (!tokenRecord) {
      console.error('❌ Token record NOT created!');
      process.exit(1);
    }
    
    console.log(`✓ Token record created in database`);
    console.log(`  State stored: ${tokenRecord.oauthState.substring(0, 20)}...`);
    console.log(`  Status: zoomAccessToken=${tokenRecord.zoomAccessToken}, isActive=${tokenRecord.isActive}`);
    
    console.log('\n✅ AUTHORIZATION URL GENERATION: SUCCESS');
    console.log(`\n📌 User should visit this URL:`);
    console.log(`   ${authResult.authUrl}\n`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testOAuthFlow();
