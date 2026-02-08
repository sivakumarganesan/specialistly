import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import AppointmentSlot from './models/AppointmentSlot.js';

async function debugSlots() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`🔗 Connecting to: ${mongoUri.substring(0, 50)}...`);
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Check all slots
    const allSlots = await AppointmentSlot.find({});
    console.log(`\n📊 Total slots in database: ${allSlots.length}`);
    
    if (allSlots.length > 0) {
      console.log('\n📋 All slots (first 5):');
      allSlots.slice(0, 5).forEach((slot, i) => {
        console.log(`\n  Slot ${i + 1}:`);
        console.log(`    - Date: ${slot.date}`);
        console.log(`    - Time: ${slot.startTime} - ${slot.endTime}`);
        console.log(`    - Status: ${slot.status}`);
        console.log(`    - Specialist Email: ${slot.specialistEmail}`);
        console.log(`    - Specialist ID: ${slot.specialistId}`);
      });
    }

    // Check slots for specific specialist
    const specialistEmail = 'sivakumarganeshm@gmail.com';
    const specialistSlots = await AppointmentSlot.find({ specialistEmail });
    console.log(`\n\n👤 Slots for ${specialistEmail}: ${specialistSlots.length}`);
    specialistSlots.slice(0, 5).forEach((slot, i) => {
      console.log(`  ${i + 1}. ${slot.date} ${slot.startTime}-${slot.endTime} (${slot.status})`);
    });

    // Check available slots for specialist
    const availableSpecialistSlots = await AppointmentSlot.find({ 
      specialistEmail,
      status: 'available'
    });
    console.log(`\n✅ Available slots for ${specialistEmail}: ${availableSpecialistSlots.length}`);

    // Check all available slots
    const allAvailable = await AppointmentSlot.find({ status: 'available' });
    console.log(`\n🔓 Total available slots in system: ${allAvailable.length}`);

    // Check if any slots have null specialistEmail
    const nullSpecialist = await AppointmentSlot.find({ specialistEmail: null });
    console.log(`\n⚠️  Slots with null specialistEmail: ${nullSpecialist.length}`);

    await mongoose.connection.close();
    console.log('\n✓ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugSlots();
