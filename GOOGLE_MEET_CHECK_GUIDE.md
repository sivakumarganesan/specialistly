# How to Check Google Meet Invitation Status

## 📋 Overview

When an appointment is booked, the system:
1. Creates a Google Meet event
2. Saves the Google Meet link and event ID to the appointment
3. Sends invitation emails to both specialist and customer

## ✅ Ways to Check If Google Meet Was Created

### Method 1: Check Database - Appointment Slot Document

Query the MongoDB `appointmentslots` collection to verify Google Meet details were saved:

```javascript
// Look for these fields in the booked appointment:
{
  "_id": "ObjectId",
  "status": "booked",
  "googleMeetLink": "https://meet.google.com/xxx-xxxx-xxx",  // ✅ If present, meet was created
  "googleEventId": "xxxxxxxxxxxxx@google.com",               // ✅ Event ID from Google Calendar
  "customerEmail": "customer@gmail.com",
  "specialistEmail": "specialist@gmail.com",
  "bookedBy": "ObjectId",  // Customer's user ID
  "serviceTitle": "Consulting Session",
  "date": "2026-01-28T00:00:00.000Z",
  "startTime": "14:30",
  "endTime": "15:30"
}
```

**MongoDB Query:**
```bash
db.appointmentslots.findOne({ 
  status: "booked", 
  googleMeetLink: { $exists: true, $ne: null }
})
```

### Method 2: Check API Response

When you book an appointment, the API returns the complete slot data including Google Meet info:

**Request:**
```bash
POST /api/appointments/{slotId}/book
Content-Type: application/json

{
  "bookedBy": "user_id",
  "customerEmail": "customer@gmail.com",
  "customerName": "John Doe",
  "specialistEmail": "specialist@gmail.com",
  "specialistName": "Dr. Smith",
  "serviceTitle": "Consulting Session"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Slot booked successfully with Google Meet created and invitation sent",
  "data": {
    "_id": "slot_id",
    "status": "booked",
    "googleMeetLink": "https://meet.google.com/abc-defg-hij",  // ✅ CHECK THIS
    "googleEventId": "abc123@google.com",                    // ✅ CHECK THIS
    "customerEmail": "customer@gmail.com",
    "specialistEmail": "specialist@gmail.com",
    "date": "2026-01-28",
    "startTime": "14:30",
    "endTime": "15:30"
  }
}
```

### Method 3: Check Browser Developer Console

When booking from the UI, check the browser's Network tab:

1. **Open DevTools** → F12 or Right-click → Inspect
2. **Go to Network tab**
3. **Book an appointment**
4. **Click on the POST request** to `/api/appointments/:id/book`
5. **View Response tab** → Look for `googleMeetLink` and `googleEventId`

```
✅ Fields to look for:
- googleMeetLink: "https://meet.google.com/..." (URL should be valid)
- googleEventId: "abc123@google.com" (Event ID from Google Calendar)
```

### Method 4: Check Email Inbox

Both specialist and customer should receive booking invitation emails with:

**Email Content Includes:**
- ✅ Google Meet link to join the meeting
- ✅ Meeting date and time
- ✅ Appointment details
- ✅ Calendar invite file (ICS)

**Check email for:**
```
From: noreply@specialistly.com
To: specialist@gmail.com, customer@gmail.com
Subject: "Consulting Session Booking Confirmation"

Body should contain:
- Google Meet link: https://meet.google.com/xxx-xxxx-xxx
- Date & Time of appointment
- Other participant details
```

### Method 5: Check Google Calendar

If Google credentials are properly configured, the event appears in Google Calendar:

1. **Open Google Calendar** (specialist's account)
2. **Look for event** on the scheduled date/time
3. **Verify:**
   - ✅ Event title: "Consulting Session: {serviceTitle}"
   - ✅ Google Meet link present
   - ✅ Both attendees listed (specialist + customer)
   - ✅ Reminders set (24 hours + 30 minutes)

## 🔍 What to Check in Code

### Appointment Model Fields
[backend/models/AppointmentSlot.js](backend/models/AppointmentSlot.js)

```javascript
googleMeetLink: String,           // URL to the Google Meet
googleEventId: String,            // ID from Google Calendar
specialistEmail: String,          // Organizer
customerEmail: String,            // Attendee
customerName: String,
reminderSent: Boolean,            // Email reminder tracking
reminderSentAt: Date
```

### Booking Controller
[backend/controllers/appointmentController.js](backend/controllers/appointmentController.js#L95)

**Key section:**
```javascript
// Create Google Meet event
const meetData = await googleMeetService.createGoogleMeet({ ... });

// Save Google Meet details to slot
slot.googleEventId = meetData.googleEventId;
slot.googleMeetLink = meetData.googleMeetLink;

// Send invitation email
await googleMeetService.sendBookingInviteEmail({ ... });
```

### Google Meet Service
[backend/services/googleMeetService.js](backend/services/googleMeetService.js)

Contains:
- `createGoogleMeet()` - Creates the meet event
- `sendBookingInviteEmail()` - Sends invitation emails

## 📊 Possible Scenarios

| Scenario | Status | googleMeetLink | googleEventId | Email | Action |
|----------|--------|-----------------|---------------|-------|--------|
| **Full Success** | booked | ✅ Valid URL | ✅ Present | ✅ Sent | Working perfectly |
| **No Credentials** | booked | ⚠️ Placeholder | ⚠️ Placeholder | ⚠️ Basic | Configure Google credentials |
| **Email Failed** | booked | ✅ Valid URL | ✅ Present | ❌ Failed | Check email config |
| **Complete Failure** | available | ❌ Null | ❌ Null | ❌ Failed | Check error logs |

## 🔧 Troubleshooting

### Google Meet Link is Placeholder
**Problem:** `googleMeetLink` shows `https://meet.google.com/placeholder-...`

**Cause:** Google credentials not configured

**Fix:**
1. Set up [Google Cloud credentials](credentials.json)
2. Add to `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
   ```
3. Restart backend server

### Email Not Sent
**Problem:** Booking succeeds but no email received

**Cause:** Gmail credentials not configured

**Fix:**
1. Add to `.env`:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=your-app-password
   ```
2. Use [Google App Password](https://myaccount.google.com/apppasswords) (not regular password)
3. Restart backend server

### Booking Shows as Available (Not Booked)
**Problem:** Slot status stays "available"

**Cause:** Booking failed

**Fix:** Check server logs for error message

## 📝 Example Queries

### Find All Booked Appointments with Google Meet
```javascript
db.appointmentslots.find({
  status: "booked",
  googleMeetLink: { $exists: true, $ne: null }
})
```

### Find Appointments Where Google Meet Failed
```javascript
db.appointmentslots.find({
  status: "booked",
  $or: [
    { googleMeetLink: null },
    { googleMeetLink: /placeholder/ }
  ]
})
```

### Find Appointments by Specialist Email
```javascript
db.appointmentslots.find({
  specialistEmail: "specialist@gmail.com",
  status: "booked"
})
```

### Find Booked Appointments with Email Pending
```javascript
db.appointmentslots.find({
  status: "booked",
  reminderSent: false
})
```

## 🎯 Summary Checklist

When checking if Google Meet invitation was created and sent:

- ✅ Check appointment slot has `googleMeetLink` field with valid URL
- ✅ Verify `googleEventId` is present (from Google Calendar)
- ✅ Confirm both `customerEmail` and `specialistEmail` are set
- ✅ Check inbox for invitation email from system
- ✅ Verify Google Calendar shows event (if credentials configured)
- ✅ Look for confirmation message in browser console/UI

If all these are present, the Google Meet invitation was successfully created and sent! 🎉
