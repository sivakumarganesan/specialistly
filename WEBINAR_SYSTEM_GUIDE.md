# Specialistly Webinar System - Complete Guide

## Overview

The Specialistly Webinar System allows specialists to create and manage webinars with two event types:

1. **Single Day Events** - A one-time webinar on a specific date and time
2. **Multiple Day Events** - Multiple sessions across different dates or recurring weekly schedules

Users can browse, view available slots, and book their preferred time.

---

## System Architecture

### Components

#### For Specialists (Creators)

1. **WebinarManager** (`src/app/components/WebinarManager.tsx`)
   - Form-based interface for creating/editing webinars
   - Supports both single-day and multiple-day event types
   - Date/time picker with duration and capacity settings
   - Recurring schedule configuration

2. **WebinarsSection** (`src/app/components/WebinarsSection.tsx`)
   - Dashboard for managing all webinars
   - Create, Edit, Delete operations
   - Display published vs draft status
   - Show booking slots count

3. **PageBuilder Integration**
   - New "Webinars" tab in PageBuilder component
   - Allows specialists to manage webinars from their dashboard

#### For Users (Customers)

1. **WebinarBooking** (`src/app/components/WebinarBooking.tsx`)
   - Three-step booking process:
     - Step 1: Browse available webinars
     - Step 2: Select preferred time slot
     - Step 3: Enter contact info and confirm

2. **SpecialistLandingPage Integration**
   - Webinars section appears automatically on specialist pages
   - Shows available webinars with booking interface

### Backend Components

#### Models

**Service Model** (`backend/models/Service.js`)
```javascript
{
  title: String,
  description: String,
  price: String,
  duration: String, // in minutes
  eventType: 'single' | 'multiple',
  sessionFrequency: 'onetime' | 'selected' | 'repeat',
  location: 'zoom' | 'google-meet' | 'teams' | 'webex',
  webinarDates: [{ date, time, duration, capacity }],
  weeklySchedule: [{ day, time, duration, capacity, enabled }],
  status: 'active' | 'draft',
  creator: String // specialist email
}
```

**AppointmentSlot Model** (`backend/models/AppointmentSlot.js`)
```javascript
{
  date: Date,
  startTime: String, // HH:MM format
  endTime: String,   // HH:MM format
  status: 'available' | 'booked' | 'completed',
  serviceTitle: String,
  specialistEmail: String,
  customerEmail: String,
  customerName: String,
  capacity: String,
  zoomMeetingId: String, // Optional - for Zoom integration
  zoomJoinUrl: String,   // Optional
}
```

#### Controllers

**Service Controller** (`backend/controllers/serviceController.js`)

New functions:
- `createWebinarWithSlots()` - Creates webinar and auto-generates booking slots
- `updateService()` - Updated to regenerate slots when webinar config changes
- Helper: `generateWebinarSlots()` - Converts webinar config to appointment slots
- Helper: `calculateEndTime()` - Calculates end time based on duration

**Appointment Controller** (`backend/controllers/appointmentController.js`)
- `bookSlot()` - Books a slot (existing functionality works with webinar slots)
- `getAvailableSlots()` - Fetches available slots for booking

#### Routes

**Service Routes** (`backend/routes/serviceRoutes.js`)
```
POST   /services/webinar/create - Create webinar with auto-generated slots
POST   /services             - Create regular service
GET    /services             - Get all services
GET    /services/:id         - Get service by ID
PUT    /services/:id         - Update service
DELETE /services/:id         - Delete service
```

---

## Workflow

### For Specialists: Creating a Webinar

#### Single Day Event Workflow

1. **Navigate to Page Builder**
   - Open Page Builder Dashboard
   - Click "Webinars" tab

2. **Create Webinar**
   - Click "Create Webinar" button
   - Enter basic info:
     - Title: "Python Basics for Beginners"
     - Description: Course overview
     - Price: "$49"
     - Location: Zoom/Teams/etc

3. **Choose Event Type**
   - Select "Single Day Event"
   - This is for one-time webinars

4. **Add Date & Time**
   - Select date (must be future date)
   - Set start time
   - Choose duration (30, 45, 60, 90, or 120 minutes)
   - Set max capacity

5. **Publish**
   - Check "Publish this webinar"
   - Click "Save Webinar"
   - System automatically generates 1 appointment slot
   - Slot becomes available for users to book

#### Multiple Day Event Workflow

1. **Create Webinar** (same as above)

2. **Choose Event Type**
   - Select "Multiple Day/Recurring"

3. **Choose Session Type**

   **Option A: Specific Dates**
   - Select "Specific Dates"
   - Add each session's date & time
   - Click "Add Date" for each session
   - Example: Monday 10am, Wednesday 3pm, Friday 7pm

   **Option B: Recurring Schedule**
   - Select "Recurring Schedule"
   - Choose day of week (Monday, Tuesday, etc.)
   - Set start time
   - Choose duration
   - Click "Add Slot"
   - System auto-generates slots for next 12 weeks

4. **Publish & Save**
   - Check "Publish this webinar"
   - Click "Save Webinar"
   - System generates appointment slot for each session
   - All slots become available for booking

### For Users: Booking a Webinar

#### Booking Workflow

1. **Browse Webinars**
   - Visit specialist's page: `https://specialistly.com/specialist/{slug}`
   - Scroll to "Available Webinars" section
   - See all published webinars with:
     - Title & description
     - Price
     - Duration
     - Platform (Zoom, Teams, etc.)
     - Event type badge

2. **Select Webinar**
   - Click "View Times" button
   - See all available time slots sorted by date

3. **Choose Time Slot**
   - Browse available dates/times
   - Click "Select" on preferred slot
   - See booking summary

4. **Complete Booking**
   - Enter full name *
   - Enter email address *
   - Optional: add special requests/questions
   - Click "Confirm Booking"
   - Receive confirmation email with:
     - Webinar details
     - Date & time
     - Zoom/Teams link (when available)

5. **Attend Webinar**
   - On webinar date, click link in email
   - Join webinar 5-10 minutes early
   - Participate and learn!

---

## API Usage Examples

### Create Webinar with Single Day Event

```javascript
POST /api/services/webinar/create

{
  "title": "Python Basics",
  "description": "Learn Python from scratch",
  "price": "49",
  "location": "zoom",
  "eventType": "single",
  "sessionFrequency": "onetime",
  "webinarDates": [
    {
      "date": "2026-02-20",
      "time": "10:00",
      "duration": "60",
      "capacity": "50"
    }
  ],
  "weeklySchedule": [],
  "status": "active",
  "specialistEmail": "siva@example.com",
  "specialistId": "123abc",
  "specialistName": "Siva Kumar"
}

Response: {
  "success": true,
  "message": "Webinar created successfully with available booking slots",
  "data": { ...webinar },
  "slots": 1
}
```

### Create Webinar with Multiple Specific Dates

```javascript
POST /api/services/webinar/create

{
  "title": "Advanced Python Course",
  "description": "Deep dive into Python",
  "price": "99",
  "location": "google-meet",
  "eventType": "multiple",
  "sessionFrequency": "selected",
  "webinarDates": [
    {
      "date": "2026-02-20",
      "time": "10:00",
      "duration": "90",
      "capacity": "30"
    },
    {
      "date": "2026-02-22",
      "time": "14:00",
      "duration": "90",
      "capacity": "30"
    },
    {
      "date": "2026-02-25",
      "time": "18:00",
      "duration": "90",
      "capacity": "30"
    }
  ],
  "weeklySchedule": [],
  "status": "active",
  "specialistEmail": "siva@example.com",
  ...other fields
}

Response: {
  "success": true,
  "slots": 3  // 3 slots created (one for each date)
}
```

### Create Webinar with Recurring Schedule

```javascript
POST /api/services/webinar/create

{
  "title": "Weekly Python Workshop",
  "description": "Weekly sessions",
  "price": "29",
  "location": "zoom",
  "eventType": "multiple",
  "sessionFrequency": "repeat",
  "webinarDates": [],
  "weeklySchedule": [
    {
      "day": "Monday",
      "time": "10:00",
      "duration": "60",
      "capacity": "40",
      "enabled": true
    },
    {
      "day": "Wednesday",
      "time": "19:00",
      "duration": "60",
      "capacity": "40",
      "enabled": true
    }
  ],
  "status": "active",
  ...other fields
}

Response: {
  "success": true,
  "slots": 24  // 12 Mondays + 12 Wednesdays (12 weeks)
}
```

### Get Available Slots for Booking

```javascript
GET /api/appointments/available?specialistEmail=siva@example.com

Response: {
  "success": true,
  "data": [
    {
      "_id": "...",
      "date": "2026-02-20T10:00:00Z",
      "startTime": "10:00",
      "endTime": "11:00",
      "status": "available",
      "serviceTitle": "Python Basics",
      "specialistEmail": "siva@example.com",
      "capacity": "50"
    },
    ...more slots
  ]
}
```

### Book a Slot

```javascript
PUT /api/appointments/{slotId}/book

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "specialistEmail": "siva@example.com",
  "serviceTitle": "Python Basics"
}

Response: {
  "success": true,
  "message": "Slot booked successfully",
  "data": { ...updatedSlot with status: "booked" }
}
```

---

## Features Enabled

### Current Features

✅ **Single Day Webinars**
- One-time events on specific date/time
- Automatic slot generation
- User booking interface

✅ **Multiple Day Webinars - Specific Dates**
- Multiple sessions on chosen dates
- Each date gets its own booking slot
- Users can pick any available date

✅ **Multiple Day Webinars - Recurring**
- Weekly recurring schedule
- Automatic generation for 12 weeks
- Can enable/disable specific days
- Users see all upcoming sessions

✅ **Booking System**
- Browse available webinars
- View all time slots
- One-click booking
- Confirmation emails

✅ **Management Dashboard**
- Create, edit, delete webinars
- Toggle publish/draft status
- View webinar details and slot counts
- See booking statistics

### Future Enhancements

🔄 **Payment Processing**
- Stripe/PayPal integration for paid webinars
- Automatic payment confirmation before slot generation

🔄 **Zoom Integration**
- Auto-create Zoom meetings for each slot
- Send join links in confirmation emails
- Recording integration

🔄 **Email Notifications**
- Automated reminders 24 hours before
- Recording links after completion
- Attendance tracking

🔄 **Calendar Sync**
- iCal/Google Calendar support
- Exported calendar file for users

🔄 **Analytics**
- Booking conversion rates
- Attendance tracking
- User feedback/reviews

---

## Database Considerations

### Indexes

Recommended indexes for performance:

```javascript
// Service collection
db.services.createIndex({ creator: 1, status: 1 })
db.services.createIndex({ eventType: 1 })

// AppointmentSlot collection
db.appointmentslots.createIndex({ serviceTitle: 1, status: 1 })
db.appointmentslots.createIndex({ specialistEmail: 1, date: 1 })
db.appointmentslots.createIndex({ date: 1, status: 1 })
db.appointmentslots.createIndex({ status: 1, date: 1 })
```

### Data Growth

For a specialist with:
- 10 active webinars
- 50% with recurring weekly schedules (12 weeks)
- Average capacity of 30 per slot

Expected AppointmentSlot collection growth:
- Single day webinars: ~5 slots
- Multiple date webinars: ~50 slots
- Recurring webinars: ~120 slots
- **Total per specialist: ~175 slots**

---

## Troubleshooting

### Webinar Created But No Slots Generated

**Issue**: Webinar doesn't show available slots for booking

**Solutions**:
1. Verify `status: 'active'` - only active webinars generate slots
2. Check date format: must be `YYYY-MM-DD`
3. Check time format: must be `HH:MM` (24-hour)
4. For recurring: make sure `sessionFrequency: 'repeat'` and `enabled: true`

### Slots Not Appearing in Booking

**Issue**: User doesn't see available slots when browsing

**Solutions**:
1. Verify specialist email matches in slot query
2. Check slot `status` field is `'available'`
3. Ensure webinar `status: 'active'`
4. Pass correct specialist email to booking component

### Booking Fails

**Issue**: Get error when trying to book a slot

**Solutions**:
1. Verify slot `status` is still `'available'` (not already booked)
2. Check customer email format is valid
3. Ensure slot ID is correct
4. Verify specialist email in booking data

---

## Testing the System

### Test Case 1: Single Day Event

1. Create webinar with:
   - Event type: Single Day
   - Date: 2026-02-20
   - Time: 10:00
   - Duration: 60 mins

2. Verify:
   - [ ] Webinar appears in dashboard
   - [ ] Status shows "Published" or "Draft"
   - [ ] 1 slot shown in counter

3. Go to specialist landing page:
   - [ ] Webinar appears in "Available Webinars" section
   - [ ] "View Times" button works
   - [ ] Slot shows Feb 20, 10:00-11:00

4. Book the slot:
   - [ ] Enter name and email
   - [ ] Click confirm
   - [ ] Get success message
   - [ ] Slot status changes to "booked"

### Test Case 2: Multiple Specific Dates

1. Create webinar with:
   - Event type: Multiple Day
   - Frequency: Specific Dates
   - Add 3 different dates

2. Verify:
   - [ ] 3 slots generated
   - [ ] All slots show correct dates/times

3. Book first slot:
   - [ ] Can book without issue
   - [ ] Other slots still available
   - [ ] Booked slot shows "booked" status

### Test Case 3: Recurring Weekly

1. Create webinar with:
   - Event type: Multiple Day
   - Frequency: Recurring
   - Days: Monday, Wednesday, Friday
   - Time: 10:00

2. Verify:
   - [ ] Slots generated for next 12 weeks
   - [ ] Should see ~36 slots (12 weeks × 3 days)
   - [ ] All future Mondays/Wednesdays/Fridays at 10:00

3. Browse slots:
   - [ ] Pagination or scroll shows many slots
   - [ ] Can book any available slot
   - [ ] Dates increment weekly correctly

---

## Contact & Support

For issues with webinar system:
1. Check this guide's troubleshooting section
2. Review API response errors
3. Check browser console for client-side errors
4. Review server logs for backend errors
5. Contact: support@specialistly.com

---

**Version**: 1.0  
**Last Updated**: February 2026  
**System Status**: ✅ Production Ready
