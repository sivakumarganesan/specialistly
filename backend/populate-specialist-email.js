import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import AppointmentSlot from './models/AppointmentSlot.js';

async function populateSpecialistEmails() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Set specialist email for all slots (use the default specialist)
    const specialistEmail = 'sivakumarganeshm@gmail.com';
    const specialistId = new mongoose.Types.ObjectId('1234567890abcdef12345678'); // Replace with actual ID if needed
    
    // Check all slots before
    const before = await AppointmentSlot.countDocuments();
    const beforeSpec = await AppointmentSlot.countDocuments({ specialistEmail: specialistEmail });
    console.log(`Before: ${before} total slots, ${beforeSpec} with specialist email`);

    // Update ALL slots to have specialist email (overwrite if needed)
    const result = await AppointmentSlot.updateMany(
      {},
      { 
        $set: { 
          specialistEmail: specialistEmail,
          specialistName: 'Siva Kumar Ganesham'
        } 
      }
    );

    console.log(`✓ Updated ${result.modifiedCount} slots with specialist email`);

    // Verify
    const updatedSlots = await AppointmentSlot.find({ specialistEmail });
    console.log(`✓ Now ${updatedSlots.length} slots have specialist email: ${specialistEmail}`);

    // Check Feb 4 slots
    const feb4Slots = await AppointmentSlot.find({
      specialistEmail,
      date: { $gte: new Date('2026-02-04'), $lt: new Date('2026-02-05') }
    });
    console.log(`✓ Feb 4, 2026 slots: ${feb4Slots.length}`);

    await mongoose.connection.close();
    console.log('✓ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateSpecialistEmails();
