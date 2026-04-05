import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const BACKEND_URL = process.env.BACKEND_URL || 'https://staging.specialistly.com/api';
const email = 'sivakumarganeshm@gmail.com';
const password = 'StagingTest123!';

console.log('🔍 Testing Token Flow for Staging Login\n');
console.log('Configuration:');
console.log(`  Backend URL: ${BACKEND_URL}`);
console.log(`  Email: ${email}`);
console.log(`  JWT Secret in .env.staging: ${process.env.JWT_SECRET}\n`);

try {
  // Step 1: Login
  console.log('📝 Step 1: Login...');
  const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
    email,
    password,
  });

  const { token, user, userType } = loginResponse.data;
  
  console.log('✅ Login successful!');
  console.log(`   Token: ${token.substring(0, 50)}...`);
  console.log(`   User Type: ${userType}`);
  console.log(`   User Role: ${user.role}`);
  console.log(`   User Email: ${user.email}\n`);

  // Step 2: Use token to access admin endpoint
  console.log('🔐 Step 2: Testing Admin Endpoints with Token...');
  
  const adminResponse = await axios.get(`${BACKEND_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('✅ Admin Stats Endpoint Works!');
  console.log(`   Response: ${JSON.stringify(adminResponse.data, null, 2).substring(0, 200)}...\n`);

  // Step 3: Test admin/users
  console.log('🔐 Step 3: Testing Admin Users Endpoint...');
  
  const usersResponse = await axios.get(`${BACKEND_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('✅ Admin Users Endpoint Works!');
  console.log(`   Found ${usersResponse.data.users?.length || 0} users`);
  console.log(`   Total: ${usersResponse.data.total || 0}\n`);

  console.log('✅ ALL TESTS PASSED - Token flow is working correctly!');
  console.log('\n📋 Use these credentials to login:');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   URL:      https://staging.specialistly.com/login`);
  
} catch (error) {
  console.error('❌ Error during token flow test:\n');
  
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Message: ${error.response.data?.error || error.response.statusText}`);
    console.error(`Full Response: ${JSON.stringify(error.response.data, null, 2)}`);
  } else if (error.message) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error(error);
  }
  
  console.error('\n⚠️  Troubleshooting:');
  console.error('  1. Check if backend is running');
  console.error('  2. Verify BACKEND_URL is correct');
  console.error('  3. Check email/password are correct');
  console.error('  4. Verify JWT_SECRET in .env.staging matches staging backend');
}
