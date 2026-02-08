import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Test data - specialist and customer from the system
const SPECIALIST_ID = '697cce4d3bb262478fd88832'; // sivakumarganeshm@gmail.com
const CUSTOMER_ID = '697cce4e3bb262478fd88836';  // sinduja.vel@gmail.com

async function testBooking() {
  try {
    console.log('\n🔍 TESTING BOOKING WITH ZOOM\n');

    // 1. Get available slots
    console.log('1️⃣  Fetching available appointment slots...');
    const slotsResponse = await axios.get(`${API_URL}/appointments/available`);
    const slots = slotsResponse.data.data || [];
    
    if (slots.length === 0) {
      console.log('❌ No available slots found');
      return;
    }

    const slotId = slots[0]._id;
    console.log(`✓ Found slot: ${slots[0].date} at ${slots[0].startTime}`);

    // 2. Attempt booking
    console.log('\n2️⃣  Attempting to book appointment...');
    const bookingResponse = await axios.post(`${API_URL}/appointments/book/${slotId}`, {
      bookedBy: CUSTOMER_ID,
      customerEmail: 'sinduja.vel@gmail.com',
      customerName: 'Sinduja Vel',
      specialistId: SPECIALIST_ID,
      specialistEmail: 'sivakumarganeshm@gmail.com',
      specialistName: 'Sivakumar Ganeshm',
      serviceTitle: 'Consulting Session'
    });

    console.log('✓ Booking response:', bookingResponse.data.message);
    
    if (bookingResponse.data.zoomMeeting) {
      console.log('✓ Zoom meeting created:', bookingResponse.data.zoomMeeting.join_url);
    } else {
      console.log('⚠️  No Zoom meeting created');
    }

    // 3. Check email was sent
    if (bookingResponse.data.emailSent) {
      console.log('✓ Email invitation sent');
    } else {
      console.log('❌ Email invitation NOT sent');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.message || error.message);
  }

  process.exit(0);
}

testBooking();
