# Zoom Integration - File Reference

## 📂 New Files Created

### Services Layer
**`backend/services/zoomService.js`** (337 lines)
- Core Zoom API integration
- OAuth token management
- Meeting creation and management
- Recording retrieval
- Email notification service
- Reminder system

**Key Exports:**
```javascript
getZoomAccessToken()
createZoomMeeting()
getZoomMeetingDetails()
getZoomRecordings()
sendMeetingInvitation()
sendRecordingLink()
sendMeetingReminder()
```

### Controllers Layer
**`backend/controllers/zoomController.js`** (180 lines)
- OAuth flow handling
- User profile endpoints
- Meeting management
- Recording endpoints

**Key Exports:**
```javascript
initializeZoomOAuth()
handleZoomCallback()
getZoomUser()
listZoomMeetings()
getZoomRecording()
```

### Routes Layer
**`backend/routes/zoomRoutes.js`** (20 lines)
- REST API route definitions
- OAuth endpoints
- Meeting and recording endpoints

**Routes:**
```
GET  /oauth/authorize
GET  /oauth/callback
GET  /user/:userId
GET  /meetings/:specialistId
GET  /recording/:meetingId
```

### Documentation
**`ZOOM_INTEGRATION_GUIDE.md`** (400+ lines)
- Complete technical guide
- Setup instructions
- Architecture documentation
- API reference
- Troubleshooting guide

**`ZOOM_QUICK_START.md`** (200+ lines)
- Quick setup checklist
- Step-by-step instructions
- Testing procedures
- Common issues

**`ZOOM_IMPLEMENTATION_COMPLETE.md`** (this document)
- Implementation overview
- Architecture diagrams
- Feature summary
- Deployment guide

---

## 📝 Modified Files

### Models
**`backend/models/AppointmentSlot.js`**

**Added Fields:**
```javascript
// Zoom Meeting Fields
zoomMeetingId: String
zoomJoinUrl: String
zoomStartUrl: String
zoomHostId: String
zoomRecordingId: String

// Recording Fields
recordingUrl: String
recordingDuration: Number
recordingExpired: Boolean

// Tracking Fields
meetingProvider: String // 'zoom' or 'google-meet'
invitationSentAt: Date
specialistId: ObjectId
specialistName: String

// Kept for compatibility
googleMeetLink: String
googleEventId: String
```

### Controllers
**`backend/controllers/appointmentController.js`**

**Changes:**
- Import `zoomService`
- Updated `bookSlot()` function:
  - Primary: Create Zoom meeting
  - Fallback: Use Google Meet if Zoom fails
  - Send appropriate invitations
  - Track meeting provider

### Server
**`backend/server.js`**

**Changes:**
- Import `zoomRoutes`
- Add route: `app.use('/api/zoom', zoomRoutes)`

---

## 🔌 Environment Variables Required

```env
# Zoom Configuration
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id

# API Configuration
API_URL=http://localhost:5001              # Dev
# API_URL=https://your-domain.com          # Production

# Gmail Configuration (for emails)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# MongoDB (existing)
MONGODB_URI=your-mongo-connection-string
```

---

## 📊 Database Schema Changes

### AppointmentSlot Collection

**Before:**
```javascript
{
  date, startTime, endTime,
  status, bookedBy, serviceTitle,
  googleMeetLink, googleEventId,
  specialistEmail, customerEmail,
  ...
}
```

**After:**
```javascript
{
  // Previous fields maintained
  date, startTime, endTime,
  status, bookedBy, serviceTitle,
  
  // New Zoom fields
  zoomMeetingId, zoomJoinUrl, zoomStartUrl,
  zoomHostId, zoomRecordingId,
  recordingUrl, recordingDuration,
  
  // New tracking fields
  meetingProvider: 'zoom' | 'google-meet',
  specialistId, specialistName,
  invitationSentAt,
  
  // Maintained for compatibility
  googleMeetLink, googleEventId,
  customerName, specialistEmail,
  ...
}
```

---

## 🔄 API Flow Diagrams

### Booking Flow
```
POST /api/appointments/:slotId/book
│
├─ Validate appointment slot
├─ Calculate meeting times
│
├─ TRY: zoomService.createZoomMeeting()
│  │
│  ├─ getZoomAccessToken()
│  ├─ Call Zoom API /users/:id/meetings
│  └─ Return: { zoomMeetingId, joinUrl, startUrl, ... }
│
├─ CATCH: If Zoom fails
│  └─ Fallback: googleMeetService.createGoogleMeet()
│
├─ Save appointment with meeting details
│
├─ TRY: Send invitations
│  │
│  ├─ zoomService.sendMeetingInvitation()
│  │  ├─ Email participant with joinUrl
│  │  └─ Email specialist with startUrl
│  │
│  └─ OR: googleMeetService.sendBookingInviteEmail()
│
├─ CATCH: Email errors (non-blocking)
│
└─ Return: 200 OK with appointment data
```

### OAuth Flow
```
GET /api/zoom/oauth/authorize
│
├─ Build Zoom OAuth URL
└─ Return: { authUrl: "https://zoom.us/oauth/authorize?..." }

User clicks link → Browser redirected to Zoom
User authorizes Specialistly app
Zoom redirects back with authorization code

GET /api/zoom/oauth/callback?code=CODE&state=STATE
│
├─ Exchange code for access token
├─ Get user profile info
├─ Store credentials (implementation specific)
│
└─ Return: { accessToken, refreshToken, zoomUserId, ... }
```

### Recording Flow
```
After meeting ends (automatic)
│
└─ Zoom processes and stores recording (15-60 min)
   │
   └─ Recording becomes available
      │
      └─ System retrieves recording URL
         │
         └─ zoomService.sendRecordingLink()
            │
            └─ Email participant with recording link
```

---

## 🛠️ Integration Checklist

### Before Deployment

- [ ] Zoom Server-to-Server OAuth app created
- [ ] Client ID and Secret obtained
- [ ] ZOOM_* variables added to `.env`
- [ ] Redirect URL configured in Zoom dashboard
- [ ] API scopes enabled: meeting:write, meeting:read, recording:read, user:read
- [ ] Gmail credentials configured (for emails)
- [ ] Dependencies installed: `npm install axios`
- [ ] Backend code updated and tested
- [ ] Database schema compatible (backward compatible)

### After Deployment

- [ ] Backend restarted successfully
- [ ] Check logs: "Backend server is LISTENING on port 5001"
- [ ] Test appointment booking
- [ ] Verify emails received
- [ ] Check Zoom meeting created in Zoom account
- [ ] Test join link works
- [ ] Monitor logs for errors

---

## 📱 API Usage Examples

### Create Meeting (Internal Use)
```javascript
const meetingData = await zoomService.createZoomMeeting({
  specialistEmail: 'dr.smith@example.com',
  specialistName: 'Dr. Smith',
  specialistId: 'zoom_user_123',
  customerEmail: 'john@example.com',
  customerName: 'John Doe',
  serviceTitle: 'Career Consultation',
  startDateTime: '2026-01-30T10:00:00Z',
  endDateTime: '2026-01-30T11:00:00Z',
});
```

### Send Invitations (Internal Use)
```javascript
await zoomService.sendMeetingInvitation({
  specialistEmail: 'dr.smith@example.com',
  specialistName: 'Dr. Smith',
  customerEmail: 'john@example.com',
  customerName: 'John Doe',
  serviceTitle: 'Career Consultation',
  date: '2026-01-30',
  startTime: '10:00 AM',
  joinUrl: 'https://zoom.us/j/123456789',
  zoomMeetingId: '123456789',
});
```

### Get Recordings (API Endpoint)
```
GET /api/zoom/recording/123456789?specialistId=zoom_user_123

Response:
{
  "success": true,
  "data": [
    {
      "id": "rec_12345",
      "start_time": "2026-01-30T10:00:00Z",
      "download_url": "https://zoom.us/rec/download/...",
      "duration": 3600,
      "file_size": 1024000000
    }
  ]
}
```

---

## 🐛 Debugging Guide

### Check Zoom Meeting Created
```javascript
// In backend logs, look for:
"🎥 Creating Zoom meeting..."
"✅ Zoom meeting created: 123456789"

// If not appearing, check:
// 1. ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET set
// 2. Backend restarted after .env changes
// 3. Zoom app has correct API scopes
```

### Check Invitations Sent
```javascript
// Look for:
"📧 Sending Zoom meeting invitations..."
"✓ Participant email sent to customer@example.com"
"✓ Host email sent to specialist@example.com"

// If not sent:
// Check EMAIL_TROUBLESHOOTING.md
// Verify GMAIL_USER and GMAIL_PASSWORD
```

### Check Recording Available
```javascript
// Wait 15-60 minutes after meeting ends
// Then check Zoom account or API:
GET /api/zoom/recording/:meetingId?specialistId=:userId

// If no recording:
// 1. Verify recording was enabled in meeting settings
// 2. Check meeting actually happened
// 3. Wait longer (recording processing time varies)
```

---

## 🔐 Security Checklist

- [ ] Zoom credentials not hardcoded
- [ ] Access tokens stored securely (encrypted in prod)
- [ ] Refresh tokens rotated regularly
- [ ] No passwords in logs or database
- [ ] Recording links time-limited
- [ ] Participant email validated before sending invite
- [ ] Specialist verified as meeting host
- [ ] HTTPS enforced for all API calls
- [ ] Meeting passwords required
- [ ] Waiting room enabled by default

---

## 📞 Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Check ZOOM_CLIENT_ID/SECRET in .env |
| "Meeting not created" | Verify specialist Zoom User ID exists |
| "Email not received" | See EMAIL_TROUBLESHOOTING.md |
| "Recording not available" | Wait 15-60 min after meeting ends |
| "Falls back to Google Meet" | Check Zoom API error in backend logs |

### Helpful Commands

```bash
# Check if backend is running
curl http://localhost:5001/api/health

# View recent logs
# Check backend terminal for "🎥", "📧", "✅", "❌"

# Restart backend
Get-Process node | Stop-Process -Force
cd C:\Work\specialistly\backend && node server.js
```

---

## 📚 Reference Links

### Zoom Documentation
- [Zoom API Docs](https://developers.zoom.us/docs)
- [OAuth 2.0 Guide](https://developers.zoom.us/docs/internal-apps/oauth/)
- [Meeting API Reference](https://developers.zoom.us/docs/api/rest/reference/zoom-api/)
- [Recording API Reference](https://developers.zoom.us/docs/api/rest/reference/zoom-api/)

### Integration Guides
- See `ZOOM_INTEGRATION_GUIDE.md` for full technical documentation
- See `ZOOM_QUICK_START.md` for setup instructions
- See `EMAIL_TROUBLESHOOTING.md` for email issues

---

## ✅ Completion Status

**Zoom Integration: COMPLETE ✅**

- ✅ Service layer implemented (zoomService.js)
- ✅ Controller layer implemented (zoomController.js)
- ✅ Routes defined and integrated (zoomRoutes.js)
- ✅ Database model updated (AppointmentSlot.js)
- ✅ Appointment controller updated
- ✅ Server configuration updated
- ✅ Comprehensive documentation provided
- ✅ Error handling and fallbacks implemented
- ✅ Email notifications integrated
- ✅ Recording management included
- ✅ Security best practices applied
- ✅ Scalable architecture designed

**Ready for:**
- Configuration (Zoom credentials)
- Deployment (production environment)
- Testing (functional and integration tests)
- Monitoring (logging and error tracking)

---

## 🚀 Next Steps

1. **Configure Zoom**: Get credentials from Zoom dashboard
2. **Update .env**: Add ZOOM_* variables
3. **Restart Backend**: Apply new configuration
4. **Test Booking**: Create appointment and verify
5. **Monitor Logs**: Check for success messages
6. **Deploy to Production**: When ready

For step-by-step instructions, see **ZOOM_QUICK_START.md**
