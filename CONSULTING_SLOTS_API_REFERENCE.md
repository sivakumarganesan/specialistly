# Consulting Slots Management API - Complete Reference Guide

## Phase 1 Implementation Complete ✅

**Files Created:**
- ✅ `backend/models/ConsultingSlot.js` - Mongoose schema with validation
- ✅ `backend/controllers/consultingSlotController.js` - 9 API handlers
- ✅ `backend/routes/consultingSlotRoutes.js` - Route definitions
- ✅ `backend/server.js` - Route registration

**Commit:** `522ebd9`

---

## API Endpoints Overview

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| **GET** | `/api/consulting-slots/available` | Customer: See available slots | Public |
| **GET** | `/api/consulting-slots/:email` | Specialist: View all slots | Specialist |
| **GET** | `/api/consulting-slots/:email/stats` | Specialist: View stats | Specialist |
| **GET** | `/api/consulting-slots/slot/:id` | Get single slot details | Public |
| **POST** | `/api/consulting-slots` | Create slot | Specialist |
| **POST** | `/api/consulting-slots/:id/book` | Customer: Book slot | Customer |
| **POST** | `/api/consulting-slots/bulk/create` | Create multiple slots | Specialist |
| **PUT** | `/api/consulting-slots/:id` | Update slot | Specialist |
| **DELETE** | `/api/consulting-slots/:id` | Delete empty slot | Specialist |
| **DELETE** | `/api/consulting-slots/:id/book/:customerId` | Cancel booking | Customer/Specialist |

---

## Detailed API Endpoints

### 1️⃣ GET - Available Slots (Customer View)

**Endpoint:** `GET /api/consulting-slots/available`

**Query Parameters:**
```
specialistEmail (required): The specialist's email
startDate (optional): ISO date string "2026-02-19"
endDate (optional): ISO date string "2026-03-19" (defaults to 30 days from start)
```

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/consulting-slots/available?specialistEmail=john@example.com&startDate=2026-02-19&endDate=2026-03-19"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65b8c3f2a1b2c3d4e5f6g7h8",
      "specialistId": "65a9b2c1d2e3f4g5h6i7j8k9",
      "specialistEmail": "john@example.com",
      "serviceId": "65a9b2c1d2e3f4g5h6i7j8k9",
      "date": "2026-02-20T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "15:00",
      "duration": 60,
      "totalCapacity": 1,
      "bookedCount": 0,
      "isFullyBooked": false,
      "status": "active",
      "bookings": [],
      "timezone": "UTC",
      "createdAt": "2026-02-19T08:30:00.000Z",
      "updatedAt": "2026-02-19T08:30:00.000Z"
    },
    {
      "_id": "65b8c3f2a1b2c3d4e5f6g7h9",
      "date": "2026-02-21T00:00:00.000Z",
      "startTime": "15:00",
      "endTime": "16:00",
      "totalCapacity": 1,
      "bookedCount": 0,
      "isFullyBooked": false,
      // ... other fields
    }
  ],
  "count": 2
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Specialist email is required"
}
```

---

### 2️⃣ GET - Specialist's All Slots

**Endpoint:** `GET /api/consulting-slots/:specialistEmail`

**Query Parameters:**
```
status (optional): "active" or "inactive"
```

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/consulting-slots/john@example.com"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    // Returns both past and future, booked and available
    {
      "_id": "...",
      "date": "2026-02-20T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "15:00",
      "status": "active",
      "bookedCount": 0,
      // ... other fields
    }
  ],
  "count": 15
}
```

---

### 3️⃣ GET - Specialist Stats

**Endpoint:** `GET /api/consulting-slots/:specialistEmail/stats`

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/consulting-slots/john@example.com/stats"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSlots": 20,
    "activeSlots": 18,
    "inactiveSlots": 2,
    "upcomingAvailable": 12,
    "upcomingBooked": 3,
    "pastSlots": 5,
    "totalBookings": 5
  }
}
```

---

### 4️⃣ GET - Single Slot Details

**Endpoint:** `GET /api/consulting-slots/slot/:slotId`

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/consulting-slots/slot/65b8c3f2a1b2c3d4e5f6g7h8"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65b8c3f2a1b2c3d4e5f6g7h8",
    "specialistEmail": "john@example.com",
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
        "customerName": "Alice Smith",
        "bookedAt": "2026-02-19T10:45:00.000Z"
      }
    ]
  }
}
```

---

### 5️⃣ POST - Create Slot

**Endpoint:** `POST /api/consulting-slots`

**Request Body:**
```json
{
  "specialistEmail": "john@example.com",
  "specialistId": "65a9b2c1d2e3f4g5h6i7j8k9",
  "serviceId": "65a9b2c1d2e3f4g5h6i7j8k9",
  "date": "2026-02-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "totalCapacity": 1,
  "timezone": "America/New_York",
  "notes": "Career consultation"
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:5000/api/consulting-slots" \
  -H "Content-Type: application/json" \
  -d '{
    "specialistEmail": "john@example.com",
    "date": "2026-02-20",
    "startTime": "14:00",
    "endTime": "15:00",
    "totalCapacity": 1
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Slot created successfully",
  "data": {
    "_id": "65b8c3f2a1b2c3d4e5f6g7h8",
    "specialistEmail": "john@example.com",
    "date": "2026-02-20T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "15:00",
    "duration": 60,
    "totalCapacity": 1,
    "bookedCount": 0,
    "isFullyBooked": false,
    "status": "active",
    "bookings": [],
    "createdAt": "2026-02-19T08:30:00.000Z"
  }
}
```

**Error Response (409 - Conflict):**
```json
{
  "success": false,
  "message": "Time slot conflict: Specialist already has a slot during this time",
  "conflictingSlots": [
    {
      "_id": "...",
      "startTime": "14:30",
      "endTime": "15:30"
    }
  ]
}
```

---

### 6️⃣ POST - Book Slot (Customer)

**Endpoint:** `POST /api/consulting-slots/:slotId/book`

**Request Body:**
```json
{
  "customerId": "65a9b2c1d2e3f4g5h6i7j8ka",
  "customerEmail": "alice@example.com",
  "customerName": "Alice Smith"
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:5000/api/consulting-slots/65b8c3f2a1b2c3d4e5f6g7h8/book" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "65a9b2c1d2e3f4g5h6i7j8ka",
    "customerEmail": "alice@example.com",
    "customerName": "Alice Smith"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Slot booked successfully",
  "data": {
    "_id": "65b8c3f2a1b2c3d4e5f6g7h8",
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
        "customerName": "Alice Smith",
        "bookedAt": "2026-02-19T10:45:00.000Z"
      }
    ]
  }
}
```

**Error Response (409 - Slot Fully Booked):**
```json
{
  "success": false,
  "message": "Slot is not available for booking",
  "reason": "Slot is fully booked"
}
```

**Error Response (400 - Already Booked):**
```json
{
  "success": false,
  "message": "Customer has already booked this slot"
}
```

---

### 7️⃣ POST - Bulk Create Slots

**Endpoint:** `POST /api/consulting-slots/bulk/create`

**Request Body:**
```json
{
  "specialistEmail": "john@example.com",
  "specialistId": "65a9b2c1d2e3f4g5h6i7j8k9",
  "slots": [
    {
      "date": "2026-02-20",
      "startTime": "09:00",
      "endTime": "10:00",
      "totalCapacity": 1
    },
    {
      "date": "2026-02-20",
      "startTime": "14:00",
      "endTime": "15:00",
      "totalCapacity": 1
    },
    {
      "date": "2026-02-21",
      "startTime": "10:00",
      "endTime": "11:00",
      "totalCapacity": 1
    }
  ]
}
```

**Success Response (201):**
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

---

### 8️⃣ PUT - Update Slot

**Endpoint:** `PUT /api/consulting-slots/:slotId`

**Request Body:**
```json
{
  "startTime": "14:30",
  "endTime": "15:30",
  "status": "active",
  "notes": "Updated notes",
  "timezone": "America/New_York"
}
```

**Important:** Cannot update date or capacity if the slot has bookings!

**Example cURL:**
```bash
curl -X PUT "http://localhost:5000/api/consulting-slots/65b8c3f2a1b2c3d4e5f6g7h8" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "14:30",
    "status": "inactive"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Slot updated successfully",
  "data": {
    "_id": "65b8c3f2a1b2c3d4e5f6g7h8",
    "startTime": "14:30",
    "endTime": "15:30",
    "status": "inactive",
    // ... other fields
  }
}
```

**Error Response (409 - Has bookings):**
```json
{
  "success": false,
  "message": "Cannot change time of a slot that already has bookings. Please cancel bookings first or delete the slot."
}
```

---

### 9️⃣ DELETE - Delete Slot

**Endpoint:** `DELETE /api/consulting-slots/:slotId`

**Rules:**
- Can only delete if `bookedCount = 0`
- Cannot delete slots with bookings

**Example cURL:**
```bash
curl -X DELETE "http://localhost:5000/api/consulting-slots/65b8c3f2a1b2c3d4e5f6g7h8"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Slot deleted successfully"
}
```

**Error Response (409 - Has bookings):**
```json
{
  "success": false,
  "message": "Cannot delete slot with 1 booking(s). Please cancel all bookings first.",
  "bookings": [
    {
      "customerId": "65a9b2c1d2e3f4g5h6i7j8ka",
      "customerEmail": "alice@example.com"
    }
  ]
}
```

---

### 🔟 DELETE - Cancel Booking

**Endpoint:** `DELETE /api/consulting-slots/:slotId/book/:customerId`

**Example cURL:**
```bash
curl -X DELETE "http://localhost:5000/api/consulting-slots/65b8c3f2a1b2c3d4e5f6g7h8/book/65a9b2c1d2e3f4g5h6i7j8ka"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "65b8c3f2a1b2c3d4e5f6g7h8",
    "totalCapacity": 1,
    "bookedCount": 0,
    "isFullyBooked": false,
    "bookings": []
  }
}
```

---

## Key Features Implemented

### ✅ Double-Booking Prevention
```javascript
// Check for time conflicts before creating slot
const existingSlots = await ConsultingSlot.find({
  specialistEmail,
  date,
  status: 'active',
  $or: [
    { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
  ]
});
```

### ✅ Automatic Capacity Tracking
```javascript
// When booking added
this.bookedCount += 1;
this.isFullyBooked = this.bookedCount >= this.totalCapacity;

// When booking removed
this.bookedCount -= 1;
this.isFullyBooked = this.bookedCount >= this.totalCapacity;
```

### ✅ Availability Validation
```javascript
// Only future + active + not fully booked shown to customers
const available = slot.isAvailable();
// Checks: date > now && status === 'active' && !isFullyBooked
```

### ✅ Cascade Validation
- Cannot change times if slot has bookings
- Cannot delete slot if it has bookings
- Cannot book past slots
- Cannot book inactive slots
- Cannot double-book same customer

---

## Data Model

```javascript
{
  _id: ObjectId,
  specialistId: ObjectId,
  specialistEmail: String,
  serviceId: ObjectId,
  
  // Timing
  date: Date,
  startTime: String,     // "14:00"
  endTime: String,       // "15:00"
  duration: Number,      // 60 (minutes)
  
  // Capacity
  totalCapacity: Number, // Usually 1
  bookedCount: Number,   // Increments on bookings
  isFullyBooked: Boolean,
  
  // Status
  status: String,        // "active" | "inactive"
  
  // Bookings
  bookings: [{
    customerId: ObjectId,
    customerEmail: String,
    customerName: String,
    bookedAt: Date
  }],
  
  // Meta
  timezone: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Database Indexes

```javascript
// For efficient queries
consultingSlotSchema.index({ specialistId: 1, date: 1 });
consultingSlotSchema.index({ date: 1, status: 1, isFullyBooked: 1 });
consultingSlotSchema.index({ specialistId: 1, status: 1 });
```

---

## Testing in Postman

### 1. Create a Slot
```
POST http://localhost:5000/api/consulting-slots
{
  "specialistEmail": "john@example.com",
  "date": "2026-02-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "totalCapacity": 1
}
```

### 2. Get Available Slots
```
GET http://localhost:5000/api/consulting-slots/available?specialistEmail=john@example.com
```

### 3. Book a Slot
```
POST http://localhost:5000/api/consulting-slots/{slotId}/book
{
  "customerId": "customer123",
  "customerEmail": "alice@example.com",
  "customerName": "Alice Smith"
}
```

### 4. Cancel Booking
```
DELETE http://localhost:5000/api/consulting-slots/{slotId}/book/{customerId}
```

### 5. View Specialist's Stats
```
GET http://localhost:5000/api/consulting-slots/{specialistEmail}/stats
```

---

## Next Phase: Specialist UI (Frontend)

Ready to build the "Manage Slots" dashboard for specialists?

Components needed:
- [`ManageSlots.tsx`] - Main dashboard
- [`CreateSlotModal.tsx`] - Add slot form
- [`SlotsList.tsx`] - Display slots
- [`SlotActions.tsx`] - Edit/Delete buttons
- [`useConsultingSlots.ts`] - Custom hook for API calls

**Status:** ✅ Phase 1 Backend Complete → Phase 2 UI Ready to Start

