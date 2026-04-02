// Usage: node promote-admin.js <email>
// Promotes an existing user to admin role

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const email = process.argv[2];

if (!email) {
  console.error('Usage: node promote-admin.js <email>');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('No MONGODB_URI found in environment');
  process.exit(1);
}

try {
  await mongoose.connect(MONGODB_URI);
  const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
    { email },
    { $set: { role: 'admin' } },
    { returnDocument: 'after' }
  );

  if (result) {
    console.log(`✅ User "${result.name}" (${result.email}) promoted to admin`);
  } else {
    console.error(`❌ No user found with email: ${email}`);
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await mongoose.disconnect();
}
