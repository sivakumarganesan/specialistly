# Webinar System Testing Guide

## Overview
This guide covers testing the complete webinar system including:
- Creating webinars in draft mode
- Publishing webinars to activate them and generate booking slots
- Verifying automatic slot generation for all event type combinations
- Testing the booking workflow from user perspective

## System Architecture

### Event Type Combinations
The system supports three main configurations:

| Event Type | Frequency | Behavior | Slots |
|-----------|-----------|----------|-------|
| **Single** | Onetime | One date/time session | 1 slot per date |
| **Single** | N/A | (frequency ignored) | Same as above |
| **Multiple** | Selected | Multiple specific dates | 1 slot per date |
| **Multiple** | Repeat | Recurring weekly | 12 weeks × enabled days |

### Default Slot Generation Range
- **Repeat/Weekly**: Generates 12 weeks of slots starting from today
- **Single/Selected Dates**: Generates slots for specified dates only

---

## Test Case 1: Single Day Event (Onetime)

### Setup
1. Login as specialist
2. Navigate to **Settings** → **Offerings** → **Webinars & Events**
3. Click **"Create Webinar"**

### Configuration
- **Title**: "Python Basics - Single Session"
- **Description**: "Introduction to Python programming"
- **Price**: $29.99
- **Duration**: 60 minutes
- **Capacity**: 30 students
- **Location**: Google Meet
- **Event Type**: **Single Day**
- **Date**: 2026-02-28
- **Start Time**: 10:00 AM
- **Session Frequency**: Onetime (auto)

### Expected Behavior
1. Webinar created with "Draft" status (indicated by 🔒 lock icon)
2. No booking slots generated yet
3. "Publish" button appears in the webinar card

### Test Steps
1. **Before Publishing**:
   - Click "Edit" - verify configuration saved correctly
   - Status shows "Draft"
   - "Publish" button is visible

2. **Publish the Webinar**:
   - Click "Publish" button
   - Success message: "Webinar published! 1 booking slot created."
   - Refresh the page (F5)
   - Status now shows "Published" (👁️ eye icon)
   - "Publish" button disappears

3. **Verify Slots Created**:
   - Frontend: Go to specialist landing page (`/specialist/{slug}`)
   - Scroll to "Available Webinars"
   - Find "Python Basics - Single Session"
   - Click "View Times"
   - Should see 1 available slot:
     ```
     Feb 28, 2026 | 10:00 AM - 11:00 AM
     Capacity: 29/30 available
     ```

### Backend Verification
```
Logs should show:
📝 Publishing webinar: "Python Basics - Single Session"
   Event Type: single
   Session Frequency: onetime
   ✓ Status changed to: active
   ✓ Processing 1 date(s) for single day event
     → Slot: 2026-02-28 @ 10:00 (60min, capacity: 30)
   ✓ Generated and saved 1 booking slots
```

---

## Test Case 2: Multiple Dates (Selected Dates)

### Setup
1. Create new webinar
2. Fill basic info (title, description, price, location, etc.)

### Configuration
- **Title**: "React Workshop - 3 Sessions"
- **Description**: "Multi-day React intensive workshop"
- **Price**: $99.99
- **Duration**: 90 minutes
- **Capacity**: 20 students
- **Location**: Zoom
- **Event Type**: **Multiple Days**
- **Session Frequency**: **On Selected Dates**
- **Add 3 Dates**:
  - Date 1: 2026-03-15, Time: 2:00 PM, Duration: 90 min, Capacity: 20
  - Date 2: 2026-03-22, Time: 2:00 PM, Duration: 90 min, Capacity: 20
  - Date 3: 2026-03-29, Time: 2:00 PM, Duration: 90 min, Capacity: 20

### Test Steps
1. **Create and Save**:
   - Click "Create Webinar"
   - Fill in all fields
   - Click "Save as Draft"
   - Confirm "Draft" status appears

2. **Publish**:
   - Click "Publish" button
   - Success message should say: "Webinar published! 3 booking slots created."

3. **Verify Slots**:
   - On landing page, click "View Times"
   - Should see all 3 dates with correct times:
     ```
     Mar 15, 2026 | 2:00 PM - 3:30 PM
     Mar 22, 2026 | 2:00 PM - 3:30 PM
     Mar 29, 2026 | 2:00 PM - 3:30 PM
     ```

### Backend Verification
```
Logs should show:
📝 Publishing webinar: "React Workshop - 3 Sessions"
   Event Type: multiple
   Session Frequency: selected
   ✓ Status changed to: active
   ✓ Processing 3 selected date(s)
     → Slot: 2026-03-15 @ 14:00 (90min, capacity: 20)
     → Slot: 2026-03-22 @ 14:00 (90min, capacity: 20)
     → Slot: 2026-03-29 @ 14:00 (90min, capacity: 20)
   ✓ Generated and saved 3 booking slots
```

---

## Test Case 3: Recurring Weekly Event

### Setup
1. Create new webinar for recurring sessions
2. Configure weekly schedule

### Configuration
- **Title**: "JavaScript Bootcamp - Weekly"
- **Description**: "12-week JavaScript mastery program"
- **Price**: $299.99
- **Duration**: 120 minutes (2 hours)
- **Capacity**: 25 students
- **Location**: Google Meet + In-person
- **Event Type**: **Multiple Days**
- **Session Frequency**: **Repeating Weekly**
- **Weekly Schedule**:
  - Monday: 6:00 PM, 120 min, Capacity 25 ✓ Enabled
  - Wednesday: 6:00 PM, 120 min, Capacity 25 ✓ Enabled
  - Friday: 6:00 PM, 120 min, Capacity 25 ✓ Enabled
  - (Saturday/Sunday disabled)

### Test Steps
1. **Create and Save**:
   - Configure as described above
   - Make sure Mon/Wed/Fri are checked as enabled
   - Click "Save as Draft"

2. **Verify Draft**:
   - Status shows "Draft"
   - Edit should show correct schedule

3. **Publish**:
   - Click "Publish"
   - Success message: "Webinar published! 36 booking slots created."
   - (12 weeks × 3 days = 36 total)

4. **Verify Slots on Landing Page**:
   - Should see 36 slots across 12 weeks
   - Examples:
     ```
     Week 1:
     - Mon, Feb 23 @ 6:00 PM - 8:00 PM
     - Wed, Feb 25 @ 6:00 PM - 8:00 PM
     - Fri, Feb 27 @ 6:00 PM - 8:00 PM
     
     Week 2:
     - Mon, Mar 2 @ 6:00 PM - 8:00 PM
     - Wed, Mar 4 @ 6:00 PM - 8:00 PM
     - Fri, Mar 6 @ 6:00 PM - 8:00 PM
     
     ... (continues for 12 weeks)
     ```

### Backend Verification
```
Logs should show:
📝 Publishing webinar: "JavaScript Bootcamp - Weekly"
   Event Type: multiple
   Session Frequency: repeat
   ✓ Status changed to: active
   ✓ Processing 3 recurring day(s) for 12 weeks
     → 12 weeks starting from today
     → Enabled: Monday, Wednesday, Friday
   ✓ Generated and saved 36 booking slots
```

---

## Test Case 4: User Booking Workflow

### Complete End-to-End Test
Use one of the published webinars from above tests.

#### Step 1: Browse Webinars
1. **As Regular User** (not logged in):
   - Visit specialist page: `https://specialistly.com/specialist/{specialist-slug}`
   - Scroll to "Available Webinars" section
   - Should see all published webinars in a card layout

#### Step 2: View Available Times
2. Click "View Times" on any webinar
   - Opens booking interface
   - Step 1: Shows all available slots with status
   - Each slot displays: Date | Time | Duration | Availability

#### Step 3: Select Slot
3. Click any available slot
   - Slot becomes highlighted/selected
   - Shows duration and end time clearly
   - Moves to Step 2: User Details

#### Step 4: Enter Details
4. Fill in user information:
   - Email
   - First Name
   - Last Name
   - Any additional fields

#### Step 5: Confirm Booking
5. Review booking summary
   - Webinar title, date, time, duration
   - User email and name
   - Pricing (if applicable)
   - Terms acceptance checkbox

6. Click "Book Webinar"
   - Should see success message
   - Modal closes
   - User returns to webinar listing

#### Step 6: Verify Email
7. **Check inbox**:
   - Should receive booking confirmation email
   - Email contains:
     - Webinar title and details
     - Date, time, and duration
     - Meeting link (if configured)
     - Cancellation instructions

#### Step 7: Specialist Verification
8. **As Specialist** - Check Dashboard:
   - Settings → Offerings → Webinars
   - Click "Edit" on the webinar that was booked
   - Check available slots - one should now be "booked"
   - Should see 1 booked, N-1 available

---

## Critical Test Scenarios

### ✅ Pass Criteria

**Slot Generation**:
- [ ] Single day creates exactly 1 slot
- [ ] Multiple dates creates N slots (one per date)
- [ ] Weekly repeating creates 36 slots (12 weeks × 3 days)

**Status Changes**:
- [ ] New webinar defaults to "Draft"
- [ ] Publishing changes status to "Active"
- [ ] Active webinars show "Published" badge
- [ ] Draft webinars show "Draft" badge + "Publish" button

**User Booking**:
- [ ] User can see all published webinars
- [ ] User can view available slots
- [ ] User can select a slot
- [ ] User receives confirmation email
- [ ] Slot status changes from available→booked

**API Operations**:
- [ ] Publish endpoint generates correct slot count
- [ ] Each slot has correct date/time/duration
- [ ] Capacity matches webinar configuration
- [ ] Slots are linked to correct webinar

---

## Debugging Tips

### Check Browser Console
```javascript
// Verify API call was successful
console.log('Publish response:', {...});

// Check webinar status
console.log('Webinar status:', webinar.status);

// Verify slot count
console.log('Slots generated:', response.slotsGenerated);
```

### Check Backend Logs (Railway)
1. Go to Railway dashboard
2. Select service (backend)
3. View "Logs" tab
4. Filter by keywords: "📝 Publishing", "✓ Processing", "Generated"

### MongoDB Query (if needed)
```javascript
// Count slots for a webinar
db.appointmentslots.countDocuments({ 
  serviceTitle: "Python Basics - Single Session" 
})

// Find all webinars by specialist
db.services.find({ 
  creator: "specialist@email.com",
  eventType: { $exists: true }
})

// Check slot status
db.appointmentslots.find(
  { serviceTitle: "Python Basics" },
  { date: 1, time: 1, status: 1 }
)
```

---

## Expected Outcomes After Testing

After completing all test cases, you should have:

✅ **3 Active Webinars**:
- 1 single day (1 slot)
- 1 multiple selected dates (3 slots)
- 1 recurring weekly (36 slots)

✅ **40 Total Booking Slots** (1 + 3 + 36)

✅ **Publishing Functionality**:
- Draft → Active conversion works
- Slots auto-generate on publish
- Each slot type generates correct count

✅ **Booking Workflow**:
- Users can find and book slots
- Confirmation emails sent
- Specialist sees bookings in dashboard

---

## Troubleshooting

### "Webinar published but no slots created"
- Check backend logs for errors
- Verify webinarDates or weeklySchedule are populated
- Ensure eventType and sessionFrequency match

### "Publish button missing"
- Refresh page (F5)
- Check webinar status in edit modal
- Verify status is "draft" not "active"

### "Slots showing wrong dates"
- Verify timezone configuration
- Check webinarDates array in database
- Ensure duration calculations are correct

### "Email not received"
- Check spam folder
- Verify Resend API is configured
- Check VITE_API_URL environment variable
- See EMAIL_TROUBLESHOOTING.md for details

---

## Commission & Success Metrics

This webinar system enables:
- ✅ Specialists to create flexible event structures
- ✅ Automatic slot generation (no manual creation)
- ✅ Users to self-serve book available times
- ✅ Scalable solution (handles 100+ slots easily)
