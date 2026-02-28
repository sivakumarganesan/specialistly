import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

async function testBookingWorkflow() {
  try {
    console.log('\n🧪 TESTING APPOINTMENT BOOKING WORKFLOW\n');
    
    // Step 1: Get available slots
    console.log('1️⃣  Fetching available slots...');
    const slotsRes = await axios.get(`${API_BASE}/appointments/available`);
    const slots = slotsRes.data.data || [];
    
    if (slots.length === 0) {
      console.error('❌ No available slots found');
      return;
    }
    
    const slotToBook = slots[0];
    console.log(`   ✓ Found ${slots.length} slots`);
    console.log(`   📅 Booking slot: ${slotToBook.date} ${slotToBook.startTime}-${slotToBook.endTime}`);
    console.log(`   📍 Slot ID: ${slotToBook._id}`);
    
    // Step 2: Get specialist and customer details
    console.log('\n2️⃣  Fetching specialist details...');
    const creatorsRes = await axios.get(`${API_BASE}/creator`);
    const specialist = creatorsRes.data.data.find(c => c.email === 'sivakumarganeshm@gmail.com');
    
    if (!specialist) {
      console.error('❌ Specialist not found');
      return;
    }
    
    console.log(`   ✓ Found specialist: ${specialist.name}`);
    console.log(`   📧 Email: ${specialist.email}`);
    console.log(`   👤 ID: ${specialist._id}`);
    
    // Step 3: Simulate customer booking
    console.log('\n3️⃣  Booking appointment...');
    const bookingData = {
      bookedBy: 'customer-user-id',
      customerEmail: 'sinduja.vel@gmail.com',
      customerName: 'Sinduja',
      specialistEmail: specialist.email,
      specialistName: specialist.name,
      specialistId: specialist._id,
      serviceTitle: 'Technology Consulting Session',
    };
    
    console.log(`   📤 Sending booking data:`, bookingData);
    
    try {
      const bookRes = await axios.put(
        `${API_BASE}/appointments/${slotToBook._id}/book`,
        bookingData
      );
      
      if (bookRes.data.success) {
        console.log(`   ✅ Booking successful!`);
        console.log(`   🎥 Zoom Meeting ID: ${bookRes.data.data.zoomMeetingId}`);
        console.log(`   🔗 Join URL: ${bookRes.data.data.zoomJoinUrl}`);
        console.log(`   📧 Message: ${bookRes.data.message}`);
      } else {
        console.error(`   ❌ Booking failed: ${bookRes.data.message}`);
      }
    } catch (bookingError) {
      console.error(`   ❌ Booking error:`, bookingError.response?.data?.message || bookingError.message);
      if (bookingError.response?.data?.warning) {
        console.warn(`   ⚠️  Warning: ${bookingError.response.data.warning}`);
      }
    }
    
    console.log('\n✅ Test completed\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
  }
}

testBookingWorkflow();
