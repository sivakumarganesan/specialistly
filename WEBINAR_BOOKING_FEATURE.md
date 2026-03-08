# Webinar Date Update & Booking Feature

## Overview
Specialists can now create webinars with specific dates and times, update those dates, and customers can view and book available webinar sessions from the specialist's profile.

## Feature Components

### 1. **Specialist - Create/Update Webinar with Dates**

**Location:** Services Component (`src/app/components/Services.tsx`)

**Flow:**
1. Specialist selects "Webinar" service type
2. Chooses "Selected Dates" for session frequency
3. Adds specific webinar dates and times
4. Service saved to database with status "draft" initially
5. Can be updated anytime to change dates/times

**Database Storage:**
```javascript
{
  type: "webinar",
  sessionFrequency: "selected",
  webinarDates: [
    { date: "2026-02-10", time: "10:00" },
    { date: "2026-02-12", time: "14:30" }
  ]
}
```

### 2. **Customer - View Webinar Sessions**

**Location:** SpecialistProfile Component (`src/app/components/SpecialistProfile.tsx`)

**Display:**
- Webinar sessions shown in blue box labeled "🎥 Webinar Sessions"
- Shows first 3 dates with option to see more
- Format: "Feb 10 • 10:00"
- Only shows **active** services (status = "active")

**Requirements to See Webinars:**
- Service must be status "active" (not draft)
- Must have sessionFrequency = "selected"
- Must have at least one date in webinarDates array

### 3. **Customer - Book Webinar Session**

**Location:** SpecialistProfile Component - Booking Modal

**Flow:**
1. Customer clicks "Join Webinar" button on webinar service card
2. Booking modal opens showing all available webinar dates
3. Dates displayed in blue with date and time
4. Customer clicks date to confirm booking
5. Booking saved to customer record

**Booking Process:**
```typescript
handleConfirmServiceBooking() -> customerAPI.bookService({
  customerEmail,
  customerName,
  specialistEmail,
  specialistName,
  specialistId,
  serviceId,
  serviceTitle,
  webinarDate: "2026-02-10",
  webinarTime: "10:00",
  status: "confirmed"
})
```

**Result:**
- Customer receives confirmation email
- Booking saved to Customer record with booking status
- Specialist can see booking in customer list

## UI Workflow

### Specialist View (Services Tab)
1. Creates webinar with title, description, price
2. Selects "Webinar" type → "Selected Dates" frequency
3. Adds multiple dates/times using date picker
4. Publishes service (status = "active")
5. Dates now visible to customers

### Customer View (Browse Specialist Profile)
1. Clicks on specialist name/profile
2. Navigates to "Services" tab
3. Sees webinar cards with blue "Webinar Sessions" box
4. Clicks "Join Webinar" button
5. Modal shows all available dates
6. Selects date/time to confirm booking

## Technical Implementation

### Frontend Components Updated
- **SpecialistProfile.tsx**: 
  - Added `sessionFrequency`, `webinarDates`, `weeklySchedule` to Service interface
  - Added webinar date display in service cards
  - Added separate booking modal for webinars
  - Added `selectedWebinarDate` state for tracking selected date

### Backend Endpoints (No changes needed)
- Existing `/api/services` POST/PUT endpoints handle webinar data
- Existing `/api/customers/book` endpoint accepts webinar bookings

### Database Schema
- **Service Model** already supports:
  - `webinarDates: [{ date: String, time: String }]`
  - `sessionFrequency: "selected" | "onetime" | "repeat"`
  - `eventType: "single" | "multiple"`

- **Customer Model** already supports:
  - `bookings: [{ serviceId, bookedAt, status, webinarDate?, webinarTime? }]`

## Features Enabled

✅ Specialists can update webinar dates anytime  
✅ Updates reflected immediately on customer's view  
✅ Customers can see all available webinar dates  
✅ Customers can book specific webinar sessions  
✅ Bookings tracked in customer records  
✅ Both single and multiple webinar dates supported  
✅ Date/time clearly displayed in specialist profile  
✅ Clear distinction between webinars and consulting services  

## Testing

### Test Data Available
- Service: "Feb 10 profile" (ID: 698660268842af4984f76e01)
  - Type: webinar
  - Status: active
  - SessionFrequency: selected
  - WebinarDates: [{ date: "2026-02-10", time: "10:00" }]

### Test Commands
```bash
# Check webinar services in database
node backend/check-all-webinars.js

# Verify service filtering
node backend/test-service-filter.js

# Test webinar booking structure
node backend/test-webinar-booking.js
```

## Next Steps

1. ✅ Specialists can update webinar dates
2. ✅ Customers can see updated dates in profile
3. ✅ Customers can book webinar sessions
4. Optional: Send calendar invite in booking confirmation
5. Optional: Add webinar recording links after session
6. Optional: Add attendee list/capacity tracking
