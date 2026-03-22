# Availability Schedule Management System

## Overview

The Availability Schedule Management System allows specialists to define and manage their working hours and time slots. This system provides the foundation for automatic consulting slot generation based on specialist availability.

## Features

### 1. User Interface - Manage Availability Tab

Located in: **Settings → Manage Availability**

#### Components:

**A. Slot Configuration**
- **Default Slot Duration**: Set the standard duration for each consulting slot (15-120 minutes)
- **Buffer Time**: Configure break time between consecutive slots (0-30 minutes)

**B. Booking Rules**
- **Minimum Booking Notice** (hours): How far in advance customers must book (default: 24 hours)
- **Max Advance Booking** (days): How many days in advance bookings can be made (default: 90 days)
- **Cancellation Deadline** (hours): How far in advance cancellations must be made (default: 24 hours)

**C. Weekly Availability Pattern**
- Enable/disable each day of the week
- Add multiple time ranges per day (e.g., 9:00-12:00, 13:00-17:00)
- Example:
  - Monday-Friday: 9:00 AM - 5:00 PM
  - Saturday-Sunday: Disabled or custom hours
  - Lunch break: 12:00 PM - 1:00 PM (handled via date exceptions or break times)

## Backend API

### Base Endpoint: `/api/availability-schedule`

### Endpoints:

#### 1. Get Active Schedule
```
GET /api/availability-schedule/specialist/:specialistEmail
```
Returns the currently active availability schedule for a specialist.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "specialistId": "...",
    "type": "weekly",
    "weeklyPattern": {
      "monday": {
        "enabled": true,
        "slots": [
          {
            "startTime": "09:00",
            "endTime": "17:00",
            "isAvailable": true
          }
        ]
      },
      ...
    },
    "slotConfig": {
      "defaultDuration": 60,
      "availableDurations": [30, 45, 60, 90],
      "buffer": 0
    },
    "bookingRules": {
      "minBookingNotice": 24,
      "maxAdvanceBooking": 90,
      "cancellationDeadline": 24
    },
    "timezone": "America/Los_Angeles",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Get Available Time Slots for Date
```
GET /api/availability-schedule/slots/:specialistEmail/:date
```
Returns available time ranges for a specific date (considers weekly pattern, exceptions, and breaks).

**Parameters:**
- `date`: ISO date format (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "date": "2024-02-20",
  "dayOfWeek": "tuesday",
  "availableSlots": [
    {
      "startTime": "09:00",
      "endTime": "12:00",
      "isAvailable": true
    },
    {
      "startTime": "13:00",
      "endTime": "17:00",
      "isAvailable": true
    }
  ],
  "slotConfig": {
    "defaultDuration": 60,
    "buffer": 0
  }
}
```

#### 3. Create Availability Schedule
```
POST /api/availability-schedule
```
Create a new availability schedule (deactivates any previous one).

**Request Body:**
```json
{
  "specialistEmail": "doctor@example.com",
  "weeklyPattern": {
    "monday": {
      "enabled": true,
      "slots": [
        {
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        }
      ]
    },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": {
      "enabled": false,
      "slots": [...]
    },
    "sunday": {
      "enabled": false,
      "slots": [...]
    }
  },
  "slotConfig": {
    "defaultDuration": 60,
    "availableDurations": [30, 45, 60, 90],
    "buffer": 15
  },
  "bookingRules": {
    "minBookingNotice": 24,
    "maxAdvanceBooking": 90,
    "cancellationDeadline": 24
  },
  "timezone": "America/Los_Angeles"
}
```

**Response:** 201 Created with schedule object

#### 4. Update Availability Schedule
```
PUT /api/availability-schedule/:scheduleId
```
Update an existing schedule.

**Request Body:** Same as Create (any fields to update)

**Response:** 200 OK with updated schedule

#### 5. Delete/Deactivate Schedule
```
DELETE /api/availability-schedule/:scheduleId
```
Deactivates a schedule (marks as inactive rather than deleting).

**Response:** 200 OK

## Frontend Integration

### Hook: `useAvailabilitySchedule`

```typescript
import { useAvailabilitySchedule } from '@/app/hooks/useAvailabilitySchedule';

// Usage in component
const { schedule, loading, error, fetchSchedule, saveSchedule, deleteSchedule } = 
  useAvailabilitySchedule(specialistEmail);

// Fetch schedule
useEffect(() => {
  fetchSchedule();
}, []);

// Save schedule
const handleSave = async () => {
  await saveSchedule({
    weeklyPattern,
    slotConfig,
    bookingRules,
  });
};
```

### API Client: `availabilityScheduleAPI`

```typescript
import { availabilityScheduleAPI } from '@/app/api/apiClient';

// Get schedule
const schedule = await availabilityScheduleAPI.getSchedule(email);

// Get available slots for date
const slots = await availabilityScheduleAPI.getAvailableSlots(email, '2024-02-20');

// Create new schedule
const newSchedule = await availabilityScheduleAPI.create(scheduleData);

// Update schedule
const updated = await availabilityScheduleAPI.update(scheduleId, updates);

// Delete schedule
await availabilityScheduleAPI.delete(scheduleId);
```

## Slot Generation Utility

Located in: `backend/utils/slotGenerationUtils.js`

### Functions:

#### `generateSlotsForDate(schedule, date, durationMinutes, bufferMinutes)`
Generates individual consulting slots for a specific date.

```javascript
import { generateSlotsForDate } from '../utils/slotGenerationUtils.js';

const slots = generateSlotsForDate(
  availabilitySchedule,
  new Date('2024-02-20'),
  60,  // 60 minute slots
  15   // 15 minute buffer
);

// Returns:
[
  {
    date: Date,
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    status: "active",
    totalCapacity: 1,
    bookedCount: 0,
    isFullyBooked: false
  },
  {
    startTime: "10:15",
    endTime: "11:15",
    ...
  },
  ...
]
```

#### `generateSlotsForDateRange(schedule, startDate, numDays, serviceConfig)`
Batch generates slots for multiple days.

```javascript
const slots = generateSlotsForDateRange(
  availabilitySchedule,
  new Date('2024-02-20'),
  90,              // Generate for 90 days
  { duration: 60 } // Using service duration
);
```

#### `generateSlotsForWeek(schedule, startDate, serviceConfig)`
Generates slots for a 7-day week.

```javascript
const slots = generateSlotsForWeek(
  availabilitySchedule,
  new Date('2024-02-20'),
  { duration: 60 }
);
```

## Data Model

### AvailabilitySchedule Schema

```javascript
{
  specialistId: ObjectId,           // Reference to CreatorProfile
  type: 'weekly' | 'monthly',       // Schedule type
  weeklyPattern: {
    monday: DaySchedule,
    tuesday: DaySchedule,
    // ... all 7 days
  },
  dateExceptions: [                 // Override for specific dates
    {
      date: Date,
      isAvailable: Boolean,
      slots: [Slot]
    }
  ],
  breakTimes: [                     // Recurring breaks
    {
      day: String,
      startTime: String,
      endTime: String,
      recurring: Boolean
    }
  ],
  slotConfig: {
    defaultDuration: Number,        // In minutes
    availableDurations: [Number],
    buffer: Number
  },
  bookingRules: {
    minBookingNotice: Number,       // In hours
    maxAdvanceBooking: Number,      // In days
    cancellationDeadline: Number    // In hours
  },
  isActive: Boolean,
  timezone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### DaySchedule Schema
```javascript
{
  enabled: Boolean,
  slots: [
    {
      startTime: String,           // "HH:mm" format
      endTime: String,
      slotDuration: Number,        // Optional override
      isAvailable: Boolean
    }
  ]
}
```

## Usage Flow

### For Specialists:

1. **Navigate to Settings**
   - Click Settings from main menu
   - Select "Manage Availability" tab

2. **Configure Slot Settings**
   - Set default slot duration (matches consulting service duration)
   - Set buffer time between slots
   - Define booking rules

3. **Set Weekly Hours**
   - Toggle each day on/off
   - For enabled days, set available time ranges
   - Can add multiple ranges per day (e.g., morning and afternoon)

4. **Save**
   - Click "Save Availability Settings"
   - Settings persist to database

### For Customers:

1. **View Specialist Calendar**
   - Navigate to specialist profile
   - Calendar shows available slots
   - Only displays dates/times matching specialist availability

2. **Book Slot**
   - Select available slot
   - Respects minimum booking notice
   - Cannot book beyond max advance booking days

3. **Cancel Booking**
   - Must cancel before cancellation deadline
   - Frees up slot for other customers

## Integration with Consulting Slots

### Current Status:
- ✅ Availability schedule management system implemented
- ✅ Slot generation utility created
- ⏳ Next: Integrate with ConsultingSlot creation
  - Automatically generate slots from availability schedule
  - Filter slot display by availability patterns
  - Update customer calendar views

### Future Integration Steps:
1. Add endpoint to generate consulting slots from availability
2. Update ManageSlots to show auto-generated slots
3. Filter customer calendar to show only available slots
4. Add UI for managing date exceptions and break times

## Configuration Examples

### Example 1: Standard Business Hours
```json
{
  "specialistEmail": "consultant@example.com",
  "weeklyPattern": {
    "monday": {
      "enabled": true,
      "slots": [{
        "startTime": "09:00",
        "endTime": "17:00",
        "isAvailable": true
      }]
    },
    "tuesday": { "enabled": true, "slots": [{"startTime": "09:00", "endTime": "17:00", "isAvailable": true}] },
    "wednesday": { "enabled": true, "slots": [{"startTime": "09:00", "endTime": "17:00", "isAvailable": true}] },
    "thursday": { "enabled": true, "slots": [{"startTime": "09:00", "endTime": "17:00", "isAvailable": true}] },
    "friday": { "enabled": true, "slots": [{"startTime": "09:00", "endTime": "17:00", "isAvailable": true}] },
    "saturday": { "enabled": false, "slots": [] },
    "sunday": { "enabled": false, "slots": [] }
  },
  "slotConfig": {
    "defaultDuration": 60,
    "availableDurations": [30, 45, 60, 90],
    "buffer": 15
  },
  "bookingRules": {
    "minBookingNotice": 24,
    "maxAdvanceBooking": 90,
    "cancellationDeadline": 24
  }
}
```

### Example 2: Split Shift (Morning & Evening)
```json
{
  "weeklyPattern": {
    "monday": {
      "enabled": true,
      "slots": [
        {
          "startTime": "09:00",
          "endTime": "12:00",
          "isAvailable": true
        },
        {
          "startTime": "14:00",
          "endTime": "18:00",
          "isAvailable": true
        }
      ]
    },
    ...
  },
  "slotConfig": {
    "defaultDuration": 30,
    "buffer": 10
  }
}
```

## API Testing

### Using cURL:

```bash
# Get schedule
curl -X GET http://localhost:5001/api/availability-schedule/specialist/doctor@example.com

# Get available slots for date
curl -X GET http://localhost:5001/api/availability-schedule/slots/doctor@example.com/2024-02-20

# Create schedule
curl -X POST http://localhost:5001/api/availability-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "specialistEmail": "doctor@example.com",
    "weeklyPattern": {...},
    "slotConfig": {...},
    "bookingRules": {...}
  }'

# Update schedule
curl -X PUT http://localhost:5001/api/availability-schedule/:scheduleId \
  -H "Content-Type: application/json" \
  -d '{
    "weeklyPattern": {...}
  }'
```

## Troubleshooting

### Issue: Changes not appearing
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+F5)
- Sign out and back in

### Issue: Slots not generating
- Verify schedule is set to `isActive: true`
- Check date is not in date exceptions with `isAvailable: false`
- Confirm day of week is enabled in weekly pattern

### Issue: Buffer time not applied
- Buffer is only applied between slots, not at start/end
- Increase buffer value if needed
- Minimum slot duration must be > buffer time

## Related Documentation

- [Consulting Slots Implementation Guide](./CONSULTING_SLOTS_API_REFERENCE.md)
- [Service Specific Slots Guide](./SERVICE_SPECIFIC_SLOTS_QUICK_FIX.md)
- [Database Schema Documentation](./COMPLETE_DATABASE_SCHEMA.md)

