# Zoom Integration Guide for Specialistly

## Overview

Specialistly now uses Zoom as the primary video conferencing platform for all specialist-participant sessions. This guide covers setup, configuration, and usage.

## Architecture

### Key Components

1. **Zoom Service** (`backend/services/zoomService.js`)
   - OAuth token management
   - Meeting creation and management
   - Recording retrieval and distribution
   - Email notifications

2. **Zoom Controller** (`backend/controllers/zoomController.js`)
   - OAuth callback handling
   - User profile management
   - Meeting and recording endpoints

3. **Zoom Routes** (`backend/routes/zoomRoutes.js`)
   - OAuth endpoints
   - API routes for meetings and recordings

4. **Appointment Model** (Updated `AppointmentSlot.js`)
   - Zoom-specific fields: zoomMeetingId, zoomJoinUrl, zoomRecordingId
   - Recording tracking: recordingUrl, recordingDuration
   - Meeting provider indicator: meetingProvider enum

## Setup Instructions

### 1. Create Zoom App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/develop/create)
2. Click "Create" > "Server-to-Server OAuth App"
3. Fill in app details:
   - **App Name**: Specialistly
   - **Company**: Your company
   - **App Type**: Server-to-Server OAuth

4. After creation, you'll get:
   - **Client ID**
   - **Client Secret**

### 2. Configure Environment Variables

Add to `.env` file:

```env
# Zoom Configuration
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_ACCOUNT_ID=your_zoom_account_id_here

# API Base URL (for OAuth callback)
API_URL=http://localhost:5001
# In production: API_URL=https://your-domain.com
```

### 3. Install Dependencies

```bash
cd backend
npm install axios
```

### 4. Enable Zoom Features

In Zoom App Settings:
1. Go to **OAuth & Permissions**
2. Add these **Redirect URLs**:
   - `http://localhost:5001/api/zoom/oauth/callback`
   - `https://your-domain.com/api/zoom/oauth/callback` (production)

3. Required **Scopes**:
   - `meeting:write` - Create and update meetings
   - `meeting:read` - Retrieve meeting information
   - `recording:read` - Access recordings
   - `user:read` - Read user information

## How It Works

### Workflow: Booking an Appointment

```
1. Participant books appointment with specialist
   ↓
2. Appointment controller creates Zoom meeting
   - Specialist is automatically the host
   - Meeting scheduled for appointment date/time
   - Cloud recording enabled automatically
   ↓
3. Meeting invitations sent to both parties
   - Participant: Gets join link and meeting ID
   - Specialist: Gets start link and host controls
   ↓
4. Meeting happens with automatic recording
   ↓
5. After meeting: Recording automatically available
   ↓
6. Recording link sent to participant (optional)
```

### Key Code Flow

**1. Creating a Zoom Meeting**

```javascript
const meetingData = await zoomService.createZoomMeeting({
  specialistEmail: 'specialist@example.com',
  specialistName: 'Dr. John',
  specialistId: 'zoom_user_id', // Zoom User ID (host)
  customerEmail: 'customer@example.com',
  customerName: 'Jane Doe',
  serviceTitle: 'Career Consultation',
  startDateTime: '2026-01-30T10:00:00Z',
  endDateTime: '2026-01-30T11:00:00Z',
});

// Returns:
// {
//   zoomMeetingId: '123456789',
//   joinUrl: 'https://zoom.us/j/123456789?pwd=...',
//   startUrl: 'https://zoom.us/s/123456789?zak=...',
//   hostEmail: 'specialist@example.com',
//   hostId: 'specialist_zoom_id',
//   participantEmails: ['customer@example.com'],
//   recordingEnabled: true
// }
```

**2. Sending Meeting Invitations**

```javascript
await zoomService.sendMeetingInvitation({
  specialistEmail: 'specialist@example.com',
  specialistName: 'Dr. John',
  customerEmail: 'customer@example.com',
  customerName: 'Jane Doe',
  serviceTitle: 'Career Consultation',
  date: '2026-01-30',
  startTime: '10:00 AM',
  joinUrl: 'https://zoom.us/j/123456789?pwd=...',
  zoomMeetingId: '123456789',
});
```

**3. Getting Recordings After Meeting**

```javascript
const recordings = await zoomService.getZoomRecordings(
  specialistId,
  zoomMeetingId
);

// Returns array of recording files with download URLs
```

**4. Sending Recording to Participant**

```javascript
await zoomService.sendRecordingLink(appointmentData, recordingUrl);
```

## Role-Based Permissions

### Specialist (Host)
- ✅ Create meetings
- ✅ Start meetings (using start_url)
- ✅ Control recording
- ✅ Remove participants
- ✅ Access all participant data
- ✅ Download recordings

### Participant (Attendee)
- ✅ Join meetings (using join_url)
- ✅ Participate in video/audio
- ✅ View shared content
- ❌ Cannot remove others
- ❌ Cannot download recordings (unless shared)
- ❌ Cannot modify meeting settings

## API Endpoints

### OAuth Flow
```
GET /api/zoom/oauth/authorize
  Returns: { authUrl: "https://zoom.us/oauth/authorize?..." }

GET /api/zoom/oauth/callback?code=AUTH_CODE&state=STATE
  Handles: OAuth token exchange and user setup
  Returns: { accessToken, refreshToken, expiresIn, zoomUserId }
```

### User Management
```
GET /api/zoom/user/:userId
  Returns: Zoom user profile information
```

### Meeting Management
```
GET /api/zoom/meetings/:specialistId
  Returns: List of meetings for a specialist

GET /api/zoom/recording/:meetingId?specialistId=ID
  Returns: Recording files and download URLs
```

## Email Notifications

### Participant Email (Join Notification)
- **When**: Immediately after booking
- **Content**: Join link, meeting ID, date/time, host name
- **CTA**: "Join Zoom Meeting" button

### Specialist Email (Host Notification)
- **When**: Immediately after booking
- **Content**: Participant info, start link, recording info
- **CTA**: "Start Zoom Meeting" button

### Reminder Emails
- **Sent**: 24 hours before and 30 minutes before meeting
- **To**: Both participant and specialist
- **Content**: Meeting details and join link

### Recording Notification
- **Sent**: After recording is processed (can take 15-60 minutes)
- **To**: Participant only
- **Content**: Recording link with 30-day expiry warning

## Recording Management

### Automatic Recording
- ✅ Cloud recording enabled by default
- ✅ Records to Zoom's cloud storage
- ✅ Available within 15-60 minutes of meeting end
- ✅ Recording link sent automatically

### Recording Access
- **Specialist**: Full access via Zoom account
- **Participant**: Access via email link (optional)
- **Duration**: 30-day expiry (configurable)

### Storage
- Zoom stores recordings in cloud
- Customizable retention: 1-30 days
- Can be deleted earlier if needed

## Security & Best Practices

### Authentication
- ✅ Server-to-Server OAuth (most secure)
- ✅ Access tokens expire after ~1 hour
- ✅ Refresh tokens used for renewal
- ✅ Never expose tokens in frontend code

### Authorization
- ✅ Specialist must be authenticated as host
- ✅ Participant emails validated before sending invites
- ✅ Only specialists can create meetings
- ✅ Recording links time-limited

### Data Protection
- ✅ All communications over HTTPS
- ✅ Meeting IDs are unique per session
- ✅ Passwords required to join meetings
- ✅ Waiting room enabled by default
- ✅ No direct participant access to recording downloads

## Troubleshooting

### "Invalid authentication credentials"
**Cause**: ZOOM_CLIENT_ID or ZOOM_CLIENT_SECRET not set or incorrect
**Fix**: 
1. Verify credentials in `.env`
2. Check Zoom App Marketplace dashboard
3. Regenerate credentials if needed

### "Meeting not created"
**Cause**: Specialist Zoom User ID not valid
**Fix**:
1. Ensure specialist has completed OAuth flow
2. Verify specialist's Zoom account exists
3. Check Zoom account has meeting creation enabled

### "Participant can't join meeting"
**Cause**: Join link expired or password incorrect
**Fix**:
1. Resend invitation email
2. Share meeting ID directly
3. Check Zoom account permissions

### "Recording not available"
**Cause**: Recording still processing or storage full
**Fix**:
1. Wait 15-60 minutes after meeting ends
2. Check Zoom account storage quota
3. Verify meeting was recorded (check meeting settings)

### "Email not received"
**Cause**: Gmail credentials invalid or email service not configured
**Fix**:
1. Check GMAIL_USER and GMAIL_PASSWORD in `.env`
2. Restart backend server
3. Check email spam folder
4. See EMAIL_TROUBLESHOOTING.md

## Database Schema Updates

### AppointmentSlot Model
New Zoom-specific fields:

```javascript
zoomMeetingId: String,          // Zoom meeting ID
zoomJoinUrl: String,            // Participant join link
zoomStartUrl: String,           // Specialist start link
zoomHostId: String,             // Specialist's Zoom user ID
zoomRecordingId: String,        // Recording ID in Zoom
recordingUrl: String,           // Download link for recording
recordingDuration: Number,      // Duration in seconds
meetingProvider: String,        // 'zoom' or 'google-meet'
invitationSentAt: Date,         // When emails were sent
```

## Monitoring & Logging

The system logs all Zoom operations:

```
✅ Zoom meeting created: 123456789
📧 Sending Zoom meeting invitations...
✓ Participant email sent to customer@example.com
✓ Host email sent to specialist@example.com
📧 Sending recording link to participant...
```

Monitor these in backend console/logs:
- Meeting creation success/failures
- Email sending confirmations
- OAuth token exchanges
- API call errors

## Migration from Google Meet

To migrate existing appointments:

1. **Update existing appointments**:
   ```javascript
   // Set meetingProvider: 'google-meet' for old appointments
   // Keep Google Meet links in googleMeetLink field
   // New appointments will use meetingProvider: 'zoom'
   ```

2. **Gradual rollout**:
   - New bookings → Zoom
   - Existing bookings → Google Meet (until completion)
   - After certain date → Zoom only

3. **User communication**:
   - Notify specialists of Zoom switch
   - Provide Zoom setup guide
   - Schedule transition period

## Future Enhancements

- [ ] Zoom webinar support (for 1-to-many sessions)
- [ ] Live streaming integration
- [ ] Custom meeting templates
- [ ] Automated meeting reminders via SMS
- [ ] Video on-demand platform integration
- [ ] Meeting analytics and attendance reports
- [ ] Breakout room support for group sessions
- [ ] Interactive whiteboard sharing

## Support

For issues or questions:
1. Check Zoom API documentation: https://developers.zoom.us/docs
2. Review troubleshooting section above
3. Check backend logs for detailed error messages
4. Verify all environment variables are set correctly
