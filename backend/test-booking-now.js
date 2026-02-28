import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

async function testBooking() {
  try {
    console.log('\n🧪 TESTING BOOKING WITH ZOOM CREATION\n');
    
    // Get available slots
    const slotsRes = await axios.get(`${API_BASE}/appointments/available`);
    const slots = slotsRes.data.data || [];
    
    if (slots.length === 0) {
      console.error('❌ No available slots');
      process.exit(1);
    }
    
    const slot = slots[0];
    console.log(`✓ Available slot: ${slot.date} ${slot.startTime}`);
    
    // Get specialist
    const creatorsRes = await axios.get(`${API_BASE}/creator`);
    const specialist = creatorsRes.data.data.find(c => c.email === 'sivakumarganeshm@gmail.com');
    
    if (!specialist) {
      console.error('❌ Specialist not found');
      process.exit(1);
    }
    
    console.log(`✓ Found specialist: ${specialist.name} (ID: ${specialist._id})`);
    
    // Check if specialist has Zoom token
    console.log('\n📋 Checking specialist Zoom authorization...');
    try {
      const specialistRes = await axios.get(`${API_BASE}/creator/${specialist._id}`);
      console.log(`✓ Specialist record retrieved`);
      
      if (specialistRes.data.data?.zoomAuthToken) {
        console.log(`✓ Zoom token exists: ${specialistRes.data.data.zoomAuthToken.substring(0, 20)}...`);
      } else {
        console.error(`❌ No Zoom token found for specialist!`);
      }
      
      if (specialistRes.data.data?.zoomUserId) {
        console.log(`✓ Zoom User ID: ${specialistRes.data.data.zoomUserId}`);
      }
    } catch (e) {
      console.error(`⚠️  Could not fetch specialist details:`, e.message);
    }
    
    // Now attempt booking
    console.log('\n📤 Attempting booking...');
    const bookingData = {
      bookedBy: 'customer-test-id',
      customerEmail: 'sinduja.vel@gmail.com',
      customerName: 'Sinduja Vel',
      specialistEmail: specialist.email,
      specialistName: specialist.name,
      specialistId: specialist._id,
      serviceTitle: 'Technology Consulting Session',
    };
    
    console.log('Booking payload:', JSON.stringify(bookingData, null, 2));
    
    const bookRes = await axios.put(
      `${API_BASE}/appointments/${slot._id}/book`,
      bookingData
    );
    
    console.log('\n✅ BOOKING RESPONSE:');
    console.log(JSON.stringify(bookRes.data, null, 2));
    
    if (bookRes.data.data?.zoomMeetingId) {
      console.log(`\n✓ Zoom meeting created: ${bookRes.data.data.zoomMeetingId}`);
      console.log(`✓ Join URL: ${bookRes.data.data.zoomJoinUrl}`);
    } else {
      console.log(`\n⚠️  No Zoom meeting in response`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

testBooking();
