# Consulting Slot Booking Flow - Complete Guide

## Overview

The consulting slot booking system provides a seamless end-to-end experience for customers to discover, select, and book availability from specialists.

## System Components

### 1. **Backend - Slot Availability Filtering**

**Endpoint:** `GET /api/consulting-slots/customer/available`

**Query Parameters:**
- `specialistEmail` - Email of the specialist
- `startDate` - Start date for filtering (YYYY-MM-DD)
- `endDate` - End date for filtering (YYYY-MM-DD)

**Filtering Logic:**
```
Returns slots where:
✅ status === "active"
✅ isFullyBooked === false
✅ date >= now (future only)
✅ Respects minBookingNotice rule (e.g., 24 hours in advance)
✅ Respects maxAdvanceBooking rule (e.g., max 90 days ahead)
❌ Excludes past slots
❌ Excludes fully booked slots
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "slot_123",
      "date": "2026-03-15T00:00:00Z",
      "startTime": "14:00",
      "endTime": "15:00",
      "duration": 60,
      "status": "active",
      "bookedCount": 0,
      "totalCapacity": 1,
      "isFullyBooked": false
    }
  ],
  "appliedRules": {
    "minBookingNotice": 24,
    "maxAdvanceBooking": 90
  }
}
```

---

## 2. **Frontend - Calendar Component**

### ConsultingSlotCalendar Component

**Location:** `src/app/components/ConsultingSlotCalendar.tsx`

**Features:**
- Displays calendar with month navigation
- Shows available slots grouped by date
- Mini calendar highlighting dates with availability
- Real-time slot selection with visual feedback

**Props:**
```typescript
interface ConsultingSlotCalendarProps {
  specialistEmail: string;           // Specialist's email
  onSelectSlot?: (slot) => void;     // Callback when slot selected
  defaultDuration?: number;          // Default slot duration (60 min)
}
```

**User Actions:**
1. View calendar for current month
2. See dates highlighted with available slots
3. Click on a time slot button
4. Selected slot displays below with "Proceed to Book" button

---

## 3. **Frontend - Booking Modal**

### ConsultingSlotBookingModal Component

**Location:** `src/app/components/ConsultingSlotBookingModal.tsx`

**Displays:**
- Slot details (date, time, duration, availability)
- Customer information (pre-filled from auth)
- Optional notes field
- Important booking information
- Clear action buttons

**Props:**
```typescript
interface ConsultingSlotBookingModalProps {
  isOpen: boolean;                          // Modal visibility
  selectedSlot: ConsultingSlot | null;     // Selected slot object
  specialistEmail: string;                  // Specialist email
  onClose: () => void;                      // Close callback
  onSuccess?: () => void;                   // Success callback
}
```

---

## Complete Booking Flow

### Step 1: Customer Views Specialist Profile

```
🏠 Homepage/Marketplace
       ↓
👤 Click "View Profile" or specialist card
       ↓
📋 SpecialistProfile component loads
```

**What Happens:**
- Specialist profile data fetches
- Services, courses, and available slots load
- Calendar tab available if specialist has consulting slots

---

### Step 2: Customer Navigates to Booking Tab

```
📋 Specialist Profile
       ↓
Tabs: About | Courses | Services | 📅 Book Appointment
       ↓
Customer clicks "Book Appointment" tab
       ↓
ConsultingSlotCalendar component renders
```

**API Call:**
```javascript
// Fetch available slots for current month
const response = await consultingSlotAPI.getAvailableForCustomer(
  specialistEmail,
  monthStart,    // First day of current month
  monthEnd       // Last day of current month
);
```

---

### Step 3: Calendar Displays Available Slots

```
📅 MARCH 2026
┌─────────────────────────┐
│ Sun Mon Tue Wed Thu ... │
│ 1   2   3✓  4   5✓  ... │  ✓ = has available slots
│ 8   9  10  11  12      │
│           ...          │
└─────────────────────────┘

Below shows time slots for selected date:
┌──────────────────────────────┐
│ Saturday, Mar 15, 2026       │
│ [14:00  [15:00  [16:00       │
│ 60m]    60m]    60m]         │
└──────────────────────────────┘
```

**Display Logic:**
- ✅ Show only dates that have available slots
- ✅ Gray out dates with no availability
- ✅ Each time slot shows start time and duration
- ✅ Highlight selected slot

---

### Step 4: Customer Selects a Time Slot

```
Customer clicks on [14:00 60m]
       ↓
handleSelectSlot() triggered
       ↓
State: selectedSlot = { _id, date, startTime, endTime, ... }
       ↓
Show Slot Details Section
┌─────────────────────────────┐
│ Selected Slot:              │
│ Date: Saturday, Mar 15      │
│ Time: 14:00 - 15:00         │
│ Duration: 60 minutes        │
│ Available: 1 of 1           │
│                             │
│ [Proceed to Book] button    │
└─────────────────────────────┘
```

---

### Step 5: Customer Clicks "Proceed to Book"

```
Customer clicks [Proceed to Book]
       ↓
setShowBookingModal(true)
       ↓
ConsultingSlotBookingModal opens
```

**What Shows in Modal:**

```
╔═══════════════════════════════════════╗
║         🔵 CONFIRM YOUR BOOKING      ║
╟───────────────────────────────────────╢
║                                       ║
║  📅 Date                               ║
║  Saturday, March 15, 2026             ║
║                                       ║
║  🕐 Time                               ║
║  14:00 - 15:00                        ║
║                                       ║
║  ⏱️ Duration                           ║
║  60 minutes                           ║
║                                       ║
║  👥 Availability                       ║
║  1 spot available                     ║
║                                       ║
╠═══════════════════════════════════════╣
║         YOUR INFORMATION              ║
╟───────────────────────────────────────╢
║                                       ║
║  Name: [John Doe] (disabled)          ║
║  Email: john@example.com (disabled)   ║
║                                       ║
║  Additional Notes (optional):         ║
║  ┌─────────────────────────────────┐  ║
║  │ Share topics you want to        │  ║
║  │ discuss or any questions...     │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
╠═══════════════════════════════════════╣
║  ⚠️  IMPORTANT INFORMATION             ║
║  • Confirmation email will be sent   ║
║  • Meeting details 24 hours before   ║
║  • Cancel 24 hours in advance        ║
╠═══════════════════════════════════════╣
║                                       ║
║  [Cancel]  [Complete Booking]         ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

### Step 6: Customer Confirms Booking

```
Customer clicks [Complete Booking]
       ↓
setIsLoading(true) + setBookingStatus('loading')
       ↓
API Call: POST /api/consulting-slots/{slotId}/book
│
├─ Body: {
│   customerId: "user_123",
│   customerEmail: "john@example.com",
│   customerName: "John Doe"
│ }
│
└─ Sends via consultingSlotAPI.book()
```

**Backend Processing:**
```javascript
// consulatingSlotController.js → bookSlot()
1. Find slot by ID
2. Validate:
   ✅ Slot exists
   ✅ Slot status = "active"
   ✅ Not fully booked
   ✅ Customer not already booked
3. Add booking to slot.bookings array
4. Increment slot.bookedCount
5. If bookedCount >= totalCapacity:
     Set isFullyBooked = true
6. Save slot
7. Return success with booking details
```

---

### Step 7: Success Confirmation

```
API Response: { success: true, data: { ... } }
       ↓
setBookingStatus('success')
       ↓
Show Success Message:

╔═══════════════════════════════════════╗
║         ✅ BOOKING CONFIRMED           ║
║                                       ║
║  Your consulting slot has been       ║
║  booked successfully!                ║
║                                       ║
║  Check your email for meeting        ║
║  details.                            ║
║                                       ║
║  Redirecting in 2 seconds...         ║
╚═══════════════════════════════════════╝
       ↓
Wait 2 seconds
       ↓
onSuccess() callback triggered
       ↓
Close modal: setShowBookingModal(false)
       ↓
Refresh calendar: fetchAvailableSlots()
```

---

### Step 8: Post-Booking

**Customer receives:**
1. ✅ Confirmation modal with success message
2. ✅ Confirmation email with:
   - Specialist name and details
   - Scheduled date and time
   - Duration
   - Meeting link (if applicable)
   - Cancellation policy
   - Any specialists notes

**Calendar updates:**
- ✅ Newly booked slot disappears from calendar
- ✅ Remaining available slots show
- ✅ Month view updates

---

## Error Handling

### Error Scenarios

#### 1. **Not Logged In**
```
Error: "Please login to book a slot"
Action: Prompt user to login/signup
```

#### 2. **Slot No Longer Available**
```
Error: "This slot is no longer available"
Action: Show message, refresh calendar
```

#### 3. **Already Booked**
```
Error: "You already have a booking for this slot"
Action: Show existing booking details
```

#### 4. **Network Error**
```
Error: "Error booking slot. Please try again..."
Action: Show retry button
User can try the booking again
```

#### 5. **Server Error**
```
Error from backend (500, 400, etc.)
Action: Display error message
Show "Try Again" button
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

    Customer
       │
       ├─→ Views Specialist Profile
       │
       ├─→ Clicks "Book Appointment" Tab
       │
       ├─→ ConsultingSlotCalendar Loads
       │    │
       │    └─→ API: Get Available Slots
       │         ├─ Filter by date range
       │         ├─ Filter by booking rules
       │         └─ Exclude fully booked
       │
       ├─→ Calendar Displays Available Slots
       │    ├─ Month navigation
       │    ├─ Group by date
       │    └─ Show time slots
       │
       ├─→ Customer Selects Time Slot
       │    ├─ Update selectedSlot state
       │    └─ Show slot details
       │
       ├─→ Clicks "Proceed to Book"
       │    └─→ ConsultingSlotBookingModal Opens
       │
       ├─→ Reviews Booking Details
       │    ├─ Slot info (date, time, duration)
       │    ├─ Customer info (pre-filled)
       │    └─ Optional notes
       │
       ├─→ Clicks "Complete Booking"
       │    │
       │    ├─→ API: POST /consulting-slots/{id}/book
       │    │    ├─ customerId
       │    │    ├─ customerEmail
       │    │    └─ customerName
       │    │
       │    ├─→ Backend Processes
       │    │    ├─ Validate slot available
       │    │    ├─ Add booking record
       │    │    ├─ Update slot status
       │    │    └─ Save to database
       │    │
       │    └─→ API Response Success/Error
       │
       ├─→ Success Confirmation
       │    ├─ Show success modal
       │    ├─ Send confirmation email
       │    └─ Refresh calendar
       │
       └─→ Booking Complete ✅

```

---

## API Integration Summary

### Endpoints Used

#### 1. Get Available Slots
```
GET /api/consulting-slots/customer/available
?specialistEmail=john@example.com&startDate=2026-03-01&endDate=2026-03-31

Response: Array of available slots with full details
```

#### 2. Book Slot
```
POST /api/consulting-slots/{slotId}/book
Body: {
  customerId: string,
  customerEmail: string,
  customerName: string
}

Response: Updated slot with booking confirmation
```

---

## User Experience Features

### Visual Feedback
- ✅ Loading spinners during API calls
- ✅ Error messages in red
- ✅ Success confirmations with checkmarks
- ✅ Disabled buttons during submission
- ✅ Month navigation for easy browsing

### Accessibility
- ✅ Clear button labels
- ✅ Keyboard navigation support
- ✅ Color-coded information
- ✅ Descriptive error messages
- ✅ Pre-filled form fields

### Mobile Responsive
- ✅ Calendar adapts to screen size
- ✅ Time slot grid responsive
- ✅ Modal full-screen on mobile
- ✅ Touch-friendly button sizes
- ✅ Readable text on all devices

---

## Testing Checklist

- [ ] Customer can view specialist profile
- [ ] Calendar loads with available slots
- [ ] Month navigation works
- [ ] Slots filtered correctly (past, booked, rules)
- [ ] Slot selection updates display
- [ ] "Proceed to Book" opens modal
- [ ] Modal shows correct slot details
- [ ] Customer info pre-filled
- [ ] Optional notes field works
- [ ] "Complete Booking" sends API request
- [ ] Success confirmation displays
- [ ] Calendar refreshes after booking
- [ ] Modal closes after success
- [ ] Error states display properly
- [ ] Retry button works on error
- [ ] Not logged in error handled
- [ ] Network errors handled gracefully
- [ ] Mobile responsiveness verified
- [ ] Email confirmation sent
- [ ] Booked slot removed from calendar

---

## File Locations

| Component | Path | Purpose |
|-----------|------|---------|
| Calendar | `src/app/components/ConsultingSlotCalendar.tsx` | Display available slots |
| Booking Modal | `src/app/components/ConsultingSlotBookingModal.tsx` | Confirm and complete booking |
| Hook | `src/app/hooks/useConsultingSlots.ts` | Manage slot state |
| API | `src/app/api/apiClient.ts` | API calls to backend |
| Profile | `src/app/components/SpecialistProfile.tsx` | Integrate calendar |

---

## Summary

The consulting slot booking system provides:

1. **For Customers:**
   - Easy calendar interface to find available slots
   - Clear slot details before booking
   - Smooth confirmation process
   - Email confirmation

2. **For Specialists:**
   - Availability managed in Settings
   - Automatic slot generation
   - Booking rules enforced
   - Professional slot management

3. **For System:**
   - Real-time availability updates
   - Preventing double-bookings
   - Respecting booking rules
   - Comprehensive error handling
