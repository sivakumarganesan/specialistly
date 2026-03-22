# 1:1 Consulting Platform - Complete Database Schema

## Overview
MongoDB collections with schema definitions for production-ready consulting platform.

---

## Collections Schema

### 1. **users** Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed with bcrypt),
  name: String,
  userType: enum(['specialist', 'customer']),
  
  // Profile
  profileImage: String (URL),
  bio: String,
  phone: String,
  
  // Account Status
  isVerified: Boolean (default: false),
  verificationToken: String,
  verificationExpires: Date,
  
  // OAuth Tokens
  googleAccessToken: String,
  zoomAccessToken: String,
  
  // Metadata
  lastLogin: Date,
  roles: [String],
  isActive: Boolean (default: true),
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **creatorProfiles** Collection (Specialist)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  email: String (unique),
  creatorName: String,
  
  // Profile
  bio: String,
  phone: String,
  location: String,
  company: String,
  website: String,
  profileImage: String (URL),
  headline: String (e.g., "Executive Coach, 15+ years"),
  
  // Expertise
  specialties: [String] (e.g., ["leadership", "strategy", "startup"])
  languages: [String],
  certifications: [String],
  yearsOfExperience: Number,
  
  // Availability
  availability: {
    timezone: String (e.g., "America/New_York"),
    isAvailable: Boolean,
    workingHours: {
      monday: {
        enabled: Boolean,
        startTime: String (e.g., "09:00"),
        endTime: String (e.g., "17:00")
      },
      tuesday: { ... },
      // ... rest of week
    },
    breakTimes: [{
      day: String,
      startTime: String,
      endTime: String,
      recurring: Boolean
    }],
    unavailableDates: [Date],
    minBookingNotice: Number (hours, e.g., 24),
    maxAdvanceBooking: Number (days, e.g., 90),
    bufferTime: Number (minutes between bookings)
  },
  
  // Consultation Settings
  consulting: {
    sessionDurations: [Number] (e.g., [30, 45, 60, 90] minutes),
    defaultDuration: Number (minutes),
    basePrice: Number,
    currency: String (e.g., "USD"),
    cancellationPolicy: {
      refundableBefore: Number (hours, e.g., 24),
      refundPercentage: Number (e.g., 100)
    }
  },
  
  // Payment Settings
  paymentSettings: {
    stripeAccountId: String,
    bankAccountId: String,
    currency: String
  },
  
  // Statistics
  totalBookings: Number (default: 0),
  totalEarnings: Number (default: 0),
  averageRating: Number (0-5),
  reviewCount: Number,
  responseTime: Number (average hours),
  
  // Account
  subscriptionPlan: enum(['free', 'pro']),
  isVerified: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **availabilitySchedules** Collection
```javascript
{
  _id: ObjectId,
  specialistId: ObjectId (ref: 'creatorProfiles'),
  
  // Schedule Type
  type: enum(['weekly', 'monthly', 'custom']),
  
  // Weekly Recurring
  weeklyPattern: {
    monday: {
      enabled: Boolean,
      slots: [{
        startTime: String,      // "09:00"
        endTime: String,        // "11:00"
        slotDuration: Number,   // 60 minutes
        isAvailable: Boolean
      }]
    },
    // ... repeat for each day
  },
  
  // Exceptions & Overrides
  dateExceptions: [{
    date: Date,
    isAvailable: Boolean,
    slots: [{
      startTime: String,
      endTime: String,
      slotDuration: Number
    }]
  }],
  
  // Metadata
  isActive: Boolean (default: true),
  appliedFrom: Date,
  appliedTo: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **availabilitySlots** Collection
```javascript
{
  _id: ObjectId,
  specialistId: ObjectId (ref: 'creatorProfiles'),
  scheduleId: ObjectId (ref: 'availabilitySchedules'),
  
  // Slot Details
  date: Date (start of day),
  startTime: String (e.g., "14:30" in specialist's timezone),
  endTime: String (e.g., "15:30"),
  duration: Number (minutes),
  timezone: String (specialist's timezone),
  
  // Pricing
  price: Number,
  currency: String,
  consultationType: String (e.g., "strategy-session"),
  
  // Status
  status: enum(['available', 'booked', 'blocked', 'expired']),
  
  // Booking Reference (if booked)
  bookingId: ObjectId (ref: 'bookings'),
  customerId: ObjectId (ref: 'customers'),
  bookedAt: Date,
  
  // Tags & Meta
  tags: [String],
  description: String,
  
  // Recurring Pattern (optional)
  isRecurring: Boolean,
  recurrenceRuleId: ObjectId,
  parentSlotId: ObjectId,
  
  // System Fields
  isManuallyBlocked: Boolean,
  blockReason: String,
  
  createdAt: Date,
  updatedAt: Date,
  expiredAt: Date
}

// Indexes
db.availabilitySlots.createIndex({ specialistId: 1, date: 1, status: 1 })
db.availabilitySlots.createIndex({ customerId: 1, status: 1 })
db.availabilitySlots.createIndex({ "date": 1 })
```

### 5. **bookings** Collection
```javascript
{
  _id: ObjectId,
  slotId: ObjectId (ref: 'availabilitySlots'),
  specialistId: ObjectId (ref: 'creatorProfiles'),
  customerId: ObjectId (ref: 'customers'),
  
  // Booking Status
  status: enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: ObjectId,
    reason: String
  }],
  
  // Session Details
  consultationType: String,
  sessionDuration: Number (minutes),
  sessionPrice: Number,
  currency: String,
  
  // Cancellation
  cancellation: {
    status: enum(['not-cancelled', 'cancelled-by-specialist', 'cancelled-by-customer']),
    cancelledAt: Date,
    reason: String,
    requestedAt: Date,
    approvedAt: Date
  },
  
  // Notes
  customerNotes: String (booking request notes),
  specialistNotes: String,
  
  // Session Execution
  meeting: {
    zoomMeetingId: String,
    zoomLink: String,
    zoomStartUrl: String,
    zoomJoinUrl: String,
    googleMeetLink: String,
    
    // Session Timeline
    startedAt: Date,
    endedAt: Date,
    actualDuration: Number (minutes),
    
    // Recording
    recordingId: String,
    recordingUrl: String,
    recordingDuration: Number,
    recordingExpiryDate: Date,
    recordingNotificationSent: Boolean
  },
  
  // Attendance
  attendance: {
    specialistJoined: Boolean,
    customerJoined: Boolean,
    specialistJoinedAt: Date,
    customerJoinedAt: Date,
    specialistLeftAt: Date,
    customerLeftAt: Date
  },
  
  // Feedback (post-session)
  feedback: {
    customerRating: Number (1-5),
    customerReview: String,
    specialistRating: Number (1-5),
    specialistReview: String,
    ratedAt: Date
  },
  
  // Rescheduling
  rescheduleHistory: [{
    fromSlotId: ObjectId,
    toSlotId: ObjectId,
    rescheduledAt: Date,
    rescheduledBy: ObjectId,
    reason: String
  }],
  
  // Metadata
  timezone: String (customer's timezone, if applicable),
  reminders: {
    day_before_sent: Boolean,
    hour_before_sent: Boolean,
    post_session_sent: Boolean
  },
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.bookings.createIndex({ slotId: 1 })
db.bookings.createIndex({ specialistId: 1, status: 1 })
db.bookings.createIndex({ customerId: 1, status: 1 })
db.bookings.createIndex({ "meeting.zoomMeetingId": 1 })
```

### 6. **payments** Collection
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId (ref: 'bookings'),
  specialistId: ObjectId (ref: 'creatorProfiles'),
  customerId: ObjectId (ref: 'customers'),
  
  // Payment Amount
  amount: Number,
  currency: String,
  
  // Split
  platformFee: Number (e.g., amount * 0.2),
  platformFeePercentage: Number (e.g., 20),
  specialistPayout: Number,
  
  // Stripe Integration
  stripePaymentIntentId: String (unique),
  stripeChargeId: String,
  stripeCustomerId: String,
  stripeConnectAccountId: String,
  
  // Payment Status
  status: enum(['pending', 'succeeded', 'failed', 'refunded', 'chargeback']),
  paymentMethod: enum(['card', 'bank_transfer', 'wallet']),
  
  // Timeline
  createdAt: Date,
  initiatedAt: Date,
  succeededAt: Date,
  failedAt: Date,
  refundedAt: Date,
  
  // Failure Info
  failureCode: String,
  failureMessage: String,
  failureReason: String,
  
  // Refund
  refund: {
    requestedAt: Date,
    requestedBy: ObjectId,
    reason: String,
    refundAmount: Number,
    refundedAt: Date,
    stripeRefundId: String,
    status: enum(['pending', 'succeeded', 'failed'])
  },
  
  // Invoice
  invoiceId: String,
  invoiceUrl: String,
  receiptNumber: String,
  
  // Metadata
  metadata: {
    specialistName: String,
    customerEmail: String,
    consultationType: String,
    duration: Number
  },
  
  // Idempotency
  idempotencyKey: String (unique),
  
  updatedAt: Date
}

// Indexes
db.payments.createIndex({ bookingId: 1 })
db.payments.createIndex({ specialistId: 1, status: 1 })
db.payments.createIndex({ customerId: 1, status: 1 })
db.payments.createIndex({ "stripePaymentIntentId": 1 })
db.payments.createIndex({ "createdAt": 1 })
```

### 7. **customers** Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  email: String (unique),
  
  // Profile
  name: String,
  phone: String,
  profileImage: String,
  company: String,
  role: String,
  
  // Preferences
  timezone: String,
  language: String,
  preferences: {
    emailNotifications: Boolean,
    smsNotifications: Boolean,
    remindersEnabled: Boolean
  },
  
  // Statistics
  totalBookings: Number,
  totalSpent: Number,
  averageSpentPerSession: Number,
  
  // Payment Methods
  defaultPaymentMethodId: String (Stripe),
  savedPaymentMethods: [{
    stripePaymentMethodId: String,
    isDefault: Boolean,
    cardLast4: String,
    cardBrand: String
  }],
  
  // Address (for invoicing)
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Account
  status: enum(['active', 'suspended', 'deleted']),
  emailVerified: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **notifications** Collection
```javascript
{
  _id: ObjectId,
  recipientId: ObjectId (ref: 'users'),
  
  // Notification Details
  type: enum([
    'booking_confirmation',
    'booking_reminder',
    'session_started',
    'session_completed',
    'recording_ready',
    'payment_received',
    'refund_processed',
    'availability_request',
    'message_received'
  ]),
  
  // Content
  title: String,
  message: String,
  action: String (e.g., "join_meeting", "view_recording"),
  actionUrl: String,
  
  // Related IDs
  bookingId: ObjectId,
  paymentId: ObjectId,
  
  // Status
  isRead: Boolean (default: false),
  isArchived: Boolean (default: false),
  
  // Delivery
  channels: [enum(['email', 'in-app', 'sms'])],
  emailSentAt: Date,
  smsSentAt: Date,
  
  // Metadata
  metadata: {
    specialistName: String,
    customerName: String,
    sessionTime: Date
  },
  
  createdAt: Date,
  expiresAt: Date (after 30 days)
}

// Indexes
db.notifications.createIndex({ recipientId: 1, isRead: 1 })
db.notifications.createIndex({ recipientId: 1, "createdAt": -1 })
```

### 9. **reviews** Collection (Future)
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId (ref: 'bookings'),
  specialistId: ObjectId (ref: 'creatorProfiles'),
  customerId: ObjectId (ref: 'customers'),
  
  // Rating
  rating: Number (1-5),
  reviewText: String,
  
  // Aspects
  aspects: {
    professionalism: Number,
    expertise: Number,
    communication: Number,
    valueForMoney: Number
  },
  
  // Response
  specialistResponse: String,
  respondedAt: Date,
  
  // Visibility
  isPublic: Boolean,
  isVerifiedBooking: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.reviews.createIndex({ specialistId: 1, "createdAt": -1 })
db.reviews.createIndex({ customerId: 1, "createdAt": -1 })
```

### 10. **sessions** Collection
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId (ref: 'bookings'),
  zoomMeetingId: String,
  
  // Attendees
  specialistId: ObjectId,
  customerId: ObjectId,
  
  // Timing
  scheduledStartTime: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Zoom Data
  duration: Number (minutes, from Zoom),
  participants: [{
    userId: String,
    name: String,
    email: String,
    joinTime: Date,
    leaveTime: Date,
    duration: Number
  }],
  
  // Recording
  hasRecording: Boolean,
  recordingId: String,
  recordingUrl: String,
  recordingDuration: Number,
  
  // Analytics
  screenshare: Boolean,
  screenShareDuration: Number,
  
  createdAt: Date
}
```

---

## Migration Scripts

### Create All Collections with Proper Indexes
```javascript
// 1. Create availabilitySchedules
db.createCollection("availabilitySchedules")

// 2. Create availabilitySlots with indexes
db.createCollection("availabilitySlots")
db.availabilitySlots.createIndex({ specialistId: 1, date: 1, status: 1 })
db.availabilitySlots.createIndex({ customerId: 1, status: 1 })
db.availabilitySlots.createIndex({ "date": 1 })

// 3. Create bookings with indexes
db.createCollection("bookings")
db.bookings.createIndex({ slotId: 1 })
db.bookings.createIndex({ specialistId: 1, status: 1 })
db.bookings.createIndex({ customerId: 1, status: 1 })
db.bookings.createIndex({ "meeting.zoomMeetingId": 1 })

// 4. Create payments with indexes
db.createCollection("payments")
db.payments.createIndex({ bookingId: 1 })
db.payments.createIndex({ specialistId: 1, status: 1 })
db.payments.createIndex({ customerId: 1, status: 1 })
db.payments.createIndex({ "stripePaymentIntentId": 1 })
db.payments.createIndex({ "createdAt": 1 })

// 5. Create notifications
db.createCollection("notifications")
db.notifications.createIndex({ recipientId: 1, isRead: 1 })
db.notifications.createIndex({ recipientId: 1, "createdAt": -1 })
```

---

## Data Relationships & Cardinality

```
┌─────────────────────────────────────────────────────────┐
│                    SPECIALIST                            │
│              (creatorProfiles)                           │
└─────────────────────────────────────────────────────────┘
               │                    │
               ├─ 1:N ─────────────┬─ availabilitySchedules
               │                    │   (Many schedules per specialist)
               │                    │
               ├─ 1:N ─────────────┬─ availabilitySlots
               │                    │   (Many slots per specialist)
               │                    │
               └─ 1:N ─────────────┬─ bookings
                                    │   (Many bookings per specialist)
                                    │
                      ┌─────────────┘
                      ├─────┬──────────────────────────────┐
                            ↓                              ↓
                        ┌────────────┐          ┌──────────────────┐
                        │  payments  │          │   notifications  │
                        └────────────┘          └──────────────────┘
                              ↓
                        ┌──────────────┐
                        │  bookings    │
                        │   (session   │
                        │  details)    │
                        └──────────────┘
                              ↓
                        ┌──────────────┐
                        │   sessions   │
                        │  (Zoom data) │
                        └──────────────┘
```

---

## Query Examples

### Get Available Slots for Specialist
```javascript
db.availabilitySlots.find({
  specialistId: ObjectId("..."),
  date: { $gte: new Date(), $lte: new Date(Date.now() + 90*24*60*60*1000) },
  status: "available"
}).sort({ date: 1, startTime: 1 })
```

### Get Specialist's Booking History
```javascript
db.bookings.aggregate([
  {
    $match: {
      specialistId: ObjectId("..."),
      status: "completed"
    }
  },
  {
    $sort: { "createdAt": -1 }
  },
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customerDetails"
    }
  }
])
```

### Get Total Earnings for Specialist
```javascript
db.payments.aggregate([
  {
    $match: {
      specialistId: ObjectId("..."),
      status: "succeeded",
      succeededAt: { $gte: new Date("2024-01-01") }
    }
  },
  {
    $group: {
      _id: "$specialistId",
      totalEarnings: { $sum: "$specialistPayout" },
      transactionCount: { $sum: 1 }
    }
  }
])
```

---

## Notes

- All timezone-sensitive data stored in UTC
- Specialist timezone stored for conversion to local display
- Payment records immutable (never delete, only refund)
- Sessions created from Zoom webhook data
- Notifications auto-expire after 30 days
