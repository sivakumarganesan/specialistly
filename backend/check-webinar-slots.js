import mongoose from 'mongoose';
import AppointmentSlot from './models/AppointmentSlot.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkSlots() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(mongoUri, {
      dbName: 'specialistdb',
    });

    console.log('✓ Connected to MongoDB\n');

    // Get all slots
    const allSlots = await AppointmentSlot.find({});
    console.log(`📊 Total slots in database: ${allSlots.length}\n`);

    // Get slots by status
    const availableSlots = await AppointmentSlot.find({ status: 'available' });
    console.log(`✓ Available slots: ${availableSlots.length}`);

    const bookedSlots = await AppointmentSlot.find({ status: 'booked' });
    console.log(`✓ Booked slots: ${bookedSlots.length}\n`);

    // Get unique specialist emails
    const specialists = await AppointmentSlot.distinct('specialistEmail');
    console.log(`👥 Specialist emails in slots:`);
    specialists.forEach(email => console.log(`  - ${email}`));

    // Show sample slots
    console.log(`\n📅 Sample Available Slots:\n`);
    availableSlots.slice(0, 5).forEach((slot, i) => {
      console.log(`${i + 1}. ${new Date(slot.date).toDateString()} ${slot.startTime}-${slot.endTime}`);
      console.log(`   Status: ${slot.status}, Specialist: ${slot.specialistEmail}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSlots();
