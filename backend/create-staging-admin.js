// Usage: node create-staging-admin.js
// Creates or promotes an admin user for staging environment

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ No MONGODB_URI found in .env.staging');
  process.exit(1);
}

async function createStagingAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to staging database');

    // Admin credentials for staging
    const adminEmail = 'admin@staging.specialistly.local';
    const adminPassword = 'StagingAdmin123!';
    const adminName = 'Staging Admin';

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      // Ensure role is admin
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log('   Updated role to admin');
      }
    } else {
      // Create new admin user
      admin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        membership: 'pro',
        subscription: {
          planType: 'pro',
          status: 'active',
          billingCycle: 'forever',
          features: ['Unlimited courses', 'Advanced analytics', 'Priority support', 'Custom branding'],
        },
        isSpecialist: false,
      });

      await admin.save();
      console.log(`✅ Created admin user for staging`);
    }

    console.log('\n📋 Staging Admin Credentials:');
    console.log('─────────────────────────────────────');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('URL:      https://staging.specialistly.com/login');
    console.log('─────────────────────────────────────');

    await mongoose.disconnect();
    console.log('✅ Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createStagingAdmin();
