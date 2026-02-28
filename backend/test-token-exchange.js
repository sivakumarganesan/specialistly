import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testTokenExchange() {
  try {
    console.log('\n🧪 TESTING ZOOM TOKEN EXCHANGE\n');
    
    const ZOOM_OAUTH_BASE = 'https://zoom.us/oauth';
    const ZOOM_CLIENT_ID = process.env.ZOOM_USER_MANAGED_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_USER_MANAGED_CLIENT_SECRET;
    const REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || 'http://localhost:5001/api/zoom/oauth/user-callback';
    
    console.log('Configuration:');
    console.log(`  Client ID: ${ZOOM_CLIENT_ID?.substring(0, 10)}...`);
    console.log(`  Client Secret: ${ZOOM_CLIENT_SECRET?.substring(0, 10)}...`);
    console.log(`  Redirect URI: ${REDIRECT_URI}`);
    console.log(`  Token URL: ${ZOOM_OAUTH_BASE}/token`);
    
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      console.error('\n❌ ERROR: Missing ZOOM_USER_MANAGED_CLIENT_ID or ZOOM_USER_MANAGED_CLIENT_SECRET in .env');
      process.exit(1);
    }
    
    console.log('\n📝 Note: This test cannot exchange without a real Zoom authorization code.');
    console.log('   The code expires after the user completes OAuth authorization.\n');
    
    console.log('🔍 Testing what WOULD happen during token exchange:\n');
    
    // Test with a dummy code to see what error we get
    const dummyCode = 'dummy_code_for_testing';
    
    console.log(`Attempting token exchange with dummy code: ${dummyCode}`);
    
    try {
      const response = await axios.post(`${ZOOM_OAUTH_BASE}/token`, null, {
        params: {
          grant_type: 'authorization_code',
          code: dummyCode,
          redirect_uri: REDIRECT_URI,
        },
        auth: {
          username: ZOOM_CLIENT_ID,
          password: ZOOM_CLIENT_SECRET,
        },
      });
      
      console.log('✓ Response:', response.data);
    } catch (exchangeError) {
      console.log('\n❌ Token Exchange Error (expected with dummy code):');
      console.log(`   Status: ${exchangeError.response?.status}`);
      console.log(`   Error Type: ${exchangeError.response?.data?.error}`);
      console.log(`   Error Description: ${exchangeError.response?.data?.error_description}`);
      console.log(`   Full Response:`, exchangeError.response?.data);
      
      if (exchangeError.response?.status === 400 && exchangeError.response?.data?.error === 'invalid_request') {
        console.log('\n💡 Possible causes:');
        console.log('   1. Redirect URI mismatch with Zoom App config');
        console.log('   2. Wrong Client ID or Client Secret');
        console.log('   3. Client app is not a User-Managed OAuth app');
        console.log('   4. The authorization code is invalid/expired');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testTokenExchange();
