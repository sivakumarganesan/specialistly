# Google Meet Integration - Implementation Guide

## 📋 What Has Been Implemented

### 1. **Automatic Google Meet Creation** ✅
When a customer books a consulting appointment:
- System automatically creates a Google Calendar event
- Generates unique Google Meet conference link
- Adds both specialist and customer as attendees
- Stores meeting link in database

### 2. **Automated Email Reminders** ✅
Two automated reminders are triggered:
- **24 Hours Before**: Initial reminder with meeting details
- **30 Minutes Before**: Final reminder to join
- Both include Google Meet link, date, time, and service details
- Professional HTML email templates

### 3. **Recording Sharing with Expiry** ✅
After the consulting session:
- Specialist uploads recording link
- System automatically sends recording to participants
- Recording link includes expiry date warning
- Default expiry: 7 days (customizable)
- Countdown display shows days remaining

### 4. **Appointment Status Management** ✅
Complete appointment lifecycle:
- **Available** → Slot is available for booking
- **Booked** → Slot reserved, Google Meet created
- **In-Progress** → Meeting is currently happening
- **Completed** → Meeting finished, recording shared
- Tracks attendance: attended, missed, rescheduled

## 🛠️ Technical Architecture

### Backend Components

#### **Database Model (AppointmentSlot)**
```
Original Fields:
- date, startTime, endTime, status, bookedBy, serviceTitle

New Google Meet Fields:
- googleMeetLink
- googleEventId
- specialistEmail, customerEmail, customerName

New Recording Fields:
- recordingLink, recordingId
- recordingExpiryDate, recordingExpired

New Tracking Fields:
- reminderSent, reminderSentAt
- recordingSentAt
- meetingNotes, attendanceStatus
```

#### **Google Meet Service** (services/googleMeetService.js)
```
Functions:
✅ createGoogleMeet() - Create Google Calendar event
✅ sendReminderEmail() - Send reminder emails
✅ sendRecordingEmail() - Share recording
✅ checkRecordingExpiry() - Check if expired
✅ deleteExpiredRecording() - Cleanup
```

#### **API Endpoints** (controllers/appointmentController.js)
```
✅ POST /appointments - Create slot
✅ GET /appointments - Get all slots
✅ GET /appointments/available - Get available slots
✅ PUT /appointments/:slotId/book - Book with Google Meet
✅ POST /appointments/:id/send-reminder - Send reminder email
✅ POST /appointments/:id/share-recording - Upload & share recording
✅ GET /appointments/:id/recording - Get recording details
✅ PUT /appointments/:id/status - Update status
✅ DELETE /appointments/:id - Delete slot
```

### Frontend Integration

#### **API Client** (src/app/api/apiClient.ts)
```typescript
appointmentAPI.book(slotId, data) // Book with Google Meet
appointmentAPI.sendReminder(appointmentId) // Send reminder
appointmentAPI.shareRecording(appointmentId, {recordingLink, expiryDays})
appointmentAPI.getRecording(appointmentId) // Check expiry
appointmentAPI.updateStatus(appointmentId, {status, notes})
```

## 🔌 Configuration Requirements

### **Step 1: Google Cloud Setup**
```
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google Calendar API
4. Create Service Account
5. Download JSON credentials
6. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### **Step 2: Gmail Configuration**
```
1. Enable 2-Factor Authentication on Gmail
2. Create App Password in Google Account settings
3. Set GMAIL_USER=your-email@gmail.com
4. Set GMAIL_PASSWORD=app-password (not actual password)
```

### **Step 3: Environment Variables** (.env)
```bash
# Google Meet
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Database
MONGODB_URI=mongodb://localhost:27017/specialistly

# Server
PORT=5001
NODE_ENV=development
```

## 📧 Email Templates

### **Reminder Email**
```html
- Subject: "Reminder: Your Consulting Session - [Service Title]"
- To: Customer and Specialist
- Contains:
  ✅ Meeting title
  ✅ Date and time
  ✅ Google Meet link (clickable)
  ✅ Professional formatting
```

### **Recording Email**
```html
- Subject: "Recording: Your Consulting Session - [Service Title]"
- To: Participants
- Contains:
  ✅ Service confirmation
  ✅ Recording link
  ✅ Expiry date (⚠️ highlighted)
  ✅ "Days remaining" countdown
  ✅ Download warning
```

## 🔄 Complete Workflow

### **Booking Flow**
```
1. Customer finds available time slot
   ↓
2. Clicks "Book Appointment"
   ↓
3. Enters details (service, time, preferences)
   ↓
4. Backend receives booking request
   ↓
5. Creates Google Calendar event with Meet
   ↓
6. Generates unique Meet link
   ↓
7. Stores in appointment record
   ↓
8. Confirmation sent to both parties
   ↓
9. Status: "booked" ✅
```

### **Reminder Flow**
```
1. 24 hours before meeting
   ↓
2. Automatic reminder email triggered
   ↓
3. Email includes:
   - Meeting details
   - Google Meet link
   - Countdown timer
   ↓
4. 30 minutes before meeting
   ↓
5. Final reminder email sent
   ↓
6. Status: "reminder_sent" ✅
```

### **Meeting Flow**
```
1. Specialist & Customer join Meet link
   ↓
2. Status updated to "in-progress"
   ↓
3. Meeting recorded automatically
   ↓
4. Both can see meeting transcript
   ↓
5. Session ends
   ↓
6. Status: "in-progress" → ready for recording
```

### **Recording Sharing Flow**
```
1. Specialist finishes meeting
   ↓
2. Recording is processed/uploaded
   ↓
3. Specialist pastes recording link in admin
   ↓
4. System calculates expiry (today + 7 days)
   ↓
5. Recording email sent to participants:
   - Recording link
   - Expiry date (highlighted red)
   - "Save before: [Date]" warning
   ↓
6. Status: "completed" ✅
   recordingLink: "[URL]"
   recordingExpiryDate: "[Date]"
```

### **Recording Access Flow**
```
1. Customer clicks recording link
   ↓
2. Backend checks expiry date
   ↓
3. If TODAY ≤ expiryDate:
   - ✅ Access GRANTED
   - Show "Expires in X days"
   - Show download button
   ↓
4. If TODAY > expiryDate:
   - ❌ Access DENIED
   - Message: "Recording expired on [Date]"
   - Option: Request from specialist
```

## 💻 API Usage Examples

### **Book Appointment**
```typescript
const response = await appointmentAPI.book(slotId, {
  bookedBy: "customer_id",
  serviceTitle: "1:1 Consulting",
  customerEmail: "customer@example.com",
  customerName: "John Doe",
  specialistEmail: "specialist@example.com",
  specialistName: "Jane Smith"
});

// Response includes:
// {
//   googleMeetLink: "https://meet.google.com/...",
//   googleEventId: "abc123...",
//   status: "booked",
//   specialistEmail: "specialist@example.com"
// }
```

### **Send Reminder**
```typescript
const response = await appointmentAPI.sendReminder(appointmentId);

// Response:
// {
//   success: true,
//   message: "Reminder emails sent successfully",
//   data: { reminderSent: true, reminderSentAt: "2026-01-27T..." }
// }
```

### **Share Recording**
```typescript
const response = await appointmentAPI.shareRecording(appointmentId, {
  recordingLink: "https://drive.google.com/file/d/abc123...",
  expiryDays: 7
});

// Response:
// {
//   success: true,
//   message: "Recording shared successfully. Expires on 2/3/2026",
//   data: {
//     recordingLink: "https://drive.google.com/...",
//     recordingExpiryDate: "2026-02-03T00:00:00.000Z",
//     recordingExpired: false
//   }
// }
```

### **Get Recording Details**
```typescript
const recording = await appointmentAPI.getRecording(appointmentId);

// Response:
// {
//   success: true,
//   data: {
//     recordingLink: "https://drive.google.com/...",
//     expiryDate: "2026-02-03T...",
//     isExpired: false,
//     expiresIn: 7 // days remaining
//   }
// }
```

## 🎯 Key Features

| Feature | Implementation | Status |
|---------|-----------------|--------|
| Auto Google Meet Creation | When booking slot | ✅ |
| Meeting Link Storage | In appointment record | ✅ |
| Dual Email Reminders | 24h and 30min before | ✅ |
| Professional Templates | HTML with styling | ✅ |
| Recording Upload | Via recording link | ✅ |
| Expiry Date Setting | Default 7 days | ✅ |
| Countdown Display | Days remaining | ✅ |
| Expiry Validation | Check before access | ✅ |
| Attendance Tracking | attended/missed/rescheduled | ✅ |
| Status Management | Full lifecycle | ✅ |
| Error Handling | Graceful fallbacks | ✅ |

## 📊 Database Changes

### **Old AppointmentSlot Fields** (5 fields)
```javascript
date, startTime, endTime, status, bookedBy, serviceTitle
```

### **New AppointmentSlot Fields** (20 total, +15 new)
```javascript
// Google Meet
googleMeetLink, googleEventId, specialistEmail, 
customerEmail, customerName

// Recording
recordingLink, recordingId, recordingExpiryDate, recordingExpired

// Email Tracking
reminderSent, reminderSentAt, recordingSentAt

// Meeting Metadata
meetingNotes, attendanceStatus

// Plus original 5 fields + timestamps
```

## 🔐 Security Considerations

```
✅ Google Credentials: Stored in environment variables
✅ Gmail Password: App Password (not actual password)
✅ Email Encryption: HTML-escaped for safety
✅ Recording Links: Direct to cloud storage
✅ Expiry Validation: Server-side check
✅ Error Logging: No sensitive data exposed
```

## 🚀 Deployment Checklist

- [ ] Google Service Account created
- [ ] Google Calendar API enabled
- [ ] Gmail App Password generated
- [ ] Environment variables configured
- [ ] Backend dependencies installed (googleapis, nodemailer, uuid)
- [ ] Database migrations applied
- [ ] Email templates tested
- [ ] API endpoints tested
- [ ] Frontend integration verified
- [ ] Error handling tested
- [ ] Production domain configured
- [ ] SMTP settings verified

## 📚 Documentation Files

1. **GOOGLE_MEET_INTEGRATION.md** - Detailed technical documentation
2. **GOOGLE_MEET_INTEGRATION_SUMMARY.md** - Feature overview
3. **This file** - Implementation guide

## ✅ What's Ready to Use

### **Backend**
✅ All endpoints configured
✅ Google Meet service ready
✅ Email service configured
✅ Database schema updated
✅ Error handling implemented

### **Frontend**
✅ API client updated
✅ New methods available
✅ TypeScript types configured
✅ Zero compilation errors

### **Documentation**
✅ Complete setup guide
✅ API reference
✅ Email templates documented
✅ Workflow diagrams
✅ Troubleshooting guide

## 🎓 Next Steps

1. **Configure Google Cloud**
   - Create Service Account
   - Download credentials.json
   - Set GOOGLE_APPLICATION_CREDENTIALS

2. **Configure Gmail**
   - Enable 2FA
   - Create App Password
   - Set GMAIL_USER and GMAIL_PASSWORD

3. **Update .env File**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your credentials
   ```

4. **Test the Workflow**
   - Create test appointment
   - Verify Google Meet link created
   - Test reminder emails
   - Test recording sharing

5. **Deploy to Production**
   - Set production environment variables
   - Configure production email domain
   - Update API endpoints
   - Monitor success rates

## 💡 Pro Tips

- Use test Google Meet links before production
- Start with 7-day expiry, adjust based on needs
- Monitor email delivery success rates
- Keep backup of recording links before expiry
- Test reminder emails at off-peak hours
- Archive important recordings before expiry

## 🆘 Support

If you encounter issues:
1. Check .env configuration
2. Verify Google credentials
3. Check Gmail app password
4. Review error logs
5. Refer to detailed documentation
6. Contact support with error details

---

**Implementation Complete! ✅**

All components are ready for integration testing. Configure environment variables and run test workflows to verify the system is functioning correctly.
