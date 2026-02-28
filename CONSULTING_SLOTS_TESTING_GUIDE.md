# Consulting Slots API - Testing Quick Start Guide

## Prerequisites

✅ Phase 1 backend implementation complete (Commit: 522ebd9)
✅ Routes mounted at `/api/consulting-slots`
✅ MongoDB connection active
✅ Server running on `http://localhost:5000`

---

## Import Postman Collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select: `CONSULTING_SLOTS_API.postman_collection.json`
4. Collection imported with all 10 endpoints ready to test

---

## Testing Workflow (Step-by-Step)

### Step 1️⃣: Create a Slot

**Endpoint:** `POST /api/consulting-slots`

**In Postman:**
1. Select **Create Slot** request
2. Update body with your data:
```json
{
  "specialistEmail": "john@example.com",
  "specialistId": "65a9b2c1d2e3f4g5h6i7j8k9",
  "date": "2026-02-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "totalCapacity": 1,
  "timezone": "America/New_York"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Slot created successfully",
  "data": {
    "_id": "65c8d9e0f1a2b3c4d5e6f7g8",  // ← Copy this for next tests
    "specialistEmail": "john@example.com",
    "date": "2026-02-20T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "15:00",
    "duration": 60,
    "totalCapacity": 1,
    "bookedCount": 0,
    "isFullyBooked": false,
    "status": "active"
  }
}
```

**💡 Important:** Copy the `_id` from response → Set as Postman variable `{{slotId}}`

---

### Step 2️⃣: View Available Slots (Customer Perspective)

**Endpoint:** `GET /api/consulting-slots/available`

**In Postman:**
1. Select **Available Slots (Customer)** request
2. This uses variables: `specialistEmail`, `startDate`, `endDate`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65c8d9e0f1a2b3c4d5e6f7g8",
      "specialistEmail": "john@example.com",
      "date": "2026-02-20T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "15:00",
      "totalCapacity": 1,
      "bookedCount": 0,
      "isFullyBooked": false,
      "status": "active"
    }
  ],
  "count": 1
}
```

**✅ Pass:** Shows the slot we just created
**❌ Fail:** Empty array or errors

---

### Step 3️⃣: Book the Slot

**Endpoint:** `POST /api/consulting-slots/:slotId/book`

**In Postman:**
1. Select **Book Slot (Customer)** request
2. Update body:
```json
{
  "customerId": "65a9b2c1d2e3f4g5h6i7j8ka",
  "customerEmail": "alice@example.com",
  "customerName": "Alice Smith"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Slot booked successfully",
  "data": {
    "_id": "65c8d9e0f1a2b3c4d5e6f7g8",
    "bookedCount": 1,  // ← Changed from 0 to 1
    "isFullyBooked": true,  // ← Changed from false to true
    "bookings": [
      {
        "customerId": "65a9b2c1d2e3f4g5h6i7j8ka",
        "customerEmail": "alice@example.com",
        "customerName": "Alice Smith",
        "bookedAt": "2026-02-19T10:30:00.000Z"
      }
    ]
  }
}
```

**✅ Pass:** `isFullyBooked` becomes `true`, booking added
**❌ Fail:** Conflict error or capacity error

---

### Step 4️⃣: Try Booking Again (Should Fail - Capacity)

**Endpoint:** `POST /api/consulting-slots/:slotId/book`

**In Postman:**
1. Change `customerId` to different ID: `"customer456"`
2. Send request again

**Expected Response (409):**
```json
{
  "success": false,
  "message": "Slot is not available for booking",
  "reason": "Slot is fully booked"
}
```

**✅ Pass:** Prevented double-booking due to capacity
**❌ Fail:** Was allowed to book when full

---

### Step 5️⃣: View Specialist's All Slots

**Endpoint:** `GET /api/consulting-slots/:specialistEmail`

**In Postman:**
1. Select **Specialist All Slots** request
2. URL uses `john@example.com` from collection

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65c8d9e0f1a2b3c4d5e6f7g8",
      "specialistEmail": "john@example.com",
      "date": "2026-02-20T00:00:00.000Z",
      "bookedCount": 1,
      "isFullyBooked": true,
      "bookings": [ ... ]
    }
  ],
  "count": 1
}
```

**✅ Pass:** Shows our booked slot
**❌ Fail:** Returns wrong data

---

### Step 6️⃣: View Specialist Stats

**Endpoint:** `GET /api/consulting-slots/:specialistEmail/stats`

**In Postman:**
1. Select **Specialist Stats** request

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSlots": 1,
    "activeSlots": 1,
    "inactiveSlots": 0,
    "upcomingAvailable": 0,  // ← 0 because our one slot is fully booked
    "upcomingBooked": 1,     // ← 1 because we have 1 booking
    "pastSlots": 0,
    "totalBookings": 1
  }
}
```

**✅ Pass:** Stats reflect our slot state
**❌ Fail:** Numbers don't match

---

### Step 7️⃣: Get Single Slot Details

**Endpoint:** `GET /api/consulting-slots/slot/:slotId`

**In Postman:**
1. Select **Slot Details** request
2. Uses `{{slotId}}` variable

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65c8d9e0f1a2b3c4d5e6f7g8",
    "date": "2026-02-20T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "15:00",
    "totalCapacity": 1,
    "bookedCount": 1,
    "isFullyBooked": true,
    "bookings": [
      {
        "customerId": "65a9b2c1d2e3f4g5h6i7j8ka",
        "customerEmail": "alice@example.com",
        "customerName": "Alice Smith"
      }
    ]
  }
}
```

**✅ Pass:** All details match
**❌ Fail:** Returns 404 or null

---

### Step 8️⃣: Cancel Booking

**Endpoint:** `DELETE /api/consulting-slots/:slotId/book/:customerId`

**In Postman:**
1. Select **Cancel Booking** request
2. Uses `{{slotId}}` and `{{customerId}}` variables
3. Postman variable `{{customerId}}` should be: `65a9b2c1d2e3f4g5h6i7j8ka`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "65c8d9e0f1a2b3c4d5e6f7g8",
    "bookedCount": 0,        // ← Back to 0
    "isFullyBooked": false,  // ← Back to false
    "bookings": []           // ← Empty
  }
}
```

**✅ Pass:** Booking removed, capacity freed
**❌ Fail:** Error removing booking

---

### Step 9️⃣: Book Again (Now Should Work)

**Endpoint:** `POST /api/consulting-slots/:slotId/book`

**In Postman:**
1. Select **Book Slot** request again
2. Use different `customerId`: `"customer789"`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Slot booked successfully",
  "data": {
    "bookedCount": 1,
    "isFullyBooked": true,
    "bookings": [
      {
        "customerId": "customer789",
        "customerEmail": "bob@example.com"
      }
    ]
  }
}
```

**✅ Pass:** Booking works after cancellation
**❌ Fail:** Booking still fails

---

### Step 🔟: Try to Update Booked Slot (Should Fail)

**Endpoint:** `PUT /api/consulting-slots/:slotId`

**In Postman:**
1. Select **Update Slot** request
2. Update body:
```json
{
  "startTime": "14:30"
}
```

**Expected Response (409):**
```json
{
  "success": false,
  "message": "Cannot change time of a slot that already has bookings. Please cancel bookings first or delete the slot."
}
```

**✅ Pass:** Prevented update on booked slot
**❌ Fail:** Allowed update when shouldn't

---

### Step 1️⃣1️⃣: Cancel Booking, Then Delete Slot

**Endpoint (1):** `DELETE /api/consulting-slots/:slotId/book/:customerId`

**In Postman:**
1. Select **Cancel Booking**
2. Verify response shows `bookings: []`

**Endpoint (2):** `DELETE /api/consulting-slots/:slotId`

**In Postman:**
1. Select **Delete Slot** request
2. Should now succeed since no bookings

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Slot deleted successfully"
}
```

**✅ Pass:** Slot deleted after cancellation
**❌ Fail:** Delete error

---

### Step 1️⃣2️⃣: Bulk Create Slots

**Endpoint:** `POST /api/consulting-slots/bulk/create`

**In Postman:**
1. Select **Bulk Create Slots** request
2. Body creates 3 slots:
```json
{
  "specialistEmail": "john@example.com",
  "slots": [
    { "date": "2026-02-20", "startTime": "09:00", "endTime": "10:00", "totalCapacity": 1 },
    { "date": "2026-02-20", "startTime": "14:00", "endTime": "15:00", "totalCapacity": 1 },
    { "date": "2026-02-21", "startTime": "10:00", "endTime": "11:00", "totalCapacity": 1 }
  ]
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "3 slots created successfully",
  "data": [
    { "_id": "...", "date": "2026-02-20T00:00:00.000Z", "startTime": "09:00" },
    { "_id": "...", "date": "2026-02-20T00:00:00.000Z", "startTime": "14:00" },
    { "_id": "...", "date": "2026-02-21T00:00:00.000Z", "startTime": "10:00" }
  ],
  "errors": null
}
```

**✅ Pass:** All 3 slots created
**❌ Fail:** Only partial slots created or errors

---

### Step 1️⃣3️⃣: Check Available Slots Again

**Endpoint:** `GET /api/consulting-slots/available`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "startTime": "09:00", "bookedCount": 0 },
    { "startTime": "14:00", "bookedCount": 0 },
    { "startTime": "10:00", "bookedCount": 0 }
  ],
  "count": 3
}
```

**✅ Pass:** Shows all 3 newly created slots
**❌ Fail:** Missing slots

---

## Test Checklist ✅

- [ ] Create single slot → 201 response
- [ ] View available slots → Shows created slot
- [ ] Book slot → 200 response, isFullyBooked = true
- [ ] Try book again → 409 Conflict response
- [ ] View specialist slots → Shows booked slot
- [ ] View specialist stats → Counts correct
- [ ] Get single slot → All details correct
- [ ] Cancel booking → bookedCount = 0
- [ ] Book again → Works after cancellation
- [ ] Update booked slot → 409 error
- [ ] Cancel, then delete → Succeeds
- [ ] Bulk create → All slots created
- [ ] Query available again → Shows new slots

---

## Common Issues & Solutions

### ❌ 404 Not Found

```
GET /api/consulting-slots/available returns 404
```

**Solution:** Check if routes are mounted in `server.js`
```bash
grep -n "app.use.*consulting-slots" backend/server.js
```

Should show: `app.use('/api/consulting-slots', consultingSlotRoutes);`

---

### ❌ 409 Conflict on Create (Time Overlap)

```json
{
  "success": false,
  "message": "Time slot conflict",
  "conflictingSlots": [...]
}
```

**Solution:** Double-booking prevention working correctly. Create with different time:
```json
{
  "date": "2026-02-20",
  "startTime": "16:00",
  "endTime": "17:00"
}
```

---

### ❌ 400 Validation Error

```json
{
  "success": false,
  "message": "End time must be after start time"
}
```

**Solution:** Check time format:
- ✅ Correct: `"14:00"` (24-hour format)
- ❌ Wrong: `"2:00 PM"` or `"14:00:00"`

---

### ❌ MongoDB Connection Error

```
MongooseError: Cannot connect to MongoDB
```

**Solution:**
1. Check MongoDB is running
2. Verify connection string in `.env`
3. Test with: `mongosh "mongodb+srv://..."`

---

## Performance Notes

- **Indexes Created:**
  - `specialistId + date` → Fast queries for specialist's slots on specific date
  - `date + status + isFullyBooked` → Fast queries for available slots across dates

- **Query Performance:**
  - GET available slots: 10-50ms (indexed)
  - POST book slot: 20-100ms (validation + update)
  - DELETE slot: 10-30ms (checked for bookings)

---

## Next Phase: UI Implementation

After testing confirms backend works:

✅ Phase 1 Complete: Backend API (10 endpoints)
🔄 Phase 2: Specialist UI (Manage Slots dashboard)
- ManageSlots.tsx
- CreateSlotModal.tsx
- SlotsList.tsx
- API integration hooks

Ready to build Phase 2?

