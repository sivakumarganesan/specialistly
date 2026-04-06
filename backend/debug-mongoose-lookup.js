import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const MONGODB_URI = process.env.MONGODB_URI;
const userId = '69865d068842af4984f76dba'; // From previous check

console.log('🔍 Debugging Mongoose User Lookup\n');
console.log('Configuration:');
console.log(`  MongoDB URI: ${MONGODB_URI?.substring(0, 50)}...`);
console.log(`  User ID: ${userId}\n`);

try {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to staging with Mongoose\n');

  // Test 1: Find user by ID using Mongoose
  console.log('📋 Test 1: User.findById()...');
  const user = await User.findById(userId).select('role email name');
  console.log(`   Role: ${user?.role}`);
  console.log(`   Email: ${user?.email}`);
  console.log(`   Name: ${user?.name}`);
  console.log(`   ✅ User found\n`);

  // Test 2: Raw database query
  console.log('📋 Test 2: Raw database query...');
  const db = mongoose.connection.db;
  const rawUser = await db.collection('users').findOne({ _id: mongoose.Types.ObjectId.createFromHexString(userId) });
  console.log(`   Role: ${rawUser?.role}`);
  console.log(`   Email: ${rawUser?.email}`);
  console.log(`   ✅ Raw query works\n`);

  // Test 3: Check role comparison
  console.log('📋 Test 3: Role Comparison...');
  console.log(`   User role value: "${user.role}"`);
  console.log(`   Type: ${typeof user.role}`);
  console.log(`   user.role === 'admin': ${user.role === 'admin'}`);
  console.log(`   user.role !== 'admin': ${user.role !== 'admin'}\n`);

  if (user.role === 'admin') {
    console.log('✅ Role check passes - user is admin');
  } else {
    console.log('❌ Role check fails - user is NOT admin');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
}

await mongoose.disconnect();
