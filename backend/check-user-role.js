import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const MONGODB_URI = process.env.MONGODB_URI;

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

const user = await db.collection('users').findOne({ email: 'sivakumarganeshm@gmail.com' });
console.log('User from staging database:');
console.log('  Email:', user?.email);
console.log('  Role:', user?.role);
console.log('  Name:', user?.name);
console.log('  ID:', user?._id);

await mongoose.disconnect();
