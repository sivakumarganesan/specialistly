# 1:1 Consulting Platform - Complete API Reference

**API Version:** 2.0  
**Base URL:** `https://api.specialistly.com/api`  
**Authentication:** JWT Token in Authorization header

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Availability APIs](#availability-apis)
3. [Booking APIs](#booking-apis)
4. [Payment APIs](#payment-apis)
5. [Specialist APIs](#specialist-apis)
6. [Session APIs](#session-apis)
7. [Review APIs](#review-apis)
8. [Notification APIs](#notification-apis)

---

## Authentication APIs

### POST `/auth/signup`
Create new user account

**Request:**
```javascript
{
  name: String,
  email: String,
  password: String,
  userType: enum('specialist', 'customer'),
  isSpecialist: Boolean,
  membership: enum('free', 'pro')
}
```

**Response:**
```javascript
{
  success: Boolean,
  token: String,
  user: {
    id: ObjectId,
    name: String,
    email: String,
    userType: String
  }
}
```

---

## Availability APIs

### POST `/availability`
Create availability schedule for specialist

**Request:**
```javascript
{
  specialistId: ObjectId,
  type: enum('weekly', 'monthly', 'custom'),
  timezone: String,
  weeklyPattern: {
    monday: {
      enabled: Boolean,
      slots: [{
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 60
      }]
    },
    // ... other days
  },
  bookingRules: {
    minBookingNotice: 24,
    maxAdvanceBooking: 90,
    cancellationDeadline: 24
  }
}
```

**Response:**
```javascript
{
  success: Boolean,
  data: {
    _id: ObjectId,
    specialistId: ObjectId,
    type: String,
    weeklyPattern: Object,
    createdAt: Date,
    updatedAt: Date
  }
}
```

---

### GET `/availability/:specialistId`
Get specialist's availability configuration

**Query Parameters:**
- `specialistId` - Specialist ID

**Response:**
```javascript
{
  success: Boolean,
  data: {
    _id: ObjectId,
    timezone: String,
    workingHours: Object,
    type: String,
    isActive: Boolean
  }
}
```

---

### PUT `/availability/:scheduleId`
Update availability schedule

**Request:**
```javascript
{
  weeklyPattern: Object,
  bookingRules: Object,
  dateExceptions: Array,
  isActive: Boolean
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Availability updated",
  data: Object
}
```

---

### POST `/availability/:scheduleId/generate-slots`
Generate available time slots based on schedule

**Request:**
```javascript
{
  startDate: Date,
  endDate: Date,
  overwrite: Boolean (default: false)
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Slots generated",
  data: {
    generated: Number,
    slots: [{
      _id: ObjectId,
      date: Date,
      startTime: String,
      endTime: String,
      status: 'available'
    }]
  }
}
```

---

### GET `/availability/slots`
Get available time slots (for customers)

**Query Parameters:**
- `specialistId` - Filter by specialist
- `startDate` - From date
- `endDate` - To date
- `duration` - Filter by duration (30, 45, 60, 90)
- `page` - Pagination
- `limit` - Items per page

**Response:**
```javascript
{
  success: Boolean,
  data: {
    slots: [{
      _id: ObjectId,
      date: Date,
      startTime: String,
      endTime: String,
      price: Number,
      specialistName: String
    }],
    total: Number,
    page: Number
  }
}
```

---

### GET `/availability/:specialistId/calendar`
Get specialist's full calendar with booked/available slots

**Query Parameters:**
- `month` - Month (YYYY-MM)
- `timezone` - Customer's timezone for conversion

**Response:**
```javascript
{
  success: Boolean,
  data: {
    specialistId: ObjectId,
    specialistName: String,
    timezone: String,
    calendar: {
      "2024-02-17": [{
        _id: ObjectId,
        startTime: "09:00",
        endTime: "10:00",
        status: "available|booked|blocked",
        price: Number
      }]
    }
  }
}
```

---

## Booking APIs

### POST `/bookings`
Create new booking

**Request:**
```javascript
{
  slotId: ObjectId,
  specialistId: ObjectId,
  customerEmail: String,
  customerName: String,
  customerNotes: String (optional)
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Booking created successfully",
  data: {
    _id: ObjectId,
    slotId: ObjectId,
    specialistId: ObjectId,
    customerId: ObjectId,
    status: 'pending',
    sessionPrice: Number,
    meeting: {
      zoomMeetingId: String,
      zoomLink: String
    }
  }
}
```

**Error Response:**
```javascript
{
  success: false,
  message: "Slot not available",
  code: "SLOT_NOT_AVAILABLE"
}
```

---

### GET `/bookings`
Get user's bookings

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, completed, cancelled)
- `specialization` - Filter by specialist
- `startDate` - From date
- `endDate` - To date
- `page` - Pagination
- `limit` - Items per page

**Response:**
```javascript
{
  success: Boolean,
  data: {
    bookings: [{
      _id: ObjectId,
      slotId: ObjectId,
      specialistName: String,
      sessionPrice: Number,
      status: String,
      date: Date,
      time: String,
      meeting: {
        zoomLink: String
      }
    }],
    total: Number,
    page: Number
  }
}
```

---

### GET `/bookings/:bookingId`
Get booking details

**Response:**
```javascript
{
  success: Boolean,
  data: {
    _id: ObjectId,
    slotId: ObjectId,
    specialistId: ObjectId,
    customerId: ObjectId,
    status: String,
    sessionPrice: Number,
    consultationType: String,
    customerNotes: String,
    meeting: {
      zoomMeetingId: String,
      zoomLink: String,
      startedAt: Date,
      endedAt: Date,
      recordingUrl: String
    },
    feedback: {
      rating: Number,
      review: String
    }
  }
}
```

---

### PUT `/bookings/:bookingId`
Update booking (add notes, feedback)

**Request:**
```javascript
{
  customerNotes: String (optional),
  specialistNotes: String (optional),
  feedback: {
    rating: Number,
    review: String
  }
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Booking updated",
  data: Object
}
```

---

### POST `/bookings/:bookingId/reschedule`
Reschedule booking to new time slot

**Request:**
```javascript
{
  newSlotId: ObjectId,
  reason: String (optional)
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Booking rescheduled",
  data: {
    _id: ObjectId,
    slotId: ObjectId,
    meeting: {
      zoomLink: String
    }
  }
}
```

---

### DELETE `/bookings/:bookingId`
Cancel booking

**Request:**
```javascript
{
  reason: String,
  requestRefund: Boolean (default: true)
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Booking cancelled",
  data: {
    _id: ObjectId,
    status: "cancelled",
    refundInitiated: Boolean
  }
}
```

**Error Cases:**
```javascript
// Within cancellation deadline
{
  success: true,
  message: "Full refund will be processed"
}

// After cancellation deadline
{
  success: true,
  message: "Booking cancelled. No refund available."
}

// Session already started
{
  success: false,
  message: "Cannot cancel ongoing session"
}
```

---

### GET `/bookings/:bookingId/receipt`
Get booking receipt/invoice

**Response:**
```javascript
{
  success: Boolean,
  data: {
    receiptNumber: String,
    bookingId: ObjectId,
    invoiceUrl: String,
    pdfUrl: String
  }
}
```

---

## Payment APIs

### POST `/payments/create-intent`
Create Stripe payment intent

**Request:**
```javascript
{
  bookingId: ObjectId,
  amount: Number,
  currency: String (default: 'USD'),
  idempotencyKey: String (for idempotency)
}
```

**Response:**
```javascript
{
  success: Boolean,
  data: {
    clientSecret: String,
    paymentIntentId: String,
    amount: Number,
    currency: String
  }
}
```

---

### POST `/payments/confirm`
Confirm Stripe payment

**Request:**
```javascript
{
  paymentIntentId: String,
  bookingId: ObjectId
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Payment successful",
  data: {
    _id: ObjectId,
    status: "succeeded",
    amount: Number,
    specialistPayout: Number
  }
}
```

---

### POST `/payments/webhook`
Stripe webhook handler

**Webhook Events:**
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed

**Response:**
```javascript
{
  received: true
}
```

---

### GET `/payments/history`
Get user's payment history

**Query Parameters:**
- `status` - Filter by status (pending, succeeded, failed, refunded)
- `startDate` - From date
- `endDate` - To date
- `limit` - Items per page

**Response:**
```javascript
{
  success: Boolean,
  data: {
    payments: [{
      _id: ObjectId,
      bookingId: ObjectId,
      amount: Number,
      status: String,
      createdAt: Date,
      specialistName: String
    }],
    total: Number
  }
}
```

---

### POST `/payments/:paymentId/refund`
Request refund

**Request:**
```javascript
{
  reason: String,
  amount: Number (optional, for partial refund)
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Refund initiated",
  data: {
    _id: ObjectId,
    status: "refund_pending",
    refundAmount: Number,
    estimatedRefundDate: Date
  }
}
```

---

## Specialist APIs

### GET `/specialists`
List all specialists with their services

**Query Parameters:**
- `specialty` - Filter by specialty
- `minRating` - Minimum rating (1-5)
- `maxPrice` - Maximum hourly rate
- `availability` - Show only available
- `page` - Pagination
- `limit` - Items per page
- `search` - Search by name

**Response:**
```javascript
{
  success: Boolean,
  data: {
    specialists: [{
      _id: ObjectId,
      name: String,
      headline: String,
      bio: String,
      profileImage: String,
      specialties: [String],
      avgRating: Number,
      reviewCount: Number,
      basePrice: Number,
      availability: {
        isAvailable: Boolean,
        nextAvailableSlot: Date
      }
    }],
    total: Number,
    page: Number
  }
}
```

---

### GET `/specialists/:specialistId`
Get specialist profile

**Response:**
```javascript
{
  success: Boolean,
  data: {
    _id: ObjectId,
    name: String,
    email: String,
    headline: String,
    bio: String,
    profileImage: String,
    specialties: [String],
    languages: [String],
    yearsOfExperience: Number,
    certifications: [String],
    
    // Services
    services: [{
      _id: ObjectId,
      title: String,
      description: String,
      duration: Number,
      price: Number
    }],
    
    // Reviews
    reviews: {
      avgRating: Number,
      totalReviews: Number,
      recentReviews: [{
        rating: Number,
        review: String,
        customerName: String,
        date: Date
      }]
    },
    
    // Availability
    availability: {
      timezone: String,
      isAvailable: Boolean,
      nextSlots: [Date]
    }
  }
}
```

---

### PUT `/specialists/:specialistId`
Update specialist profile

**Authorization:** Specialist only

**Request:**
```javascript
{
  creatorName: String,
  bio: String,
  headline: String,
  specialties: [String],
  languages: [String],
  yearsOfExperience: Number,
  availability: {
    timezone: String,
    isAvailable: Boolean
  }
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Profile updated",
  data: Object
}
```

---

### GET `/specialists/:specialistId/earnings`
Get specialist's earnings dashboard

**Authorization:** Specialist only

**Query Parameters:**
- `period` - 'week', 'month', 'year'
- `startDate` - From date
- `endDate` - To date

**Response:**
```javascript
{
  success: Boolean,
  data: {
    period: String,
    totalEarnings: Number,
    totalBookings: Number,
    completedSessions: Number,
    pendingPayouts: Number,
    averageSessionValue: Number,
    
    // Breakdown by service
    byService: [{
      serviceId: ObjectId,
      serviceTitle: String,
      bookings: Number,
      earnings: Number
    }],
    
    // Timeline
    dailyEarnings: [{
      date: Date,
      earnings: Number,
      bookings: Number
    }]
  }
}
```

---

## Session APIs

### GET `/sessions/:bookingId`
Get session details

**Response:**
```javascript
{
  success: Boolean,
  data: {
    _id: ObjectId,
    bookingId: ObjectId,
    zoomMeetingId: String,
    
    // Timing
    scheduledStartTime: Date,
    actualStartTime: Date,
    actualEndTime: Date,
    duration: Number,
    
    // Participants
    participants: [{
      name: String,
      email: String,
      joinTime: Date,
      leaveTime: Date
    }],
    
    // Recording
    hasRecording: Boolean,
    recordingUrl: String,
    recordingDuration: Number,
    recordingExpiryDate: Date,
    
    // Metadata
    screenshare: Boolean,
    sessionNotes: String
  }
}
```

---

### POST `/sessions/:bookingId/notes`
Add session notes (post-meeting)

**Authorization:** Specialist or Customer

**Request:**
```javascript
{
  notes: String,
  isPublic: Boolean (default: false)
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Notes saved",
  data: Object
}
```

---

### POST `/sessions/:bookingId/recording/share`
Share recording with customer

**Authorization:** Specialist only

**Request:**
```javascript
{
  expiryDays: Number,
  downloadable: Boolean,
  includeTranscript: Boolean
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Recording shared",
  data: {
    recordingUrl: String,
    expiryDate: Date
  }
}
```

---

## Review APIs

### POST `/reviews`
Create review for completed session

**Authorization:** Customer only

**Request:**
```javascript
{
  bookingId: ObjectId,
  rating: Number (1-5),
  reviewText: String,
  aspects: {
    professionalism: Number,
    expertise: Number,
    communication: Number,
    valueForMoney: Number,
    punctuality: Number
  }
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Review submitted",
  data: {
    _id: ObjectId,
    bookingId: ObjectId,
    rating: Number,
    createdAt: Date
  }
}
```

---

### GET `/reviews/specialist/:specialistId`
Get reviews for specialist

**Query Parameters:**
- `rating` - Filter by rating
- `page` - Pagination
- `limit` - Items per page
- `sort` - 'newest', 'oldest', 'highest', 'lowest'

**Response:**
```javascript
{
  success: Boolean,
  data: {
    reviews: [{
      _id: ObjectId,
      rating: Number,
      reviewText: String,
      customerName: String,
      aspects: Object,
      createdAt: Date,
      specialistResponse: String
    }],
    summary: {
      averageRating: Number,
      totalReviews: Number,
      ratingDistribution: {
        5: Number,
        4: Number,
        3: Number,
        2: Number,
        1: Number
      }
    },
    total: Number,
    page: Number
  }
}
```

---

### POST `/reviews/:reviewId/respond`
Specialist response to review

**Authorization:** Specialist only

**Request:**
```javascript
{
  response: String
}
```

**Response:**
```javascript
{
  success: Boolean,
  message: "Response added",
  data: Object
}
```

---

## Notification APIs

### GET `/notifications`
Get user's notifications

**Query Parameters:**
- `unread` - Show only unread
- `type` - Filter by type
- `page` - Pagination
- `limit` - Items per page

**Response:**
```javascript
{
  success: Boolean,
  data: {
    notifications: [{
      _id: ObjectId,
      type: String,
      title: String,
      message: String,
      action: String,
      actionUrl: String,
      isRead: Boolean,
      createdAt: Date
    }],
    unreadCount: Number,
    total: Number
  }
}
```

---

### PUT `/notifications/:notificationId/read`
Mark notification as read

**Response:**
```javascript
{
  success: Boolean,
  message: "Marked as read"
}
```

---

### PUT `/notifications/read-all`
Mark all notifications as read

**Response:**
```javascript
{
  success: Boolean,
  message: "All notifications marked as read"
}
```

---

### DELETE `/notifications/:notificationId`
Delete notification

**Response:**
```javascript
{
  success: Boolean,
  message: "Notification deleted"
}
```

---

## Error Response Format

All errors follow this format:

```javascript
{
  success: false,
  message: "User-friendly error message",
  code: "ERROR_CODE",
  details: {
    field: "error message" // For validation errors
  },
  statusCode: 400
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `CONFLICT` - Resource already exists
- `PAYMENT_FAILED` - Payment processing failed
- `SLOT_NOT_AVAILABLE` - Time slot unavailable
- `BOOKING_EXPIRED` - Booking session expired
- `REFUND_NOT_ALLOWED` - Refund not eligible
- `INTERNAL_ERROR` - Server error

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (1-indexed)
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```javascript
{
  data: Array,
  pagination: {
    page: Number,
    limit: Number,
    total: Number,
    totalPages: Number,
    hasNext: Boolean,
    hasPrev: Boolean
  }
}
```

---

## Rate Limiting

- **Public endpoints**: 100 requests / minute per IP
- **Authenticated endpoints**: 1000 requests / minute per user
- **Payment endpoints**: 10 requests / minute per user

Response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1708122000
```

---

## Implementation Checklist

- [ ] Availability Schedule Controller & Routes
- [ ] Booking Controller & Routes  
- [ ] Payment Controller & Stripe Integration
- [ ] Session/Recording Handler
- [ ] Review Controller & Routes
- [ ] Notification Service & Routes
- [ ] Specialist Dashboard APIs
- [ ] Error Handling Middleware
- [ ] Authentication Middleware
- [ ] Input Validation
- [ ] Rate Limiting
- [ ] Comprehensive Testing
- [ ] API Documentation (Swagger/Postman)
- [ ] Performance Optimization
- [ ] Security Audit
