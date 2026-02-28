import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const API_BASE = 'http://localhost:5001/api';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://specialistlyapp:vQCvVDjKzZX3WpkK@specialistdb.nwhko.mongodb.net/specialistdb';

// Models
import UserOAuthToken from './models/UserOAuthToken.js';

async function debugZoomBooking() {
  try {
    console.log('\n='.repeat(70));
    console.log('🔍 ZOOM BOOKING ISSUE DEBUG REPORT');
    console.log('='.repeat(70));

    // Connect to DB
    await mongoose.connect(MONGO_URI);
    console.log('\n✓ Connected to MongoDB');

    // Get specialist info
    const creatorRes = await axios.get(`${API_BASE}/creator`);
    const specialist = creatorRes.data.data.find(c => c.email === 'sivakumarganeshm@gmail.com');
    
    if (!specialist) {
      console.error('❌ Specialist not found');
      process.exit(1);
    }

    console.log('\n📋 SPECIALIST INFO:');
    console.log(`  Name: ${specialist.name}`);
    console.log(`  Email: ${specialist.email}`);
    console.log(`  ID: ${specialist._id}`);

    // Check Zoom OAuth token status
    const zoomToken = await UserOAuthToken.findOne({ userId: specialist._id });

    if (!zoomToken) {
      console.log('\n❌ ZOOM AUTHORIZATION STATUS: NOT AUTHORIZED');
      console.log('\n🔧 FIX:');
      console.log('  1. Navigate to: http://localhost:5173');
      console.log('  2. Login as specialist: sivakumarganeshm@gmail.com');
      console.log('  3. Go to: Settings → Zoom Integration');
      console.log('  4. Click: "Connect Zoom Account"');
      console.log('  5. Complete Zoom OAuth authorization');
      process.exit(1);
    }

    console.log('\n🔑 ZOOM OAUTH TOKEN STATUS:');
    console.log(`  Is Active: ${zoomToken.isActive}`);
    console.log(`  Is Revoked: ${zoomToken.isRevoked}`);
    console.log(`  Zoom User ID: ${zoomToken.zoomUserId}`);
    console.log(`  Zoom Email: ${zoomToken.zoomEmail}`);
    console.log(`  Access Token: ${zoomToken.zoomAccessToken ? (zoomToken.zoomAccessToken === 'pending' ? '❌ pending' : '✓ stored') : '❌ missing'}`);
    console.log(`  Refresh Token: ${zoomToken.zoomRefreshToken ? (zoomToken.zoomRefreshToken === 'pending' ? '❌ pending' : '✓ stored') : '❌ missing'}`);
    console.log(`  Token Expiry: ${zoomToken.zoomAccessTokenExpiry ? new Date(zoomToken.zoomAccessTokenExpiry).toLocaleString() : 'N/A'}`);

    // Check if token is valid
    const isPending = zoomToken.zoomAccessToken === 'pending' || zoomToken.zoomRefreshToken === 'pending';
    const isExpired = new Date() > new Date(zoomToken.zoomAccessTokenExpiry);

    if (isPending) {
      console.log('\n❌ TOKEN EXCHANGE FAILED');
      console.log('\n📌 ISSUE: OAuth token exchange did not complete successfully.');
      console.log('   This means the specialist clicked "Authorize" but the token');
      console.log('   exchange with Zoom failed.');
      
      console.log('\n🔍 POSSIBLE CAUSES:');
      console.log('  1. Redirect URL mismatch - URL in Zoom App ≠ Actual callback');
      console.log('  2. Zoom credentials invalid - Client ID or Secret incorrect');
      console.log('  3. Insufficient scopes - Required scopes not enabled in Zoom App');
      console.log('  4. Network issue - Couldn\'t reach Zoom API during exchange');

      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('\n  Step 1: Verify Zoom App Configuration');
      console.log('    a) Go to: https://marketplace.zoom.us/develop/apps');
      console.log('    b) Select your app');
      console.log('    c) Verify these settings:');
      console.log('       - App Type: "User-Managed OAuth App"');
      console.log('       - Client ID: T0rMIOs5Quu2sGFeTAn2Tw');
      console.log('       - Redirect URL: http://localhost:5001/api/zoom/oauth/user-callback');
      console.log('       - Scopes: meeting:update:meeting, user:read:user');

      console.log('\n  Step 2: Re-authorize Zoom');
      console.log('    a) Login to the app as specialist');
      console.log('    b) Go to Settings → Zoom Integration');
      console.log('    c) Click "Disconnect Zoom" if it exists');
      console.log('    d) Click "Connect Zoom Account"');
      console.log('    e) Complete authorization, watch for errors');

      console.log('\n  Step 3: Check Server Logs');
      console.log('    a) Look at backend server console for:');
      console.log('       ❌ "Zoom token exchange failed"');
      console.log('       ❌ "Failed to fetch Zoom user info"');
      console.log('    b) These logs show the exact error from Zoom');

    } else if (isExpired) {
      console.log('\n⏰ TOKEN EXPIRED');
      console.log('\n🔧 FIX: Reconnect Zoom Account');
      console.log('  1. Settings → Zoom Integration');
      console.log('  2. Click "Disconnect Zoom"');
      console.log('  3. Click "Connect Zoom Account" again');

    } else {
      console.log('\n✅ TOKEN IS VALID');
      console.log('\n✓ Zoom authorization is complete and valid');
      console.log('✓ Bookings should now work and send emails');

      // Try a booking
      console.log('\n📤 ATTEMPTING TEST BOOKING...');
      try {
        const slotsRes = await axios.get(`${API_BASE}/appointments/available`);
        const slots = slotsRes.data.data || [];
        
        if (slots.length === 0) {
          console.log('❌ No available slots to test with');
        } else {
          const slot = slots[0];
          const bookingData = {
            bookedBy: 'test-customer',
            customerEmail: 'sinduja.vel@gmail.com',
            customerName: 'Sinduja Vel',
            specialistEmail: specialist.email,
            specialistName: specialist.name,
            specialistId: specialist._id,
            serviceTitle: 'Test Session',
          };

          const bookRes = await axios.put(
            `${API_BASE}/appointments/${slot._id}/book`,
            bookingData
          );

          if (bookRes.data.success) {
            console.log('✅ BOOKING SUCCESSFUL');
            console.log(`  Zoom Meeting ID: ${bookRes.data.data?.zoomMeetingId}`);
            console.log(`  Join URL: ${bookRes.data.data?.zoomJoinUrl}`);
            console.log('\n✓ Emails should have been sent to:');
            console.log(`  - Customer: ${bookingData.customerEmail}`);
            console.log(`  - Specialist: ${specialist.email}`);
            console.log('\n📧 Check email inboxes for meeting invitations!');
          } else {
            console.log('❌ BOOKING FAILED');
            console.log(`  Error: ${bookRes.data.message}`);
          }
        }
      } catch (bookError) {
        console.log('❌ BOOKING TEST FAILED');
        console.log(`  Error: ${bookError.response?.data?.message || bookError.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('END DEBUG REPORT');
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
    process.exit(1);
  }
}

debugZoomBooking();
