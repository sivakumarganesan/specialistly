import axios from 'axios';

async function testCallback() {
  try {
    console.log('\n🧪 TESTING MANUAL OAUTH CALLBACK\n');
    
    // This will simulate what Zoom would send back after user authorizes
    // NOTE: This requires a real Zoom authorization code, which we won't have
    // But we can test the error handling
    
    const testUrl = 'http://localhost:5001/api/zoom/oauth/user-callback';
    console.log(`Testing callback endpoint: ${testUrl}`);
    console.log(`\n⚠️  NOTE: This test will fail because we need a real Zoom authorization code.`);
    console.log(`\nTo properly test:`);
    console.log(`1. Go to the browser and navigate to: http://localhost:5173`);
    console.log(`2. Login as specialist (sivakumarganeshm@gmail.com / password123)`);
    console.log(`3. Go to Settings → Zoom Integration`);
    console.log(`4. Click "Connect Zoom Account"`);
    console.log(`5. Complete Zoom OAuth authorization`);
    console.log(`6. You should see "Zoom Connected" in the UI`);
    console.log(`\nIf it's not working, check:`);
    console.log(`- Did Zoom redirect back to localhost:5001?`);
    console.log(`- Check server logs for "OAuth Callback received" message`);
    console.log(`- If not appearing, the redirect URL might not be whitelisted in Zoom app\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCallback();
