import https from 'https';
import http from 'http';

const stagingUrl = 'https://staging.specialistly.com';
const testEmail = 'sinduja.vel@gmail.com';

console.log('🔍 Diagnosing Staging Deployment Status\n');

const makeRequest = (url, headers = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

(async () => {
  try {
    console.log('1️⃣  Testing endpoint with X-Customer-Email header...');
    const response = await makeRequest(
      `${stagingUrl}/api/courses/enrollments/self-paced/my-courses`,
      { 'X-Customer-Email': testEmail }
    );
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      const courseCount = response.data.data.length;
      console.log(`\n   ✅ API returned: ${courseCount} courses`);
      
      if (courseCount === 0) {
        console.log('\n   ⚠️  API is working but returning 0 courses');
        console.log('   This means:');
        console.log('   - The ObjectId fix IS deployed (no error thrown)');
        console.log('   - But the backend might still have issues');
        console.log(`   - Or customer "${testEmail}" has no enrollments`);
      } else {
        console.log('\n   ✅ ObjectId fix is working! Found courses.');
      }
    } else if (response.data?.message?.includes('Cast to ObjectId')) {
      console.log('\n   ❌ OLD CODE DETECTED! Casting error indicates ObjectId fix not deployed');
      console.log(`   Error: ${response.data.message}`);
      console.log('\n   Action needed: Restart the backend service on Railway');
    } else {
      console.log('\n   ⚠️  Unexpected response:', response.data);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPossible causes:');
    console.error('- Staging backend is down');
    console.error('- Network connection issue');
    console.error('- Staging URL is incorrect');
  }
})();
