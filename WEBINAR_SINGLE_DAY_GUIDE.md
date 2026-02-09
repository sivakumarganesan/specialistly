# Webinar Single Day Setup & Customer Booking Flow

## Overview
Specialists can now create "Single Day" webinars with specific date/time, which automatically create appointment slots when activated. Customers can book these slots and will appear in the specialist's customer list.

## Step-by-Step Guide

### Step 1: Create a Webinar Service (Specialist)

1. **Login as Specialist**
   - Email: `specialist@test.com`
   - Password: `password123`

2. **Navigate to Services**
   - Click "Services" in the sidebar

3. **Create New Service**
   - Click "Create Webinar" button
   - Fill in basic details:
     - **Title**: e.g., "Advanced React Workshop"
     - **Description**: e.g., "Learn advanced React patterns and hooks"
     - **Price**: e.g., "99"
     - **Capacity**: e.g., "50"

4. **Configure Webinar Settings**
   - **Event Type**: Select "Single Day" ✨ (NEW)
   - **Webinar Location**: Select "Zoom"
   - **Duration**: Select duration (e.g., "60 minutes")
   - **Session Frequency**: Select "One time"
   
5. **Set Date & Time** ✨ (NEW)
   - **Webinar Date & Time** field will appear for "Single Day"
   - Enter:
     - **Date**: Pick a future date (e.g., Feb 10, 2026)
     - **Time**: Enter time (e.g., 14:00 / 2:00 PM)
   - This will create a single appointment slot

6. **Save Service**
   - Click "Save Service" button
   - Service is created with status "inactive"

### Step 2: Activate Service & Create Slots

1. **Activate Service**
   - Find your service in the list
   - Click the service card to expand/select it
   - Look for "Activate" button/option
   - Click "Activate"

2. **Automatic Slot Creation** ✨
   - When service is activated:
     - Appointment slot is automatically created for the date/time you specified
     - Slot status: "available"
     - Alert confirms: "✓ Webinar activated! 1 appointment slot(s) created."

### Step 3: Customer Views & Books Service

1. **Login as Customer**
   - Email: `customer@test.com`
   - Password: `password123`

2. **Search for Specialist**
   - Go to Marketplace or search
   - Find your specialist's profile

3. **View Services**
   - View the specialist's "Advanced React Workshop" service
   - See available slots:
     - Date: Feb 10, 2026
     - Time: 14:00 (2:00 PM)
     - Status: Available for booking

4. **Book Appointment**
   - Click on available slot
   - Confirm booking
   - Booking confirmation sent
   - Zoom meeting link provided

### Step 4: Specialist Sees Customer

1. **Login as Specialist**

2. **Navigate to Customers**
   - Click "Customers" in the sidebar

3. **See Booked Customer** ✨
   - Customer who booked appears in the Customers list
   - Filtered by: specialist email
   - Shows:
     - Customer name
     - Email
     - Booking status
     - Service booked

## Data Flow

```
Specialist Creates Webinar
  ↓
Sets Date/Time (Single Day)
  ↓
Activates Service
  ↓
Appointment Slot Created
  with date, time, specialist info
  ↓
Customer Finds Service
  ↓
Customer Books Slot
  ↓
Specialist's Specialists Array Updated
  with customer info
  ↓
Customer Appears in Specialist's Customers Page
```

## Database Changes

### Customer Model
- Added `specialists` array field
- Tracks which specialists the customer has booked with
- Structure:
  ```javascript
  specialists: [{
    specialistId,
    specialistEmail,
    specialistName,
    firstBookedDate
  }]
  ```

### Service Form UI
- Date/Time inputs show when:
  - **Event Type** = "Single Day" OR
  - **Session Frequency** = "On Selected Dates"
- Only "Single Day" shows single date/time pair
- "On Selected Dates" allows multiple dates via "Add Date" button

### Appointment Slot
- Created with all specialist details
- Linked to service
- Assigned to specific date/time from form

## Key Features

✅ **Single Day Webinar Creation**
- Simple interface for one-time events
- Date and time selection in form
- Automatic slot creation on activation

✅ **Specialist-Customer Linking**
- Customers automatically tracked in specialist's profile
- Query filters by `specialists.specialistEmail`
- Specialist sees only their customers

✅ **Full Booking Flow**
- Customer books → Slot marked as booked
- Customer data saved to bookings array
- Specialist data saved to specialists array
- Zoom integration for meeting links

## Testing Checklist

- [ ] Create webinar with "Single Day" event type
- [ ] Enter date and time for single day
- [ ] Activate service and verify slot creation
- [ ] Login as customer and search specialist
- [ ] View available slots for the date
- [ ] Book the appointment
- [ ] Confirm zoom meeting details sent
- [ ] Login as specialist
- [ ] Go to Customers page
- [ ] Verify customer appears in list
- [ ] Check customer shows service they booked
