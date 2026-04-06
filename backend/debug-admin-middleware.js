import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

console.log('🔍 Simulating adminMiddleware Execution\n');

const BACKEND_URL = process.env.BACKEND_URL || 'https://staging.specialistly.com/api';
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

try {
  // Step 1: Login to get a real token
  console.log('📝 Step 1: Get token from login...');
  const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
    email: 'sivakumarganeshm@gmail.com',
    password: 'StagingTest123!',
  });

  const token = loginResponse.data.token;
  console.log(`✅ Token obtained\n`);

  // Step 2: Decode the token
  console.log('📝 Step 2: Decode JWT...');
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(`   userId: ${decoded.userId}`);
  console.log(`   email: ${decoded.email}\n`);

  // Step 3: Connect to database and do what middleware does
  console.log('📝 Step 3: Connect to MongoDB and lookup user...');
  await mongoose.connect(MONGODB_URI);
  console.log('   ✅ Connected to MongoDB\n');

  console.log('📝 Step 4: Execute User.findById(decoded.userId)...');
  const user = await User.findById(decoded.userId).select('role email name');
  
  if (!user) {
    console.log('   ❌ FAILURE: User not found!');
    console.log(`   Searched for ID: ${decoded.userId}`);
    console.log(`   User is: null\n`);

    // Debug: Check all users
    console.log('📊 Debugging - All users in DB:');
    const allUsers = await User.find().select('_id email role');
    allUsers.forEach(u => {
      console.log(`   _id: ${u._id}, email: ${u.email}, role: ${u.role}`);
    });
  } else {
    console.log(`   ✅ User found!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);

    // Step 5: Check role
    console.log('📝 Step 5: Role check...');
    if (!user || user.role !== 'admin') {
      console.log(`   ❌ FAILURE: Role is not admin`);
      console.log(`   user.role = "${user.role}"`);
      console.log(`   user.role !== 'admin' = ${user.role !== 'admin'}`);
    } else {
      console.log('   ✅ SUCCESS: User has admin role!');
    }
  }

  await mongoose.disconnect();

} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.response?.data) {
    console.error('Response:', error.response.data);
  }
}
