import mongoose from 'mongoose';
import AppointmentSlot from './models/AppointmentSlot.js';

const MONGO_URI = 'mongodb+srv://specialistlyapp:Specialistly83@specialistdb.w3t1w.mongodb.net/specialistdb?retryWrites=true&w=majority';

async function testBooking() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get first available slot
    const availableSlot = await AppointmentSlot.findOne({ status: 'available' });
    if (!availableSlot) {
      console.error('✗ No available slots found');
      process.exit(1);
    }

    console.log(`\n✓ Found available slot: ${availableSlot._id}`);
    console.log(`  Date: ${availableSlot.date}`);
    console.log(`  Time: ${availableSlot.startTime} - ${availableSlot.endTime}`);

    // Customer details
    const customer = {
      customerEmail: 'sinduja.vel@gmail.com',
      customerName: 'nithya',
      specialistEmail: 'sivakumarganeshm@gmail.com',
      specialistName: 'sivakumar',
      serviceTitle: 'Consulting Session',
    };

    console.log(`\n📞 Booking appointment for:`);
    console.log(`  Customer: ${customer.customerName} (${customer.customerEmail})`);
    console.log(`  Specialist: ${customer.specialistName} (${customer.specialistEmail})`);

    // Make booking request
    const response = await fetch(`http://localhost:5001/api/appointments/book/${availableSlot._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookedBy: customer.customerName,
        ...customer,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`\n✓ Booking successful!`);
      console.log(`  Google Meet Link: ${result.data.googleMeetLink}`);
      console.log(`  Status: ${result.data.status}`);
      console.log(`\n📧 Check ${customer.customerEmail} for the booking invite email!`);
    } else {
      console.error(`✗ Booking failed: ${result.message}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testBooking();
