# Zoom Meeting Establishment Guide

## Overview

The Specialistly platform supports Zoom meetings for specialists and participants (customers). Here's how meetings are established and accessed by both parties.

---

## 🎯 How Meetings Are Created

### 1. **Participant Books an Appointment Slot**

```
Participant (Customer)
  ↓
  Books appointment slot (via SpecialistProfile.tsx)
  ↓
  HTTP POST → /api/appointments/{slotId}/book
  ├── customerEmail
  ├── customerName
  ├── specialistEmail
  ├── specialistName
  └── specialistId
```

### 2. **Backend Creates Zoom Meeting**

When the slot is booked, the `appointmentController.bookSlot()` function:

```javascript
// appointmentController.js - Line 101
meetData = await zoomService.createZoomMeeting({
  specialistEmail,
  specialistName,
  specialistId,
  customerEmail,
  customerName,
  serviceTitle,
  startDateTime,
  endDateTime,
});
```

### 3. **Zoom Meeting Created**

The `createZoomMeeting()` function performs these steps:

```javascript
// zoomService.js - Line 85
1. Get Zoom OAuth access token
   ↓
2. Create meeting payload with:
   - Topic: "{serviceTitle} - {customerName}"
   - Type: Scheduled meeting (type 2)
   - Start time: appointment date/time
   - Duration: calculated from endTime - startTime
   - Cloud recording: Enabled
   - Waiting room: Enabled
   - Auto-approval: Yes
   ↓
3. POST to Zoom API:
   POST /v2/users/{specialistId}/meetings
   ↓
4. Return meeting details:
   {
     zoomMeetingId: "123456789",
     joinUrl: "https://zoom.us/j/123456789?pwd=...",
     startUrl: "https://zoom.us/start/...",
     hostId: specialistId,
     recordingEnabled: true
   }
```

### 4. **Meeting Details Stored**

The appointment slot is updated with meeting details:

```javascript
slot.meetingProvider = 'zoom';
slot.zoomMeetingId = meetData.zoomMeetingId;
slot.zoomJoinUrl = meetData.joinUrl;         // Participant link
slot.zoomStartUrl = meetData.startUrl;       // Host/specialist link
slot.status = 'booked';
await slot.save();
```

### 5. **Confirmation Emails Sent**

Invitations are sent to both specialist and participant:

```javascript
await zoomService.sendMeetingInvitation({
  specialistEmail,      // Specialist receives invite with start URL
  customerEmail,        // Participant receives invite with join URL
  serviceTitle,
  joinUrl: meetData.joinUrl,      // For customer
  zoomMeetingId: meetData.zoomMeetingId,
});
```

---

## 👥 How Specialist Joins the Meeting

### **Specialist Side:**

1. **Receives Email Invitation**
   - Email contains: Meeting topic, time, and **Host Start URL**
   - Start URL allows specialist to launch/start the meeting

2. **Click "Start Meeting" in Email**
   - Navigates to: `https://zoom.us/start/{meetingId}?...`
   - Opens Zoom desktop app or web client
   - Specialist is automatically the host

3. **Alternative - Via Specialistly Dashboard**
   - Navigate to calendar/dashboard
   - Find upcoming appointment
   - Click "Start Meeting" button
   - Redirects to Zoom start URL

### **Access Details:**

```
Specialist:
├── Start URL (Host)
│   └── Allows starting the meeting before participants
│
├── Host Controls
│   ├── Mute/unmute participants
│   ├── Enable/disable video
│   ├── Record to cloud
│   ├── Manage waiting room
│   └── End meeting
│
└── Meeting ID: 123456789
    └── Backup option if URL doesn't work
```

---

## 👤 How Participant Joins the Meeting

### **Participant (Customer) Side:**

1. **Receives Email Invitation**
   - Email contains: Meeting topic, time, and **Join URL**
   - Join URL allows participant to join the meeting

2. **Click "Join Meeting" in Email**
   - Navigates to: `https://zoom.us/j/{meetingId}?pwd={password}`
   - Opens Zoom app or web client
   - Participant joins directly

3. **Alternative - Via Specialistly Dashboard**
   - Login to Specialistly
   - Navigate to "My Learning & Bookings"
   - Click "Scheduled Appointments" tab
   - Find appointment with Zoom link
   - Click "Join Meeting" button

### **Access Details:**

```
Participant:
├── Join URL
│   └── Direct link to join meeting
│
├── Meeting ID: 123456789
│   └── Manual entry if link doesn't work
│
├── Waiting Room
│   ├── Participant joins waiting room first
│   ├── Specialist approves entry
│   └── Then enters main meeting
│
└── Features
    ├── Video/audio (can be enabled)
    ├── Chat
    ├── Screen sharing (if allowed)
    └── View cloud recording (after meeting)
```

---

## 🔄 Meeting Flow Timeline

### **Before Meeting**

```
T-24 hours: Email invitations sent
   ├── Specialist: "Your meeting starts tomorrow at 2:00 PM"
   ├── Participant: "Your appointment is tomorrow at 2:00 PM"
   └── Both include meeting links

T-0 minutes: Meeting time arrives
   ├── Specialist can click "Start URL" to launch meeting
   ├── Participant sees "Join Meeting" button active
   └── Waiting room enabled
```

### **During Meeting**

```
Specialist joins first:
├── Click start URL or "Start Meeting" button
├── Zoom opens (app or browser)
├── Meeting starts immediately (host privilege)
└── Waiting room becomes active

Participant joins:
├── Click join URL or "Join Meeting" button
├── Zoom opens (app or browser)
├── Enters waiting room
├── Specialist approves entry
└── Participant enters main meeting room

During Session:
├── Both can see video/audio
├── Both can chat
├── Specialist can record (auto-recording enabled)
├── Specialist can control features
└── Either can end the meeting
```

### **After Meeting**

```
T+5 minutes after end:
├── Recording processed by Zoom
├── Cloud recording available
├── Recording shared link created
└── Participants notified

Specialist:
├── Access recording from Zoom account
├── Download or share recording
└── Send recording link to participant

Participant:
├── Receives recording link via email
├── Can watch recording in Specialistly dashboard
└── Keep for reference
```

---

## 🔐 Security Features

### **Waiting Room**
- Participants enter waiting room first
- Specialist must approve each participant
- Prevents unwanted joins

### **Authentication**
- Meeting password generated automatically
- Password included in join URL
- No password needed if using direct link

### **Recording**
- Cloud recording enabled by default
- Only specialist can download
- Recording stored securely
- Participant can access if link shared

### **Meeting Controls**
- Specialist (host) has full control
- Can mute participants
- Can disable participant video
- Can remove participants if needed
- Can lock meeting once started

---

## 📋 Appointment Slot Fields

When a meeting is created, the slot stores:

```javascript
{
  _id: ObjectId,
  date: "2026-01-30",
  startTime: "14:00",
  endTime: "15:00",
  status: "booked",
  
  // Participant info
  customerName: "John Doe",
  customerEmail: "john@example.com",
  
  // Specialist info
  specialistName: "Dr. Smith",
  specialistEmail: "smith@example.com",
  specialistId: "sZjA3jD8f9K",
  
  // Zoom info
  meetingProvider: "zoom",
  zoomMeetingId: "123456789",
  zoomJoinUrl: "https://zoom.us/j/123456789?pwd=xyz",
  zoomStartUrl: "https://zoom.us/start/123456789?...",
  zoomHostId: "sZjA3jD8f9K",
  
  // Other details
  serviceTitle: "Consulting Session",
  bookedAt: "2026-01-29T10:30:00Z"
}
```

---

## 🚀 Quick Start for Users

### **For Specialist (Host)**
1. ✅ Wait for participant to book appointment
2. 📧 Receive email with "Start Meeting" link
3. 🎥 Click link at meeting time
4. ⏹️ Meeting starts under your control
5. 🎬 Cloud recording saves automatically
6. 📤 Send recording to participant after

### **For Participant (Customer)**
1. ✅ Book appointment with specialist
2. 📧 Receive email with "Join Meeting" link
3. 🎥 Click link at meeting time
4. ⏳ Wait in waiting room for specialist approval
5. 💬 Enter meeting and connect
6. 🎬 Access recording after meeting ends

---

## ⚙️ Technical Configuration

### **Environment Variables**
```env
# Server-to-Server OAuth (for admin)
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret

# User-Managed OAuth (optional, for user accounts)
ZOOM_USER_MANAGED_CLIENT_ID=user_client_id
ZOOM_USER_MANAGED_CLIENT_SECRET=user_client_secret
ZOOM_REDIRECT_URI=http://localhost:5001/api/zoom/oauth/user-callback
```

### **API Endpoints**

**For Specialists (Dashboard)**
```
GET /api/zoom/meetings/:specialistId
GET /api/zoom/recordings/:specialistId/:meetingId
POST /api/zoom/recording/share - Send recording to participant
```

**For Participants (My Bookings)**
```
GET /api/appointments/:email/appointments
  Returns all booked appointments with zoom details
```

---

## 🆘 Troubleshooting

### **Participant doesn't see Join button**
- Check appointment status is "booked"
- Check meeting time hasn't passed
- Refresh browser page
- Check internet connection

### **Start/Join URL not working**
- Use Meeting ID instead: `123456789`
- Check Zoom app is installed/up to date
- Try web client: `zoom.us`
- Check participant has email with correct link

### **Waiting room approval not showing**
- Specialist must be in meeting first
- Waiting room is enabled by default
- Check browser notifications

### **Recording not saved**
- Meeting must have lasted at least 30 seconds
- Cloud recording must be enabled (default)
- Check Zoom cloud storage quota
- Recording takes 5-15 minutes to process

---

## 📞 Support

For meeting issues:
1. Check email invitation for correct details
2. Verify Zoom app/browser compatibility
3. Test camera/microphone before meeting
4. Join 5 minutes early for tech check
5. Contact specialist if cannot join

