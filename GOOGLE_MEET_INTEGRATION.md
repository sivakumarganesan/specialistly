# Google Meet Integration for Consulting Workflow

## Overview
This document describes the Google Meet integration with the Specialistly consulting workflow, including appointment management, reminder emails, and recording sharing with expiry dates.

## Features Implemented

### 1. **Google Meet Meeting Creation**
- Automatically creates a Google Meet event when a consulting appointment is booked
- Includes both specialist and customer as attendees
- Generates unique meeting links for each appointment
- Stores Google Event ID for future reference

### 2. **Email Reminders**
- Sends automated reminder emails to both specialist and customer
- Two reminder types:
  - 24 hours before the meeting
  - 30 minutes before the meeting
- Includes meeting link, date, time, and service details
- Professional HTML email template

### 3. **Recording Management**
- Share recordings with participants after the meeting
- Set custom expiry dates (default: 7 days)
- Email notification to participants with recording link
- Automatic expiry status tracking
- Shows days remaining until expiry

### 4. **Appointment Status Tracking**
- Appointment states: available → booked → in-progress → completed
- Track meeting attendance (attended, missed, rescheduled)
- Add meeting notes and follow-up comments
- Update status in real-time

## Database Schema Updates

### AppointmentSlot Model
```javascript
{
  // Original fields
  date: Date,
  startTime: String,
  endTime: String,
  status: String,
  bookedBy: ObjectId,
  serviceTitle: String,
  
  // Google Meet Integration
  googleMeetLink: String,
  googleEventId: String,
  specialistEmail: String,
  customerEmail: String,
  customerName: String,
  
  // Recording Details
  recordingLink: String,
  recordingId: String,
  recordingExpiryDate: Date,
  recordingExpired: Boolean,
  
  // Email Reminders
  reminderSent: Boolean,
  reminderSentAt: Date,
  recordingSentAt: Date,
  
  // Meeting Metadata
  meetingNotes: String,
  attendanceStatus: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. Book Appointment with Google Meet
**POST** `/api/appointments/:slotId/book`

**Request Body:**
```json
{
  "bookedBy": "customer_id",
  "serviceTitle": "1:1 Consulting Session",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "specialistEmail": "specialist@example.com",
  "specialistName": "Jane Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slot booked successfully with Google Meet created",
  "data": {
    "_id": "appointment_id",
    "status": "booked",
    "googleMeetLink": "https://meet.google.com/...",
    "googleEventId": "calendar_event_id",
    "specialistEmail": "specialist@example.com",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe"
  }
}
```

### 2. Send Reminder Email
**POST** `/api/appointments/:appointmentId/send-reminder`

**Description:** Sends reminder emails to both specialist and customer

**Response:**
```json
{
  "success": true,
  "message": "Reminder emails sent successfully",
  "data": { /* appointment details */ }
}
```

### 3. Share Recording with Participants
**POST** `/api/appointments/:appointmentId/share-recording`

**Request Body:**
```json
{
  "recordingLink": "https://drive.google.com/file/d/...",
  "expiryDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recording shared successfully. It will expire on 2/3/2026",
  "data": {
    "_id": "appointment_id",
    "status": "completed",
    "recordingLink": "https://drive.google.com/file/d/...",
    "recordingExpiryDate": "2026-02-03T00:00:00.000Z",
    "recordingExpired": false
  }
}
```

### 4. Get Recording Details
**GET** `/api/appointments/:appointmentId/recording`

**Response:**
```json
{
  "success": true,
  "data": {
    "recordingLink": "https://drive.google.com/file/d/...",
    "expiryDate": "2026-02-03T00:00:00.000Z",
    "isExpired": false,
    "expiresIn": 7
  }
}
```

### 5. Update Appointment Status
**PUT** `/api/appointments/:appointmentId/status`

**Request Body:**
```json
{
  "status": "in-progress",
  "attendanceStatus": "attended",
  "meetingNotes": "Discussed project requirements and timeline"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": { /* updated appointment */ }
}
```

## Environment Configuration

Create a `.env` file in the backend directory with:

```env
# Google Meet (Service Account)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json

# Gmail for Email Reminders
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# MongoDB
MONGODB_URI=mongodb://localhost:27017/specialistdb

# Server
PORT=5001
NODE_ENV=development
```

## Setup Instructions

### 1. Google Meet Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API
4. Create a Service Account
5. Download the JSON credentials file
6. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of this file

### 2. Gmail Setup for Email Reminders
1. Enable 2-Factor Authentication on your Gmail account
2. Create an App Password in Google Account settings
3. Use the App Password in `GMAIL_PASSWORD` (not your actual Gmail password)

### 3. Install Dependencies
```bash
cd backend
npm install googleapis nodemailer uuid
```

## Email Template Features

### Reminder Email
- Meeting title and service type
- Date and time
- Direct Google Meet link
- Professional formatting
- Call-to-action button

### Recording Email
- Service title
- Recording download link
- Expiry date highlighted in red
- Warning about data loss
- Professional branding

## Recording Expiry Management

### Automatic Expiry Checking
- System checks expiry date when recording is accessed
- Marks recording as expired if current date > expiry date
- Prevents access to expired recordings

### Custom Expiry Periods
- Default: 7 days
- Customizable per recording
- Can be set to any number of days

### Storage Considerations
- Recordings stored on Google Drive/Cloud Storage
- Expired recordings can be automatically deleted
- Archive option for long-term storage

## Workflow Example

### 1. Customer Books Appointment
```
Customer views available slots
→ Selects time slot
→ Confirms booking with specialist details
```

### 2. System Creates Google Meet
```
Backend receives booking request
→ Creates Google Calendar event
→ Generates Google Meet link
→ Stores link in appointment record
```

### 3. Reminder Emails Sent
```
24 hours before: Automated reminder
30 minutes before: Final reminder
→ Both with Google Meet link
```

### 4. Meeting Occurs
```
Specialist and customer join via Google Meet
→ Meeting is recorded
→ Both can see transcript/notes
```

### 5. Recording Shared
```
After meeting ends
→ Specialist uploads recording link
→ System sends recording email
→ Email includes 7-day expiry warning
```

### 6. Recording Access Management
```
Customer can view recording for 7 days
→ System tracks access
→ After 7 days, link becomes inactive
→ Recording marked as expired
```

## Frontend Integration Points

### Appointment Booking
- Display Google Meet link after booking
- Show confirmation with meeting details

### Appointment Details
- Display Google Meet link
- Show reminder status
- Display recording status if available

### Recording Access
- Check expiry before showing link
- Display expiry countdown
- Show warning if expiring soon

## Error Handling

### Google Meet Creation Failures
- System still saves booking without Meet link
- Returns warning in response
- Can retry creating Meet later

### Email Send Failures
- Logs error but continues with appointment
- Can manually retry sending emails
- Fallback notification to user

### Recording Expiry Failures
- System logs deletion failures
- Manual cleanup available
- Archive option for backup

## Security Considerations

1. **Google Credentials**
   - Never commit credentials.json to version control
   - Use environment variables
   - Rotate service account keys regularly

2. **Email Credentials**
   - Use App Passwords, not actual Gmail password
   - Rotate periodically
   - Don't expose in logs

3. **Recording Links**
   - Use authenticated links when possible
   - Validate access permissions
   - Log all access attempts

4. **Data Privacy**
   - GDPR compliant recording storage
   - Automatic deletion of expired recordings
   - User consent for recording notification

## Monitoring & Logging

Monitor these operations:
- Google Meet creation success/failure rate
- Email delivery success rate
- Recording sharing completion
- Expiry date management accuracy

## Future Enhancements

1. **Zoom Integration** - Alternative to Google Meet
2. **Recording Transcripts** - AI-powered meeting transcripts
3. **Automatic Recording Upload** - Direct to cloud storage
4. **Meeting Insights** - Duration, attendance time, engagement metrics
5. **Calendar Sync** - Two-way sync with specialist calendars
6. **SMS Reminders** - Additional reminder via SMS
7. **Meeting Polls** - During-meeting feedback collection
8. **Follow-up Scheduler** - Auto-schedule follow-ups

## Troubleshooting

### Google Meet Not Created
- Check GOOGLE_APPLICATION_CREDENTIALS is set
- Verify service account has Calendar API permissions
- Check Google Cloud project is enabled

### Emails Not Sending
- Verify GMAIL_USER and GMAIL_PASSWORD are correct
- Check "Less secure app access" is enabled
- Verify Gmail account allows app passwords

### Recording Link Not Accessible
- Check expiry date hasn't passed
- Verify link format is correct
- Confirm customer email matches recipient

## Support & Documentation

- [Google Calendar API Docs](https://developers.google.com/calendar)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Google Meet Documentation](https://support.google.com/meet)
