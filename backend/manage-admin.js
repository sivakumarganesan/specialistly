// Usage: node manage-admin.js <action> [email]
// Actions: 
//   - create (creates staging admin user)
//   - promote <email> (promotes existing user to admin)
//   - check (lists all admin users)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = process.env.NODE_ENV || 'staging';
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

const MONGODB_URI = process.env.MONGODB_URI;
const action = process.argv[2];
const email = process.argv[3];

if (!MONGODB_URI) {
  console.error(`❌ No MONGODB_URI found in .env.${env}`);
  process.exit(1);
}

async function manageAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to ${env} database\n`);

    switch (action) {
      case 'create': {
        const adminEmail = 'admin@staging.specialistly.local';
        const adminName = 'Staging Admin';
        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
          admin = new User({
            name: adminName,
            email: adminEmail,
            password: 'StagingAdmin123!',
            role: 'admin',
            membership: 'pro',
            subscription: {
              planType: 'pro',
              status: 'active',
              billingCycle: 'forever',
              features: ['Unlimited courses', 'Advanced analytics', 'Priority support'],
            },
          });
          await admin.save();
          console.log('✅ Created staging admin user');
        } else if (admin.role !== 'admin') {
          admin.role = 'admin';
          await admin.save();
          console.log('✅ Promoted user to admin');
        } else {
          console.log('✅ Admin user already exists');
        }

        console.log('\n📋 Admin Login:');
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: StagingAdmin123!`);
        break;
      }

      case 'promote': {
        if (!email) {
          console.error('❌ Please provide email: node manage-admin.js promote <email>');
          process.exit(1);
        }
        const user = await User.findOne({ email });
        if (!user) {
          console.error(`❌ No user found with email: ${email}`);
          process.exit(1);
        }
        user.role = 'admin';
        await user.save();
        console.log(`✅ User promoted to admin: ${email}`);
        break;
      }

      case 'check': {
        const admins = await User.find({ role: 'admin' }).select('name email createdAt');
        if (admins.length === 0) {
          console.log('⚠️  No admin users found');
        } else {
          console.log(`✅ Found ${admins.length} admin user(s):\n`);
          admins.forEach(admin => {
            console.log(`   • ${admin.name} (${admin.email})`);
            console.log(`     Created: ${admin.createdAt.toLocaleDateString()}\n`);
          });
        }
        break;
      }

      default:
        console.log('Usage:');
        console.log('  node manage-admin.js create            (Create staging admin)');
        console.log('  node manage-admin.js promote <email>   (Promote user to admin)');
        console.log('  node manage-admin.js check             (List admin users)');
        process.exit(1);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

manageAdmin();
