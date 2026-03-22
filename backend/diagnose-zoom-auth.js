import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import UserOAuthToken from './models/UserOAuthToken.js';

dotenv.config();

async function diagnoseZoomAuth() {
  try {
    console.log('\n🔍 DIAGNOSING ZOOM AUTHORIZATION STATUS\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Find specialist
    const specialist = await User.findOne({ email: 'sivakumarganeshm@gmail.com' });
    
    if (!specialist) {
      console.error('❌ Specialist user not found');
      process.exit(1);
    }
    
    console.log(`\n👤 Specialist Found:`);
    console.log(`   Name: ${specialist.name}`);
    console.log(`   Email: ${specialist.email}`);
    console.log(`   ID: ${specialist._id}`);
    console.log(`   Zoom Connected Flag: ${specialist.zoomConnected}`);
    console.log(`   Zoom Email: ${specialist.zoomEmail}`);
    console.log(`   Zoom User ID: ${specialist.zoomUserId}`);
    
    // Check OAuth token record
    console.log(`\n🔑 Checking OAuth Token Record...`);
    const tokenRecord = await UserOAuthToken.findOne({ userId: specialist._id });
    
    if (!tokenRecord) {
      console.error(`❌ NO OAUTH TOKEN RECORD FOUND FOR SPECIALIST`);
      console.error(`   This is the problem! Token needs to be created during authorization.`);
      
      // List all token records
      const allTokens = await UserOAuthToken.find({});
      console.log(`\n   Total OAuth records in database: ${allTokens.length}`);
      if (allTokens.length > 0) {
        console.log('   Existing records:');
        allTokens.forEach((t, idx) => {
          console.log(`     ${idx + 1}. User: ${t.userId}, Active: ${t.isActive}`);
        });
      }
    } else {
      console.log(`✓ OAuth Token Record Found`);
      console.log(`   Is Active: ${tokenRecord.isActive}`);
      console.log(`   Is Revoked: ${tokenRecord.isRevoked}`);
      console.log(`   Zoom User ID: ${tokenRecord.zoomUserId}`);
      console.log(`   Zoom Email: ${tokenRecord.zoomEmail}`);
      
      if (tokenRecord.zoomAccessToken && tokenRecord.zoomAccessToken !== 'pending') {
        console.log(`   ✓ Access Token: ${tokenRecord.zoomAccessToken.substring(0, 20)}...`);
      } else {
        console.error(`   ❌ Access Token: ${tokenRecord.zoomAccessToken}`);
      }
      
      if (tokenRecord.zoomRefreshToken && tokenRecord.zoomRefreshToken !== 'pending') {
        console.log(`   ✓ Refresh Token: ${tokenRecord.zoomRefreshToken.substring(0, 20)}...`);
      } else {
        console.error(`   ❌ Refresh Token: ${tokenRecord.zoomRefreshToken}`);
      }
      
      console.log(`   Token Expiry: ${tokenRecord.zoomAccessTokenExpiry}`);
      console.log(`   Granted Scopes: ${tokenRecord.grantedScopes?.join(', ')}`);
    }
    
    console.log('\n');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnoseZoomAuth();
