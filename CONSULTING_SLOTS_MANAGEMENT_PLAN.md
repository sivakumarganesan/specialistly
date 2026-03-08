# 1:1 Consulting Slots Management System - Implementation Plan

## Overview

Replace the complex manual scheduling with a **centralized Manage Slot system** where specialists define availability once, and customers see only available slots.

---

## Database Schema

### ConsultingSlots Collection

```javascript
{
  _id: ObjectId,
  specialistId: String,          // Reference to creator
  specialistEmail: String,        // For quick lookup
  serviceId: String,              // Which service this slot is for (optional - if null, applies to all consulting)
  
  // Slot time details
  date: Date,                    // The date (stored as YYYY-MM-DD or full date)
  startTime: String,             // "14:00" (24-hour format)
  endTime: String,               // "15:00" (24-hour format)
  duration: Number,              // in minutes (calculated or stored)
  
  // Capacity management
  totalCapacity: Number,         // How many customers can book this slot (usually 1 for 1:1)
  bookedCount: Number,           // How many have booked (incremented on booking)
  
  // Status
  status: "active" | "inactive", // Can be toggled by specialist
  isFullyBooked: Boolean,        // Computed: bookedCount >= totalCapacity
  
  // Booking reference
  bookings: [
    {
      customerId: String,
      customerEmail: String,
      customerName: String,
      bookedAt: Date
    }
  ],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  timezone: String               // Specialist's timezone for display
}
```

### Example Documents

```javascript
// Slot 1: Feb 20, 2:00 PM - 3:00 PM (available)
{
  _id: ObjectId(...),
  specialistId: "specialist1",
  specialistEmail: "john@example.com",
  serviceId: "service1",
  date: new Date("2026-02-20"),
  startTime: "14:00",
  endTime: "15:00",
  duration: 60,
  totalCapacity: 1,
  bookedCount: 0,
  status: "active",
  isFullyBooked: false,
  bookings: [],
  createdAt: Date,
  updatedAt: Date
}

// Slot 2: Feb 21, 3:00 PM - 4:00 PM (fully booked)
{
  _id: ObjectId(...),
  specialistId: "specialist1",
  specialistEmail: "john@example.com",
  date: new Date("2026-02-21"),
  startTime: "15:00",
  endTime: "16:00",
  duration: 60,
  totalCapacity: 1,
  bookedCount: 1,
  status: "active",
  isFullyBooked: true,
  bookings: [
    {
      customerId: "customer1",
      customerEmail: "customer@example.com",
      customerName: "Alice Smith",
      bookedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### 1. Get All Slots (Specialist View)
```
GET /api/consulting-slots/:specialistEmail
Response: All slots for specialist (past, future, booked, available)
```

### 2. Get Available Slots (Customer View)
```
GET /api/consulting-slots/available/:specialistEmail?startDate=2026-02-19&endDate=2026-03-19
Response: Only future + not fully booked slots
```

### 3. Create Slot
```
POST /api/consulting-slots
Body: {
  specialistEmail: "john@example.com",
  serviceId: "service1",
  date: "2026-02-20",
  startTime: "14:00",
  endTime: "15:00",
  totalCapacity: 1,
  timezone: "America/New_York"
}
Response: Created slot
```

### 4. Update Slot
```
PUT /api/consulting-slots/:slotId
Body: {
  startTime: "14:30",  // Can update time
  endTime: "15:30",
  status: "active",    // Can toggle active/inactive
  // Cannot update: date, capacity (prevents confusion)
}
Response: Updated slot
```

### 5. Delete Slot
```
DELETE /api/consulting-slots/:slotId
Rules:
- Can only delete if bookedCount = 0
- Cannot delete fully booked slots
Response: Success or "Cannot delete - slot already booked"
```

### 6. Book Slot (Customer)
```
POST /api/consulting-slots/:slotId/book
Body: {
  customerId: "customer1",
  customerEmail: "customer@example.com",
  customerName: "Alice Smith"
}
Rules:
- Check: isFullyBooked = false
- Check: date is in future
- Check: status = "active"
- Increment: bookedCount
- Add: customer to bookings array
- Update: isFullyBooked if bookedCount >= totalCapacity
Response: Booking confirmation
```

### 7. Cancel Booking
```
DELETE /api/consulting-slots/:slotId/book/:customerId
Rules:
- Only customer or specialist can cancel
- Remove customer from bookings
- Decrement bookedCount
- Reset isFullyBooked if needed
Response: Success
```

---

## File Structure

```
src/app/
├── components/
│   ├── ConsultingSlots/
│   │   ├── ManageSlots.tsx         (NEW - Specialist UI)
│   │   ├── CreateSlotModal.tsx     (NEW - Add slot form)
│   │   ├── SlotsList.tsx           (NEW - Display all slots)
│   │   └── SlotActions.tsx         (NEW - Edit/delete buttons)
│   └── SpecialistProfile.tsx       (UPDATE - use new slots)
│
├── api/
│   └── consultingSlots.ts          (NEW - API calls)
│
└── hooks/
    └── useConsultingSlots.ts       (NEW - Custom hook for slots)

backend/routes/
├── consultingSlots.js              (NEW - CRUD routes)

backend/models/
└── ConsultingSlot.js              (NEW - Mongoose schema)
```

---

## Implementation Phases

### Phase 1: Database & Backend (Foundation)
- [ ] Create ConsultingSlot model
- [ ] Create API endpoints (CRUD + booking)
- [ ] Add double-booking prevention logic
- [ ] Test endpoints with Postman

### Phase 2: Specialist UI (Manage Slots)
- [ ] ManageSlots component
- [ ] Create slot form
- [ ] Edit slot form
- [ ] Delete with confirmation
- [ ] View all specialist's slots

### Phase 3: Customer UI (Book Slots)
- [ ] Update SpecialistProfile to fetch available slots
- [ ] Display upcoming available slots
- [ ] Replace MonthCalendarSlots with actual slot data
- [ ] Handle booking request
- [ ] Show confirmation

### Phase 4: Polish & Testing
- [ ] Error handling
- [ ] Loading states
- [ ] Edge cases (past slots, fully booked, etc.)
- [ ] Mobile responsiveness
- [ ] End-to-end testing

---

## Customer-Facing Changes

### Before (Manual Calendar)
```
Service Card
├ Customer sees: Specialist's weekly availability calendar
└ Customer books: Picks any available time slot
```

### After (Centralized Management)
```
Service Card
├ Specialist has: Manage Slots (date, time, capacity)
└ Customer sees: Only the slots specialist created
```

---

## Key Features

### Specialist Side
✅ Create slot (date + hours + capacity)
✅ View all slots (upcoming + past)
✅ Edit time (but not date/capacity)
✅ Toggle active/inactive
✅ Delete if not booked
✅ See booking details (who booked, when)

### Customer Side
✅ See only future + available slots
✅ Book directly
✅ See capacity visual (1 slot available vs 0)
✅ Cancel if allowed

### System Features
✅ Double-booking prevention
✅ Automatic capacity tracking
✅ Timezone handling
✅ Audit trail (created At, updated At)

---

## Code Examples

### Creating a Slot (Specialist)

```typescript
const createSlot = async (slotData) => {
  const response = await fetch('/api/consulting-slots', {
    method: 'POST',
    body: JSON.stringify({
      specialistEmail: user.email,
      date: "2026-02-20",
      startTime: "14:00",
      endTime: "15:00",
      totalCapacity: 1,
      serviceId: "service1"
    })
  });
  
  return response.json(); // Returns created slot
};
```

### Booking a Slot (Customer)

```typescript
const bookSlot = async (slotId) => {
  const response = await fetch(`/api/consulting-slots/${slotId}/book`, {
    method: 'POST',
    body: JSON.stringify({
      customerId: currentUser._id,
      customerEmail: currentUser.email,
      customerName: currentUser.name
    })
  });
  
  if (response.ok) {
    // Booking successful
    showSuccess("Booked! Check your email for details");
  }
};
```

### Displaying Available Slots (Customer)

```typescript
const [availableSlots, setAvailableSlots] = useState([]);

useEffect(() => {
  const fetchSlots = async () => {
    const response = await fetch(
      `/api/consulting-slots/available/${specialistEmail}`
    );
    const slots = await response.json();
    setAvailableSlots(slots);
  };
  
  fetchSlots();
}, [specialistEmail]);

// Render
{availableSlots.map(slot => (
  <SlotCard
    key={slot._id}
    slot={slot}
    capacity={slot.totalCapacity - slot.bookedCount}
    onBook={() => bookSlot(slot._id)}
  />
))}
```

---

## Benefits

| Aspect | Benefit |
|--------|---------|
| **For Specialists** | Simple: Just set availability once |
| **For Customers** | Clear: See only available times |
| **For System** | Reliable: No double bookings |
| **For Support** | Fewer conflicts: Automatic capacity mgmt |
| **Scalability** | Can add group sessions (capacity > 1) |

---

## Migration Path

### Current System → New System

**If specialist has existing slots:**
1. Export existing availability
2. Convert to new format
3. Import as ConsultingSlots
4. Verify looks correct
5. Go live

**For new specialists:**
- Just use Manage Slots from day one

---

## Timeline

| Phase | Time | Status |
|-------|------|--------|
| Database + Backend | 1-2 hours | Ready to start |
| Specialist UI | 1.5-2 hours | Follow backend |
| Customer UI | 1-1.5 hours | Follow specialist UI |
| Testing + Polish | 1 hour | Final phase |
| **Total** | **4.5-6.5 hours** | **Start now?** |

---

## What's Next?

Ready to implement Phase 1 (Database + Backend)?

I'll create:
1. Mongoose schema (ConsultingSlot model)
2. API routes and controllers
3. Double-booking prevention logic
4. Tests with Postman examples

**Want to proceed?**
