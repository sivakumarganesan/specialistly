import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const MONGODB_URI = process.env.MONGODB_URI;
const newPassword = 'StagingTest123!';

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

// Hash the new password
const hashedPassword = await bcrypt.hash(newPassword, 10);

// Update user password
const result = await db.collection('users').findOneAndUpdate(
  { email: 'sivakumarganeshm@gmail.com' },
  { $set: { password: hashedPassword } },
  { returnDocument: 'after' }
);

if (result) {
  console.log('✅ Password reset successful!');
  console.log('\n📋 New Staging Admin Login:');
  console.log(`   Email:    sivakumarganeshm@gmail.com`);
  console.log(`   Password: ${newPassword}`);
  console.log(`   URL:      https://staging.specialistly.com/login`);
} else {
  console.error('❌ User not found');
}

await mongoose.disconnect();
