import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import CreatorProfile from './models/CreatorProfile.js';
import ConsultingSlot from './models/ConsultingSlot.js';

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

    // Create default consulting slots
    await ConsultingSlot.deleteMany({ specialistEmail: specialistData.email });
    const now = new Date();
    const slots = [];
    
    // Create 5 slots for the next 5 days
    for (let i = 0; i < 5; i++) {
      const slotDate = new Date(now);
      slotDate.setDate(slotDate.getDate() + i + 1); // Start from tomorrow
      
      const slot = new ConsultingSlot({
        specialistEmail: specialistData.email,
        specialistId: specialist._id,
        date: slotDate,
        startTime: '10:00',
        endTime: '11:00',
        duration: 60, // 60 minutes
        totalCapacity: 1,
        bookedCount: 0,
        status: 'active',
        isFullyBooked: false,
        timezone: 'America/New_York',
      });
      slots.push(slot);
    }
    
    await ConsultingSlot.insertMany(slots);
    console.log(`✓ Created ${slots.length} default consulting slots for specialist`);

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
