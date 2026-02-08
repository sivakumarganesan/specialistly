import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import CreatorProfile from './models/CreatorProfile.js';

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('✓ Cleared existing users');

    // Create test specialist
    const specialistData = {
      name: 'John Specialist',
      email: 'specialist@test.com',
      password: 'password123',
      isSpecialist: true,
      role: 'specialist',
      membership: 'pro',
    };

    const specialist = new User(specialistData);
    await specialist.save();
    console.log(`✓ Created specialist: ${specialist.email}`);

    // Create specialist profile
    await CreatorProfile.deleteMany({ email: specialistData.email });
    const profile = new CreatorProfile({
      creatorName: specialistData.name,
      email: specialistData.email,
      bio: 'Professional specialist',
      phone: '+1-555-0100',
      location: 'San Francisco, CA',
      company: 'Specialist Inc',
      website: 'https://specialist.com',
      profileImage: null,
      weeklyAvailability: [
        { day: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Saturday', enabled: false, startTime: '', endTime: '' },
        { day: 'Sunday', enabled: false, startTime: '', endTime: '' },
      ],
    });
    await profile.save();
    console.log(`✓ Created specialist profile`);

    // Create test customer
    const customerData = {
      name: 'Jane Customer',
      email: 'customer@test.com',
      password: 'password123',
      isSpecialist: false,
      role: 'user',
      membership: 'free',
    };

    const customer = new User(customerData);
    await customer.save();
    console.log(`✓ Created customer: ${customer.email}`);

    console.log('\n✓ Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('─────────────────────────────');
    console.log('Specialist:');
    console.log(`  Email: specialist@test.com`);
    console.log(`  Password: password123`);
    console.log('\nCustomer:');
    console.log(`  Email: customer@test.com`);
    console.log(`  Password: password123`);
    console.log('─────────────────────────────');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
