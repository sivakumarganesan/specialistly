import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

console.log('🌐 Websites in Staging Database\n');

const websites = await db.collection('websites').find({}).toArray();
console.log(`Total websites: ${websites.length}\n`);

websites.forEach(w => {
  console.log(`Website: ${w.branding?.siteName || 'Unnamed'}`);
  console.log(`  ID: ${w._id}`);
  console.log(`  Subdomain: ${w.subdomain}`);
  console.log(`  Creator Email: ${w.creatorEmail}`);
  console.log(`  Published: ${w.isPublished}\n`);
});

await mongoose.disconnect();
