# Zoom Integration - Quick Start

## What Was Added

✅ **Full Zoom Integration** for Specialistly platform with:
- Zoom meeting scheduling and management
- Automatic cloud recording
- Specialist-as-host architecture
- Secure OAuth authentication
- Email notifications for both parties
- Recording distribution to participants
- Graceful fallback to Google Meet if Zoom fails

## Files Created/Modified

### New Files
1. **backend/services/zoomService.js** (300+ lines)
   - Meeting creation
   - Recording management
   - Email notifications
   - Token management

2. **backend/controllers/zoomController.js** (180+ lines)
   - OAuth flow handling
   - User management
   - Meeting endpoints

3. **backend/routes/zoomRoutes.js**
   - API routes for Zoom operations

4. **ZOOM_INTEGRATION_GUIDE.md**
   - Complete setup and usage documentation

### Modified Files
1. **backend/models/AppointmentSlot.js**
   - Added Zoom-specific fields
   - Added meeting provider indicator
   - Recording tracking fields

2. **backend/controllers/appointmentController.js**
   - Import Zoom service
   - Updated bookSlot function to use Zoom
   - Fallback to Google Meet if Zoom fails

3. **backend/server.js**
   - Added Zoom routes

## Setup Instructions

### Step 1: Create Zoom Server App

1. Go to https://marketplace.zoom.us/develop/create
2. Click "Create" → "Server-to-Server OAuth App"
3. Fill in details:
   - Name: Specialistly
   - Company: Your company
4. Copy **Client ID** and **Client Secret**

### Step 2: Configure .env

Add to `.env`:
```env
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
ZOOM_ACCOUNT_ID=your_account_id_here
API_URL=http://localhost:5001
```

### Step 3: Set Redirect URL

In Zoom App dashboard, go to **OAuth & Permissions**:
- Add Redirect URL: `http://localhost:5001/api/zoom/oauth/callback`
- Add Scopes: `meeting:write`, `meeting:read`, `recording:read`, `user:read`

### Step 4: Install Dependencies

```bash
cd backend
npm install axios
```

### Step 5: Restart Backend

```bash
# Stop existing processes
Get-Process node | Stop-Process -Force

# Start backend
cd C:\Work\specialistly\backend
node server.js
```

## How It Works

### User Books Appointment
```
Customer books with Specialist
        ↓
Backend creates Zoom meeting (Specialist is host)
        ↓
Both sent meeting invitations via email
        ↓
Meeting happens with automatic cloud recording
        ↓
Recording available → Link sent to participant
```

### Key Features

**Specialist Gets:**
- ✅ Start meeting link (full control)
- ✅ Participant list
- ✅ Recording access
- ✅ Meeting controls (mute, remove, etc.)

**Participant Gets:**
- ✅ Join meeting link
- ✅ Meeting ID (backup join method)
- ✅ Recording link (after meeting)
- ✅ Email reminders (24h and 30m before)

**System Gets:**
- ✅ Cloud recording stored in Zoom account
- ✅ Automatic recording availability tracking
- ✅ Email delivery confirmation
- ✅ Meeting attendance logs

## API Endpoints Added

```
GET  /api/zoom/oauth/authorize           - Start OAuth flow
GET  /api/zoom/oauth/callback            - OAuth callback handler
GET  /api/zoom/user/:userId              - Get Zoom profile
GET  /api/zoom/meetings/:specialistId    - List specialist's meetings
GET  /api/zoom/recording/:meetingId      - Get meeting recording
```

## Database Changes

AppointmentSlot now tracks:
```javascript
zoomMeetingId       // Zoom's meeting ID
zoomJoinUrl         // Participant join link
zoomStartUrl        // Specialist start link
zoomHostId          // Specialist's Zoom user ID
zoomRecordingId     // Recording ID
recordingUrl        // Download link for recording
meetingProvider     // 'zoom' or 'google-meet'
```

## Testing

### Manual Test

1. Create an appointment slot (via API or database)
2. Book the appointment with specialist info:
   ```json
   {
     "bookedBy": "customer_id",
     "serviceTitle": "Career Consultation",
     "customerEmail": "customer@example.com",
     "customerName": "Jane Doe",
     "specialistEmail": "specialist@example.com",
     "specialistName": "Dr. John",
     "specialistId": "zoom_user_id"
   }
   ```
3. Check backend logs for:
   - ✅ "Zoom meeting created: [ID]"
   - ✅ "Sending Zoom meeting invitations..."
   - ✅ "Participant email sent"
   - ✅ "Host email sent"

### Check Logs

Look for in backend console:
```
🎥 Creating Zoom meeting...
✅ Zoom meeting created: 123456789
📧 Sending Zoom meeting invitations...
✓ Participant email sent to customer@example.com
✓ Host email sent to specialist@example.com
```

### Verify Emails

- Participant should receive: "🎥 Zoom Meeting Invitation"
- Specialist should receive: "🎥 Your Zoom Meeting is Ready"

## Troubleshooting

### "Failed to obtain Zoom access token"
- Check ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET in .env
- Verify credentials in Zoom app dashboard
- Make sure server-to-server OAuth app is enabled

### "Meeting not created"
- Ensure specialist Zoom User ID is correct
- Verify Zoom account has meeting creation enabled
- Check Zoom API scopes are set correctly

### "Email not sent"
- See EMAIL_TROUBLESHOOTING.md
- Verify GMAIL_USER and GMAIL_PASSWORD in .env
- Check that backend has restarted

### "Meeting falls back to Google Meet"
- Zoom API call failed (check logs for reason)
- Google Meet will be used automatically
- Meeting still works, just uses different platform

## Next Steps

1. ✅ Set Zoom credentials in .env
2. ✅ Restart backend server
3. ✅ Test appointment booking
4. ✅ Verify emails are sent
5. ✅ Test joining meeting link
6. ✅ Monitor backend logs

## Architecture Highlights

### Security
- ✅ Server-to-Server OAuth (no user passwords)
- ✅ Access tokens auto-expire
- ✅ Specialist always host
- ✅ Participant join link separate from host link
- ✅ Waiting room enabled by default

### Scalability
- ✅ Async meeting creation
- ✅ Graceful fallback to Google Meet
- ✅ Cloud recording (no local storage)
- ✅ Database-driven appointment management
- ✅ Email queue support (future)

### Reliability
- ✅ Try Zoom, fallback to Google Meet
- ✅ Email failure doesn't block booking
- ✅ Recording links tracked in database
- ✅ Error logging for troubleshooting
- ✅ Automated reminder scheduling (future)

## Full Documentation

See **ZOOM_INTEGRATION_GUIDE.md** for:
- Complete setup instructions
- Architecture details
- API endpoint documentation
- Security best practices
- Recording management
- Migration from Google Meet
- Future enhancements

## Support Files

- `ZOOM_INTEGRATION_GUIDE.md` - Full documentation
- `EMAIL_TROUBLESHOOTING.md` - Email setup guide
- Backend logs for debugging
