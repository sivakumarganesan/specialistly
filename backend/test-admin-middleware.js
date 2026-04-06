import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const JWT_SECRET = process.env.JWT_SECRET;
const userId = '69865d068842af4984f76dba';

console.log('🔍 Testing Admin Middleware Logic\n');
console.log(`JWT Secret: ${JWT_SECRET}`);
console.log(`User ID: ${userId}\n`);

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to staging\n');

  // Step 1: Create a token like login does
  console.log('📝 Step 1: Creating JWT token...');
  const token = jwt.sign({ userId, email: 'sivakumarganeshm@gmail.com' }, JWT_SECRET, {
    expiresIn: '7d',
  });
  console.log(`   Token: ${token.substring(0, 50)}...\n`);

  // Step 2: Verify token like middleware does
  console.log('📝 Step 2: Verifying token...');
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(`   Decoded userId: ${decoded.userId}`);
  console.log(`   Decoded email: ${decoded.email}\n`);

  // Step 3: Look up user like middleware does
  console.log('📝 Step 3: User.findById(decoded.userId)...');
  const user = await User.findById(decoded.userId).select('role email name');
  console.log(`   User: ${JSON.stringify(user?.toObject?.() || user)}\n`);

  // Step 4: Check role like middleware does
  console.log('📝 Step 4: Role check...');
  if (!user || user.role !== 'admin') {
    console.log(`   ❌ FAILED: user=${user}, role="${user?.role}"`);
    console.log(`   user.role !== 'admin' = ${user?.role !== 'admin'}`);
  } else {
    console.log(`   ✅ PASSED: User is admin`);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}

await mongoose.disconnect();
