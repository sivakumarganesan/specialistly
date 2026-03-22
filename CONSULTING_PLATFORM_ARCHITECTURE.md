# Production-Ready 1:1 Consulting Platform Architecture
## Senior Full-Stack Architecture Design

**Created:** February 17, 2026  
**Status:** Comprehensive System Design  
**Technology Stack:** MongoDB • Express • React • Node.js (MERN)

---

## 📋 Executive Overview

A enterprise-grade 1:1 consulting platform (similar to Exly/Kajabi) enabling:
- **Specialists**: Create availability, manage schedules, receive bookings
- **Customers**: Browse specialists, view available slots, book consultations, attend sessions
- **Platform**: Secure bookings, payments, video conferencing, automated workflows

**Key Differentiators:**
- Timezone-aware scheduling
- Real-time availability management
- Integrated video conferencing (Zoom)
- Payment processing (Stripe)
- Automated notifications & reminders

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Specialist │  │   Customer   │  │   Admin Panel    │  │
│  │      UI      │  │      UI      │  │   (Future)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Express)                      │
│  Auth • Availability • Booking • Payment • Notifications   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Availability Manager   │  Booking Engine            │  │
│  │  ├─ Slot Generation     │  ├─ Conflict Detection    │  │
│  │  ├─ Timezone Handling   │  ├─ Payment Processing    │  │
│  │  └─ Recurrence Rules    │  └─ Meeting Creation      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Notification Service   │  Video Service             │  │
│  │  ├─ Email              │  ├─ Zoom Integration       │  │
│  │  ├─ SMS (Optional)     │  ├─ Recording & Playback   │  │
│  │  └─ Push (Future)      │  └─ Stream Analytics       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER (MongoDB)                       │
│  Users • CreatorProfile • Availabilities • Bookings         │
│  Payments • Notifications • Sessions • Recordings           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
│  Zoom • Stripe • SendGrid • Twilio (Optional)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### 1. **Specialist Availability Model**
```javascript
// Extends CreatorProfile with new fields
availability: {
  timezone: String,                    // "America/New_York"
  workingHours: {
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    // ... rest of week
  },
  breakTimes: [{
    day: String,                       // "monday"
    start: "12:00",
    end: "13:00",
  }],
  unavailableDates: [Date],           // Holidays, days off
  minBookingNotice: Number,           // Hours (e.g., 24)
  maxAdvanceBooking: Number,          // Days (e.g., 90)
  bufferTime: Number,                 // Minutes between bookings
  slotDuration: [30, 45, 60, 90],    // Available durations in minutes
}
```

### 2. **Availability Slot Model** (Enhanced)
```javascript
schema: {
  specialistId: ObjectId,             // Reference to specialist
  date: Date,                          // Slot date
  startTime: String,                   // "14:30" (24-hour format)
  endTime: String,                     // "15:30"
  duration: Number,                    // In minutes
  timezone: String,                    // Specialist's timezone
  price: Number,                       // Consulting fee
  serviceId: ObjectId,                 // Link to service offering
  
  // Availability Status
  status: enum('available', 'booked', 'blocked'),
  bookedBy: ObjectId,                  // Customer who booked
  
  // Recurring pattern (if applicable)
  recurrenceRule: String,              // RRULE format
  parentSlotId: ObjectId,              // If recurring
  
  // Metadata
  tags: [String],                      // e.g., ["1:1 consulting", "strategy"]
  description: String,
  
  // Booking Details
  booking: {
    customerId: ObjectId,
    customerEmail: String,
    customerName: String,
    bookingDate: Date,
    cancellationDeadline: Date,
    refundPolicy: String,
  },
  
  // Meeting Details
  meeting: {
    zoomMeetingId: String,
    zoomLink: String,
    zoomHostId: String,
    googleMeetLink: String,
    endTime: Date,
  },
  
  // Session Info
  session: {
    status: enum('scheduled', 'in-progress', 'completed', 'cancelled'),
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    notes: String,
  },
  
  // Recording
  recording: {
    recordingId: String,
    recordingUrl: String,
    recordingDuration: Number,
    expiryDate: Date,
    isPublic: Boolean,
  },
  
  timestamps: true
}
```

### 3. **Booking Model** (New - Standalone for transactions)
```javascript
schema: {
  slotId: ObjectId,                    // Reference to slot
  specialistId: ObjectId,
  customerId: ObjectId,
  
  // Booking Details
  status: enum('pending', 'confirmed', 'cancelled', 'completed'),
  bookedAt: Date,
  cancellationType: enum('customer', 'specialist', 'system'),
  cancellationReason: String,
  
  // Payment
  payment: {
    amount: Number,
    currency: String,
    status: enum('pending', 'completed', 'refunded', 'failed'),
    stripePaymentId: String,
    stripeInvoiceId: String,
    paidAt: Date,
    refundAmount: Number,
    refundedAt: Date,
  },
  
  // Notes
  customerNotes: String,
  specialistNotes: String,
  
  timestamps: true
}
```

### 4. **Payment Model** (New)
```javascript
schema: {
  bookingId: ObjectId,
  specialistId: ObjectId,
  customerId: ObjectId,
  
  // Payment Details
  amount: Number,
  currency: String,
  platformFee: Number,
  specialistPayout: Number,
  
  // Stripe Integration
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  stripeConnectAccountId: String,
  
  // Status
  status: enum('pending', 'succeeded', 'failed', 'refunded'),
  failureReason: String,
  
  // Timeline
  createdAt: Date,
  attemptedAt: Date,
  succeededAt: Date,
  
  // Metadata
  metadata: {
    specialistName: String,
    consultationType: String,
    duration: Number,
  }
}
```

---

## 🔄 Workflow Flows

### **A. Specialist Setup Flow**
```
1. Specialist Signup
   ├─ Create User Account
   ├─ Create CreatorProfile
   ├─ Setup Timezone
   └─ Configure Payment Settings (Stripe Connect)

2. Configure Availability
   ├─ Set Working Hours (weekly)
   ├─ Add Break Times
   ├─ Set Slot Duration
   └─ Generate Slots (system auto-generates)

3. Create Consulting Services
   ├─ Define Service Title
   ├─ Set Description & Price
   ├─ Select Duration (30, 45, 60, 90 min)
   ├─ Publish Service
   └─ Generate Initial Slots

4. Connect Zoom Account
   ├─ OAuth Authorization
   ├─ Store Zoom Credentials
   └─ Enable Video Sessions
```

### **B. Customer Booking Flow**
```
1. Browse Specialists
   ├─ View Specialist Profile
   ├─ Read Reviews & Ratings (future)
   ├─ View Services Offered
   └─ Check Availability

2. Select Time Slot
   ├─ View Specialist's Calendar
   ├─ Filter by Service
   ├─ See Prices
   ├─ Convert to Customer's Timezone (future)
   └─ Select Preferred Slot

3. Checkout
   ├─ Review Booking Details
   ├─ Add Custom Notes
   ├─ Apply Promo Code (future)
   └─ Enter Payment Details

4. Payment Processing
   ├─ Validate Card
   ├─ Create Stripe Payment Intent
   ├─ Process Payment
   ├─ Create Booking Record
   └─ Send Confirmation Email

5. Booking Confirmed
   ├─ Update Slot Status → "booked"
   ├─ Send Specialist Notification
   ├─ Send Customer Confirmation
   ├─ Create Zoom Meeting
   └─ Send Zoom Link to Both
```

### **C. Session Execution Flow**
```
1. Pre-Meeting (24 hours before)
   ├─ Send Reminder Email to Customer
   ├─ Send Reminder Email to Specialist
   └─ Verify Zoom Meeting

2. Meeting Start (Customer/Specialist arrive)
   ├─ Join Zoom Meeting
   ├─ Update Slot Status → "in-progress"
   ├─ Start Recording (if enabled)
   └─ Session Timer

3. Meeting End
   ├─ End Zoom Meeting
   ├─ Update Slot Status → "completed"
   ├─ Stop Recording
   ├─ Process Recording
   └─ Save Session Notes

4. Post-Meeting (within 1 hour)
   ├─ Send Recording to Customer (if available)
   ├─ Request Feedback/Rating (future)
   ├─ Calculate Payout
   └─ Update Specialist Earnings
```

---

## 🛣️ API Routes Architecture

### **Authentication Routes** `/api/auth`
```
POST   /signup                 - Create new user
POST   /login                  - User login
POST   /logout                 - User logout
POST   /refresh-token          - Refresh JWT
POST   /forgot-password        - Password reset
```

### **Availability Routes** `/api/availability`
```
GET    /                       - Get specialist's availability config
POST   /                       - Create availability config
PUT    /:id                    - Update availability config
GET    /slots                  - Get available slots (with filters)
POST   /slots/generate         - Generate slots from config
POST   /slots/:slotId/block    - Block a slot

GET    /:specialistId/calendar - Get specialist's full calendar
GET    /:specialistId/slots?filters - Get filtered available slots
```

### **Booking Routes** `/api/bookings`
```
GET    /                       - Get all bookings (for user)
POST   /                       - Create new booking
GET    /:bookingId             - Get booking details
PUT    /:bookingId             - Update booking
DELETE /:bookingId             - Cancel booking
GET    /:bookingId/receipt     - Get booking receipt

POST   /:bookingId/reschedule  - Reschedule booking
POST   /:bookingId/refund      - Request refund
```

### **Payment Routes** `/api/payments`
```
POST   /create-intent          - Create Stripe payment intent
POST   /webhook                - Stripe webhook handler
GET    /history                - Get payment history
GET    /:paymentId             - Get payment details
POST   /:paymentId/refund      - Process refund
```

### **Slot Routes** `/api/slots`
```
GET    /available              - Get available slots (filters: specialty, date, time)
GET    /:slotId                - Get slot details
POST   /:slotId/book           - Book a slot
PUT    /:slotId                - Update slot
DELETE /:slotId                - Delete slot

GET    /specialist/:specialistId/calendar - Full calendar
POST   /bulk/generate          - Generate multiple slots
```

### **Specialist Routes** `/api/specialists`
```
GET    /                       - List all specialists with availability
GET    /:specialistId          - Get specialist profile & availability
GET    /:specialistId/reviews  - Get specialist reviews (future)
GET    /:specialistId/availability - Get availability schedule
```

---

## 🔐 Security & Best Practices

### **Authentication & Authorization**
```
✅ JWT Token-based Auth
✅ Role-based Access Control (RBAC)
✅ OAuth2 for Zoom Integration
✅ Password Hashing (bcrypt)
✅ Rate Limiting on APIs
✅ CORS Protection
```

### **Payment Security**
```
✅ PCI Compliance (Use Stripe, never store card data)
✅ Stripe Connect for Payouts
✅ Idempotent API Calls
✅ Payment Webhook Verification
✅ Encrypted Payment Data
```

### **Data Protection**
```
✅ Environment Variables for Secrets
✅ Encrypted DB Connections
✅ SQL Injection Prevention (MongoDB parameterized queries)
✅ XSS Protection
✅ CSRF Tokens on Forms
```

### **Timezone Handling**
```
✅ Store all times in UTC in DB
✅ Convert to specialist's timezone for display
✅ Convert to customer's timezone (future enhancement)
✅ Use libraries: date-fns, day.js with timezone support
```

---

## 📱 Frontend Components Architecture

### **Specialist Dashboard**
```
SpecialistDashboard/
├─ AvailabilityManager
│  ├─ WeeklyScheduleEditor
│  ├─ BreakTimeManager
│  ├─ UnavailableDatesManager
│  └─ SlotGenerationPreview
├─ BookingsCalendar
│  ├─ BookingsList
│  ├─ BookingDetails
│  └─ CancellationHandler
├─ EarningsWidget
└─ UpcomingSessions
```

### **Customer Dashboard**
```
CustomerDashboard/
├─ SpecialistBrowser
│  ├─ SpecialistList
│  ├─ SearchFilters
│  └─ SpecialistProfile
├─ BookingCalendar
│  ├─ AvailableSlots
│  ├─ SlotSelection
│  └─ CheckoutFlow
├─ MyBookings
│  ├─ BookingList
│  ├─ BookingDetails
│  └─ RescheduleButton
└─ SessionHistory
   ├─ CompletedSessions
   ├─ Recordings
   └─ Notes
```

---

## 📦 Deployment & Infrastructure

### **Recommended Stack**
```
Frontend:    Vite + React + TailwindCSS
Backend:     Node.js + Express
Database:    MongoDB Atlas (Cloud)
Cache:       Redis (for availability)
Storage:     AWS S3 (for recordings)
Video:       Zoom API
Payments:    Stripe
Email:       SendGrid
Hosting:     Railway/Heroku/AWS
```

### **Environment Variables**
```
# Database
MONGODB_URI=
REDIS_URL=

# Authentication
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Zoom
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Application
NODE_ENV=production
API_BASE_URL=
FRONTEND_URL=
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Core Booking (MVP)** ✅ Partially Complete
- [x] Specialist availability setup
- [x] Slot creation and management
- [x] Customer booking flow
- [x] Zoom meeting integration
- [ ] **TODO**: Enhance slot generation logic
- [ ] **TODO**: Add timezone support
- [ ] **TODO**: Create payment integration

### **Phase 2: Analytics & Insights**
- [ ] Earnings dashboard
- [ ] Booking analytics
- [ ] Session duration tracking
- [ ] Customer satisfaction metrics

### **Phase 3: Advanced Features**
- [ ] Recurring booking series (packages)
- [ ] Group sessions support
- [ ] Customer timezones
- [ ] Payment history & invoicing

### **Phase 4: Platform Growth**
- [ ] Specialist reviews & ratings
- [ ] Promo codes & discounts
- [ ] Marketplace discovery
- [ ] Admin dashboard

---

## 🔧 Testing Strategy

### **Unit Tests**
```javascript
✅ Slot generation algorithm
✅ Payment processing logic
✅ Timezone conversions
✅ Availability scanning
```

### **Integration Tests**
```javascript
✅ Complete booking flow
✅ Payment → Booking creation
✅ Zoom API integration
✅ Email notifications
```

### **e2e Tests**
```javascript
✅ Specialist setup → Availability publication
✅ Customer browse → Book → Pay → Join meeting
✅ Post-meeting recording delivery
```

---

## 📋 Checklist for Production Readiness

### **Code Quality**
- [ ] All functions documented with JSDoc
- [ ] Error handling on all API endpoints
- [ ] Input validation on all forms
- [ ] No console.logs in production code
- [ ] Tests with 80%+ coverage

### **Security**
- [ ] All secrets in .env files
- [ ] HTTPS/TLS enforced
- [ ] Rate limiting implemented
- [ ] Admin audit logs
- [ ] Regular security audits

### **Performance**
- [ ] Database indexes optimized
- [ ] API response time < 200ms
- [ ] Frontend bundle size optimized
- [ ] Caching strategy implemented
- [ ] CDN for static assets

### **Monitoring**
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Payment transaction logs
- [ ] Email delivery logs

### **Documentation**
- [ ] API documentation (Postman/Swagger)
- [ ] Architecture diagrams
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Admin operations manual

---

## 💰 Revenue Model

```
Transaction:
┌─────────────────────────┐
│   Customer Pays: $100   │
├─────────────────────────┤
│ Platform Fee (20%): $20 │
│ Specialist Gets: $80    │
└─────────────────────────┘
```

---

## 📞 Support & Contact

For implementation questions or clarifications on this architecture:
- Review API documentation
- Check database schema diagrams
- Run integration tests
- Consult deployment checklist

---

**Next Steps:**
1. ✅ Review this architecture
2. → Start implementing core APIs
3. → Build frontend components
4. → Integrate payments
5. → Deploy to production
