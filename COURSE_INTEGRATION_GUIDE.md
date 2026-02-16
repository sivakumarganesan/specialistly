# 🔌 COURSE SYSTEM - INTEGRATION GUIDE

## How Courses Fit Into Specialistly Architecture

Your current platform has:
- ✅ User authentication (Specialist/Customer JWT)
- ✅ Specialist profiles with services
- ✅ Customer marketplace discovery
- ✅ Payments (Stripe)
- ✅ Messaging system

The **Course System** extends this by adding:
- 📚 Educational content delivery
- 🏆 Certification & credentialing
- 🎓 Learning progress tracking
- 💰 Additional revenue stream (paid courses)
- 👥 Cohort management for live learning

---

## Integration Points

### 1. User System
```javascript
// Your existing User model supports specialists and customers
// Course system extends this:

Specialist gains:
- courses: [ObjectId] // Array of created course IDs
- courseStats: { totalEnrollments, totalRevenue, avgRating }

Customer gains:
- enrolledCourses: [ObjectId] // Array of enrollment IDs
- certificates: [ObjectId] // Array of earned certificates
```

### 2. Authentication & Authorization
```javascript
// Use existing middleware, add these role checks:

// Specialist creating courses
router.post('/courses', 
  authenticate,                    // ✅ Already exists
  roleCheck('specialist'),          // ✅ Already have this
  courseController.createCourse
);

// Customer enrolling
router.post('/enrollments',
  authenticate,                    // ✅ Already exists
  roleCheck('customer'),            // ✅ Already have this
  enrollmentController.enrollCourse
);
```

### 3. Payment Integration
```javascript
// Extend existing Stripe integration

Existing payment flow (for services/appointments):
Customer → Stripe Checkout → Service Booking

New payment flow (for courses):
Customer → Stripe Checkout → Course Enrollment

// Reuse same Stripe setup:
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Both use same webhook:
- POST /webhooks/stripe-webhook
  - Handle: charge.succeeded, customer.subscription.*
  - Also trigger: enrollment creation, certificate issuance
```

### 4. Email System
```javascript
// Extend existing email service

Already sending:
- Authentication emails
- Appointment reminders
- Messaging notifications

Add course emails via same service:
- enrollment.sendWelcomeEmail()
- quiz.sendResultsEmail()
- assignment.sendGradingNotification()
- certificate.sendDownloadEmail()

// Same email template structure:
template: 'course-enrollment-welcome',
to: customer.email,
context: { courseName, enrollmentLink }
```

### 5. Database Connection
```javascript
// Same MongoDB Atlas connection

// Add these indexes to existing connection:
db.courses.createIndex({ specialistEmail: 1, status: 1 })
db.course_enrollments.createIndex({ customerId: 1, status: 1 })
db.cohorts.createIndex({ courseId: 1, startDate: 1 })
```

### 6. Frontend Navigation
```jsx
// Add course links to existing Sidebar

// Specialist sees:
{
  id: "courses",
  label: "Courses",
  icon: BookOpen,
  path: "/specialist/courses"
}

// Customer sees:
{
  id: "enrolled-courses",
  label: "My Courses",
  icon: BookOpen,
  path: "/my-courses"
}
```

---

## File Structure Integration

### Current Structure
```
backend/
  models/
    User.js           ✅ Existing
    Service.js        ✅ Existing
    Conversation.js   ✅ Existing (messaging)
  routes/
    authRoutes.js     ✅ Existing
    serviceRoutes.js  ✅ Existing
    messageRoutes.js  ✅ Existing

frontend/
  components/
    Dashboard.tsx     ✅ Existing
    Services/         ✅ Existing
    Messages.tsx      ✅ Existing
```

### After Adding Courses
```
backend/
  models/
    User.js           ✅ Existing
    Service.js        ✅ Existing
    Conversation.js   ✅ Existing (messaging)
    ✨ Course.js                    [NEW]
    ✨ CourseEnrollment.js          [NEW]
    ✨ Cohort.js                    [NEW]
    ✨ Quiz.js                      [NEW]
    ✨ Certificate.js               [NEW]
  routes/
    authRoutes.js     ✅ Existing
    serviceRoutes.js  ✅ Existing
    messageRoutes.js  ✅ Existing
    ✨ courseRoutes.js              [NEW]
    ✨ enrollmentRoutes.js          [NEW]
    ✨ cohortRoutes.js              [NEW]
    ✨ certificateRoutes.js         [NEW]
  middleware/
    auth.js           ✅ Existing (reuse)
  utils/
    ✨ progressCalculator.js        [NEW]
    ✨ certificateGenerator.js      [NEW]

frontend/
  components/
    Dashboard.tsx     ✅ Existing
    Services/         ✅ Existing
    Messages.tsx      ✅ Existing
    ✨ Courses/                     [NEW FOLDER]
      ├─ CoursesBrowse.tsx
      ├─ CourseDetail.tsx
      ├─ CourseBuilder.tsx
      ├─ LearningDashboard.tsx
      ├─ QuizInterface.tsx
      ├─ CohortDashboard.tsx
      └─ CertificateViewer.tsx
```

---

## Specialist Dashboard Integration

### Current Status
```jsx
// src/app/components/Dashboard.tsx
// Shows: appointments, services, messages

Current sidebar for specialists:
- Dashboard
- Services
- Page Builder
- Customers
- Messages
- Settings
```

### After Adding Courses
```jsx
// BEFORE
const specialistMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", label: "Services", icon: Settings },
  { id: "pagebuilder", label: "Page Builder", icon: Palette },
  { id: "customers", label: "Customers", icon: Users },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Gift },
];

// AFTER
const specialistMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", label: "Services", icon: Settings },
  ✨ { id: "courses", label: "Courses", icon: BookOpen },      [ADD THIS]
  { id: "pagebuilder", label: "Page Builder", icon: Palette },
  { id: "customers", label: "Customers", icon: Users },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Gift },
];

// Add route:
{currentPage === "courses" && <Courses />}
```

---

## Customer Dashboard Integration

### Current Status
```jsx
// Customer sees:
- Specialist marketplace
- Bookings/Appointments
- Messages
- Profile
```

### After Adding Courses
```jsx
// ADD TO NAVBAR/SIDEBAR
const customerMenu = [
  { id: "marketplace", label: "Browse Services", icon: Search },
  ✨ { id: "browse-courses", label: "Courses", icon: BookOpen },    [ADD THIS]
  { id: "bookings", label: "My Bookings", icon: Calendar },
  ✨ { id: "my-courses", label: "My Courses", icon: BookOpen },     [ADD THIS]
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "certificates", label: "Certificates", icon: Award },       [ADD THIS]
];

// Routes:
{currentPage === "browse-courses" && <CoursesBrowse />}
{currentPage === "my-courses" && <MyCourses />}
{currentPage === "certificates" && <MyCertificates />}
```

---

## API Folder Structure

### New Routes File
```javascript
// backend/routes/courseRoutes.js

const express = require('express');
const router = express.Router();
const {
  createCourse,
  updateCourse,
  publishCourse,
  getCourses,
} = require('../controllers/courseController');
const { authenticate, roleCheck } = require('../middleware/auth');

// SPECIALIST ROUTES
router.post('/courses', 
  authenticate, 
  roleCheck('specialist'), 
  createCourse
);

router.put('/courses/:courseId',
  authenticate,
  roleCheck('specialist'),
  updateCourse
);

router.post('/courses/:courseId/publish',
  authenticate,
  roleCheck('specialist'),
  publishCourse
);

router.get('/courses',
  authenticate,
  roleCheck('specialist'),
  getCourses
);

module.exports = router;
```

### Register in Main App
```javascript
// backend/app.js [or index.js]

// Existing routes
app.use('/api', authRoutes);
app.use('/api', serviceRoutes);
app.use('/api', messageRoutes);

// NEW ROUTES - Add here
app.use('/api', courseRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', cohortRoutes);
app.use('/api', certificateRoutes);
```

---

## Connected Features

### 1. Specialist Profile → Courses
```
When customer views specialist profile:
- Shows services (existing)
- Shows courses (NEW)
- Shows total rating (both combined)

API Endpoint:
GET /specialists/:specialistId
Response:
{
  name, email, bio,
  services: [...],
  ✨ courses: [...]      // Show only published courses
}
```

### 2. Customer Marketplace → Course Discovery
```
When customer browses marketplace:
- Can search services
- Can search courses (NEW)
- Can filter by price, difficulty, rating

Enhanced search:
GET /search?query=javascript&type=course|service
```

### 3. Payments Unified Dashboard
```
Specialist revenue from:
- Services/Appointments (existing)
- Courses (NEW)

Dashboard shows:
- Total revenue: $X
  - From appointments: $Y (70%)
  - From courses: $Z (30%)

API: GET /analytics/revenue
```

---

## Notification System Integration

### Existing Notifications
- 🔔 New appointment booking
- 💬 New message
- ✅ Appointment completed

### New Notifications (Courses)
- 🎓 Course enrollment
- 📝 Assignment graded
- 🏆 **Certificate earned**
- 🎤 Live session tomorrow
- 📹 Cohort recording available

### Implementation
```javascript
// Reuse existing notification service

// New notification types:
enum NotificationType {
  COURSE_ENROLLMENT = "course_enrollment",
  ASSIGNMENT_GRADED = "assignment_graded",
  CERTIFICATE_EARNED = "certificate_earned",
  SESSION_REMINDER = "session_reminder",
}

// Same notification structure:
{
  userId: String,
  type: NotificationType,
  title: String,
  message: String,
  link: String, // /my-courses/:enrollmentId
  read: Boolean,
  createdAt: Date,
}
```

---

## Revenue Model Integration

### Current Specialistly Revenue
```
Service booking:
- Customer pays $50 for 1-hour consultation
- Specialistly takes 20% = $10
- Specialist gets 80% = $40

Specialist can also sell courses:
- Paid course price: $99
- Specialistly takes 30% = $29.70
- Specialist gets 70% = $69.30

Customer benefits:
- Multiple revenue streams for specialists
- Better selection for customers
```

### Pricing Strategy
```javascript
// Self-Paced Courses: Usually $29-$199
// Cohort-Based Courses: Usually $299-$999

Example specialist profile after courses:
Name: Jane Smith
Services: $50/hour consultation (40 bookings/month) = $80K/year
Courses: $99 course (50 students/month) × $69.30 = $41.5K/year
TOTAL: ~$121K/year
```

---

## Analytics Integration

### Enhanced Specialist Dashboard
```jsx
// Current:
Metrics: Appointments, Revenue, Ratings

// New:
<AnalyticsTabs>
  <Tab label="All">               {/* Combined metrics */}
  <Tab label="Services">          {/* Appointments only */}
  <Tab label="Courses">           {/* Courses only */}
</AnalyticsTabs>

<MetricsGrid>
  <Card title="Total Revenue" value="$121,543" />
  <Card title="Total Students" value="324" />      {/* Appointments + Enrollments */}
  <Card title="Avg Rating" value="4.8/5" />
  <Card title="Completion Rate" value="82%" />     {/* NEW */}
</MetricsGrid>
```

---

## Security & Compliance

### User Permissions
```javascript
// Specialist can ONLY:
- Create courses
- Edit own courses
- View own course analytics
- Grade own assignments

// Customer can ONLY:
- Enroll in published courses
- View enrolled course content
- Submit assignments/quizzes
- Download own certificates

// Admin can:
- Approve/reject courses (if needed)
- View all analytics
- Issue refunds
- Manage disputes
```

### Data Privacy
```javascript
// Customer data in courses:
- Quiz attempts (encrypted)
- Assignment submissions (encrypted)
- Certificate records (public verification, not personal data)
- Progress tracking (ephemeral, 90-day retention default)

// Compliance:
- GDPR: Delete customer data on request
- CCPA: Export course data on request
- SOC 2: Audit certificate issuance
```

---

## Testing Strategy

### Phase 1: Unit Tests (Routes/Controllers)
```javascript
// backend/tests/courseController.test.js

describe('Course Controller', () => {
  test('should create course with valid data', async () => {
    // ...
  });
  
  test('should reject unpublished course enrollment', async () => {
    // ...
  });
  
  test('should calculate progress correctly', async () => {
    // ...
  });
});
```

### Phase 2: Integration Tests (API Endpoints)
```javascript
// backend/tests/courseAPI.test.js

describe('Course API', () => {
  test('should complete self-paced course workflow', async () => {
    // Create course → Publish → Enroll → Complete lessons → Issue cert
  });
  
  test('should complete cohort workflow', async () => {
    // Create cohort → Enroll → Attend sessions → Complete course
  });
});
```

### Phase 3: E2E Tests (User Journeys)
```javascript
// frontend/tests/courseJourney.test.tsx

describe('Customer Course Journey', () => {
  test('should browse, enroll, and complete course', async () => {
    // 1. Navigate to courses
    // 2. Search and filter
    // 3. View course detail
    // 4. Enroll (free or paid)
    // 5. Access course
    // 6. Complete lessons
    // 7. Submit quiz
    // 8. Download certificate
  });
});
```

---

## Deployment Checklist

Before deploying courses to production:

### Database
- [ ] All indexes created
- [ ] Backup current data
- [ ] Test migrations on staging
- [ ] Monitor Atlas performance after deployment

### Backend
- [ ] All route handlers tested
- [ ] Error handling for all endpoints
- [ ] Rate limiting configured
- [ ] Stripe webhooks registered
- [ ] S3 bucket for certificates configured
- [ ] Email service templates created

### Frontend
- [ ] All components responsive (mobile + tablet)
- [ ] Image optimization (thumbnails, certificates)
- [ ] Video player tested (YouTube, uploads)
- [ ] PDF generator tested
- [ ] Loading states for long operations
- [ ] Error messages user-friendly

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (DataDog)
- [ ] Certificate generation alerts
- [ ] Email delivery tracking
- [ ] Payment webhook monitoring

---

## Launch Plan

### Week 1: MVP - Self-Paced Only
- [ ] Specialist creates and publishes courses
- [ ] Customer enrolls and accesses content
- [ ] Quiz system works
- [ ] Automatic certificate issuance

### Week 2: Enhanced Self-Paced
- [ ] Assignments & grading
- [ ] Reviews & ratings
- [ ] Analytics dashboard
- [ ] Progress tracking improvements

### Week 3: Cohort System
- [ ] Create cohorts & schedule sessions
- [ ] Enroll customers
- [ ] Attendance tracking
- [ ] Cohort completion & certificates

### Week 4: Polish & Optimization
- [ ] Mobile responsiveness
- [ ] Performance tuning
- [ ] User feedback incorporation
- [ ] Production stability

---

## Success Metrics

Track these KPIs to measure course system success:

```
Month 1:
- 10 courses published
- 50 student enrollments
- $2,000 course revenue

Month 3:
- 40 courses published
- 500 student enrollments
- $30,000 course revenue
- 75% average completion rate

Month 6:
- 150 courses
- 2,000 enrollments
- $200,000 revenue
- 70%+ completion rate
- 4.5+ average rating
```

---

**Ready to implement? Start with Phase 1 (Self-Paced) to minimize risk while validating the market!**
