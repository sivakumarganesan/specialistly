import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

console.log('🔍 COMPREHENSIVE ADMIN ACCESS DIAGNOSTIC\n');
console.log('═'.repeat(60));

const BACKEND_URL = 'https://staging.specialistly.com/api';
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

try {
  // ===== STEP 1: Test Login =====
  console.log('\n📝 STEP 1: Test Login...');
  const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
    email: 'sivakumarganeshm@gmail.com',
    password: 'StagingTest123!',
  });
  
  const token = loginRes.data.token;
  const userType = loginRes.data.userType;
  console.log(`   ✅ Login successful`);
  console.log(`   User Type: ${userType}`);
  console.log(`   Token: ${token.substring(0, 40)}...\n`);

  // ===== STEP 2: Decode JWT =====
  console.log('📝 STEP 2: Decode JWT...');
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  console.log(`   userId: ${payload.userId}`);
  console.log(`   email: ${payload.email}\n`);

  // ===== STEP 3: Verify JWT Signature =====
  console.log('📝 STEP 3: Verify JWT Signature...');
  console.log(`   JWT_SECRET: ${JWT_SECRET}`);
  console.log(`   JWT_SECRET length: ${JWT_SECRET.length}`);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`   ✅ JWT signature valid!\n`);
  } catch (error) {
    console.log(`   ❌ JWT signature INVALID: ${error.message}\n`);
    console.log(`   This means Railroad backend is using a DIFFERENT JWT_SECRET`);
    console.log(`   Backend secret ≠ env.staging secret\n`);
  }

  // ===== STEP 4: Test Admin Endpoint =====
  console.log('📝 STEP 4: Test Admin Endpoint...');
  try {
    const adminRes = await axios.get(`${BACKEND_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   ✅ Admin stats endpoint works!\n`);
  } catch (error) {
    console.log(`   ❌ Admin stats endpoint failed`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.error}\n`);
  }

  // ===== STEP 5: Check Database Connection =====
  console.log('📝 STEP 5: Check Staging Database Connection...');
  console.log(`   MongoDB URI (host): ${MONGODB_URI?.substring(0, 50)}...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`   ✅ Connected to MongoDB\n`);

  // ===== STEP 6: Check User in Database =====
  console.log('📝 STEP 6: Check User in Database...');
  const allUsers = await User.find().select('_id email role').limit(5);
  console.log(`   Found ${allUsers.length} users:\n`);
  allUsers.forEach(u => {
    console.log(`      ID: ${u._id}`);
    console.log(`      Email: ${u.email}`);
    console.log(`      Role: ${u.role}\n`);
  });

  // ===== STEP 7: Check Specific Admin User =====
  console.log('📝 STEP 7: Check Specific Admin User...');
  const adminUser = await User.findOne({ email: 'sivakumarganeshm@gmail.com' });
  if (adminUser) {
    console.log(`   ✅ Admin user found in staging database`);
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}\n`);
  } else {
    console.log(`   ❌ Admin user NOT found in staging database!\n`);
  }

  // ===== STEP 8: Simulate Middleware =====
  console.log('📝 STEP 8: Simulate Admin Middleware Logic...');
  console.log(`   Looking up user with ID: ${payload.userId}`);
  const middlewareUser = await User.findById(payload.userId).select('role email name');
  
  if (!middlewareUser) {
    console.log(`   ❌ FAILED: User.findById() returned null!`);
    console.log(`   This is why middleware rejects with 403\n`);
  } else {
    console.log(`   ✅ User found!`);
    console.log(`   Role: ${middlewareUser.role}`);
    if (middlewareUser.role === 'admin') {
      console.log(`   ✅ User IS admin - should pass middleware!\n`);
    } else {
      console.log(`   ❌ User is NOT admin (role=${middlewareUser.role})\n`);
    }
  }

  // ===== SUMMARY =====
  console.log('\n' + '═'.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY:\n');
  
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.userId).select('role email name');
  
  if (decoded && user && user.role === 'admin') {
    console.log('✅ ALL CHECKS PASSED - Should work!');
    console.log('   If still 403, clear browser cache and restart');
  } else if (!user) {
    console.log('❌ PROBLEM: User.findById() returns null');
    console.log('   This means Mongoose can\'t find the user');
    console.log('   Solutions:');
    console.log('   1. Check Railroad is connected to correct MongoDB');
    console.log('   2. Verify collection name is "users" (lowercase)');
    console.log('   3. Check mongoDB indexes');
  } else if (user.role !== 'admin') {
    console.log(`❌ PROBLEM: User role is "${user.role}", not "admin"`);
    console.log('   Need to promote user to admin');
  }

  await mongoose.disconnect();

} catch (error) {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error);
}
