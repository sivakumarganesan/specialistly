import mongoose from 'mongoose';
import AppointmentSlot from './models/AppointmentSlot.js';

async function testSlots() {
  try {
    await mongoose.connect('mongodb://localhost:27017/specialistdb');
    console.log('✓ Connected to MongoDB');

    // Check all slots
    const allSlots = await AppointmentSlot.find({}).limit(3);
    console.log('\n📋 All Slots (first 3):');
    allSlots.forEach(slot => {
      console.log(`  - Date: ${slot.date}, Status: ${slot.status}, Specialist: ${slot.specialistEmail}`);
    });

    // Check slots for specific specialist
    const specialistEmail = 'sivakumarganeshm@gmail.com';
    const specialistSlots = await AppointmentSlot.find({ specialistEmail });
    console.log(`\n👤 Slots for ${specialistEmail}: ${specialistSlots.length} found`);
    specialistSlots.slice(0, 3).forEach(slot => {
      console.log(`  - ${slot.date} ${slot.startTime}-${slot.endTime}`);
    });

    // Check slots with status available
    const availableSlots = await AppointmentSlot.find({ status: 'available' }).limit(3);
    console.log(`\n✅ Available Slots (first 3): ${availableSlots.length} total`);
    availableSlots.forEach(slot => {
      console.log(`  - Date: ${slot.date}, Specialist: ${slot.specialistEmail}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSlots();
