import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

async function testWebinarBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Simulate a webinar booking
    const webinarBooking = {
      customerEmail: 'testcustomer@example.com',
      customerName: 'Test Customer',
      specialistEmail: 'sivakumarganeshm@gmail.com',
      specialistName: 'Sivakumar Ganesan',
      serviceId: '698660268842af4984f76e01',
      serviceTitle: 'Feb 10 profile',
      webinarDate: '2026-02-10',
      webinarTime: '10:00',
      status: 'confirmed',
    };
    
    console.log('Test Webinar Booking Data:');
    console.log(JSON.stringify(webinarBooking, null, 2));
    console.log('\nThis booking would be created as a customer record with:');
    console.log('  - Bookings array entry with the webinar details');
    console.log('  - Specialist added to specialists array');
    console.log('  - Status marked as confirmed');
    
    // Check what a typical customer record looks like
    const customer = await Customer.findOne({ email: 'sinduja.vel@gmail.com' });
    
    console.log('\n\nCurrent Customer Record Sample:');
    console.log(`Email: ${customer?.email}`);
    console.log(`Bookings:`, customer?.bookings);
    console.log(`Specialists:`, customer?.specialists);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWebinarBooking();
