import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

console.log('🔍 Finding all admin users in staging\n');

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to staging\n');

  // Find all admin users
  const adminUsers = await User.find({ role: 'admin' }).select('_id name email role');
  
  console.log(`Found ${adminUsers.length} admin users:\n`);
  
  adminUsers.forEach(user => {
    console.log(`  User ID: ${user._id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}\n`);
  });

  // Also check raw database
  console.log('📋 Raw database check:');
  const db = mongoose.connection.db;
  const rawAdmins = await db.collection('users').find({ role: 'admin' }).toArray();
  console.log(`   Found ${rawAdmins.length} admin users in raw collection\n`);
  
  rawAdmins.forEach(user => {
    console.log(`   Email: ${user.email}, Role: ${user.role}, ID: ${user._id}`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
}

await mongoose.disconnect();
