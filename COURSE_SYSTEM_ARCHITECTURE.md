# 🎓 SPECIALISTLY COURSE WORKFLOW SYSTEM
## Complete Architecture & Implementation Guide

---

## 📋 TABLE OF CONTENTS
1. [Database Schema Design](#database-schema-design)
2. [API Endpoints](#api-endpoints)
3. [Self-Paced Course Workflow](#self-paced-course-workflow)
4. [Cohort-Based Course Workflow](#cohort-based-course-workflow)
5. [Certification System](#certification-system)
6. [Frontend Architecture](#frontend-architecture)
7. [Validation Rules](#validation-rules)
8. [Implementation Roadmap](#implementation-roadmap)

---

## 🗄️ DATABASE SCHEMA DESIGN

### 1. COURSE COLLECTION
```javascript
{
  _id: ObjectId,
  
  // Basic Info
  specialistId: String, // Reference to User
  specialistEmail: String,
  
  title: String, // Required
  description: String, // Rich text
  category: String, // [Business, Technology, Health, Arts, etc.]
  tags: [String],
  
  // Pricing
  price: {
    amount: Number, // 0 for free
    currency: String, // "USD"
    refundable: Boolean,
    refundWindow: Number, // Days (default 30)
  },
  
  // Course Type
  courseType: Enum, // "self-paced" | "cohort-based"
  
  // Metadata
  thumbnail: String, // URL
  difficulty: Enum, // "beginner" | "intermediate" | "advanced"
  duration: Number, // Estimated hours
  language: String, // "en", "es", etc.
  
  // Certification
  certification: {
    enabled: Boolean,
    title: String, // "Certificate of Completion"
    templateId: String, // Reference to certificate template
    completionCriteria: {
      lessonsCompleted: Number, // % (default 80)
      quizPassPercentage: Number, // % (default 70)
      assignmentRequired: Boolean,
    },
  },
  
  // Structure
  modules: [
    {
      _id: ObjectId,
      title: String,
      description: String,
      order: Number, // For drag-drop reordering
      lessons: [
        {
          _id: ObjectId,
          title: String,
          description: String,
          order: Number,
          type: Enum, // "video" | "document" | "quiz" | "assignment"
          content: {
            videoUrl: String, // External or uploaded
            videoType: String, // "youtube" | "upload" | "external"
            videoDuration: Number, // Seconds
            documents: [
              {
                name: String,
                url: String,
                type: String, // "pdf" | "doc" | "link"
              }
            ],
            quizzes: [ObjectId], // Reference to Quiz collection
            assignments: [ObjectId], // Reference to Assignment collection
          },
          estimatedDuration: Number, // Minutes
        }
      ],
    }
  ],
  
  // Status & Publishing
  status: Enum, // "draft" | "published" | "archived"
  publishedAt: Date,
  
  // Self-Paced Specific
  selfPaced: {
    lifetime: Boolean, // Lifetime access vs. expiry
    accessExpiry: Number, // Days (null = lifetime)
  },
  
  // Cohort-Based Specific
  cohortBased: {
    cohorts: [ObjectId], // Reference to Cohort collection
  },
  
  // Analytics
  stats: {
    totalEnrollments: Number,
    totalRevenue: Number,
    averageRating: Number,
    completionRate: Number, // %
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}
```

### 2. QUIZ COLLECTION
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  
  title: String,
  description: String,
  passingPercentage: Number, // Default 70
  maxAttempts: Number, // Default unlimited
  timeLimit: Number, // Minutes (null = no limit)
  shuffleQuestions: Boolean,
  showCorrectAnswers: Boolean,
  
  questions: [
    {
      _id: ObjectId,
      type: Enum, // "mcq" | "true-false" | "short-answer"
      question: String,
      options: [String], // For MCQ
      correctAnswer: String | Number, // Index for MCQ, string for short-answer
      explanation: String,
      points: Number,
    }
  ],
  
  totalPoints: Number,
  createdAt: Date,
  updatedAt: Date,
}
```

### 3. ASSIGNMENT COLLECTION
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  
  title: String,
  description: String,
  dueDate: Date,
  maxScore: Number,
  rubric: String, // Grading criteria
  
  attachments: [
    {
      name: String,
      url: String,
    }
  ],
  
  createdAt: Date,
  updatedAt: Date,
}
```

### 4. COURSE_ENROLLMENT COLLECTION (Self-Paced)
```javascript
{
  _id: ObjectId,
  
  courseId: ObjectId,
  customerId: String,
  customerEmail: String,
  
  // Status
  status: Enum, // "active" | "completed" | "dropped"
  
  // Progress Tracking
  progress: {
    completedLessons: [ObjectId], // Lesson IDs
    lastAccessedLesson: ObjectId,
    lastAccessedTime: Date,
    percentComplete: Number, // 0-100
    estimatedCompletion: Date,
  },
  
  // Quiz Attempts
  quizAttempts: [
    {
      quizId: ObjectId,
      attempt: Number,
      score: Number,
      maxScore: Number,
      percentage: Number,
      passed: Boolean,
      answers: [String],
      attemptedAt: Date,
    }
  ],
  
  // Assignments
  assignments: [
    {
      assignmentId: ObjectId,
      submittedFile: String, // URL
      score: Number,
      graderNotes: String,
      submittedAt: Date,
      gradedAt: Date,
      status: Enum, // "pending" | "graded"
    }
  ],
  
  // Certification
  certificate: {
    earned: Boolean,
    certificateId: String, // Unique cert ID
    issueDate: Date,
    downloadUrl: String,
    verificationUrl: String,
  },
  
  // Payment & Refund
  payment: {
    amount: Number,
    currency: String,
    transactionId: String,
    paidAt: Date,
    refunded: Boolean,
    refundedAt: Date,
    refundReason: String,
  },
  
  // Engagement
  totalTimeSpent: Number, // Minutes
  completedAt: Date,
  
  createdAt: Date,
  updatedAt: Date,
}
```

### 5. COHORT COLLECTION
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  specialistId: String,
  
  // Batch Info
  batchName: String, // e.g., "Batch 2024 - March"
  description: String,
  status: Enum, // "draft" | "open" | "ongoing" | "completed" | "cancelled"
  
  // Schedule
  startDate: Date,
  endDate: Date,
  
  // Enrollment
  maxStudents: Number,
  enrollmentDeadline: Date,
  enrolledCount: Number,
  
  // Sessions
  sessions: [
    {
      _id: ObjectId,
      sessionNumber: Number,
      title: String,
      description: String,
      scheduledDate: Date,
      startTime: Time,
      endTime: Time,
      duration: Number, // Minutes
      
      // Live Session
      liveSessionLink: String, // Zoom/Meet URL
      platform: String, // "zoom" | "google-meet" | "custom"
      recordingUrl: String, // After session
      
      // Attendance
      attendance: [
        {
          studentId: String,
          joined: Boolean,
          joinedAt: Date,
          leftAt: Date,
          durationMinutes: Number,
        }
      ],
      
      createdAt: Date,
    }
  ],
  
  // Materials
  materials: [
    {
      sessionNumber: Number,
      documents: [String], // URLs
      assignments: [ObjectId],
      recordingUrl: String,
    }
  ],
  
  // Completion Criteria
  completionCriteria: {
    minSessionAttendance: Number, // % (e.g., 80 for 80%)
    assignmentSubmission: Boolean,
    finalQuizPassRequired: Boolean,
  },
  
  createdAt: Date,
  updatedAt: Date,
}
```

### 6. COHORT_ENROLLMENT COLLECTION (Cohort-Based)
```javascript
{
  _id: ObjectId,
  
  cohortId: ObjectId,
  courseId: ObjectId,
  customerId: String,
  customerEmail: String,
  
  // Status
  status: Enum, // "enrolled" | "active" | "completed" | "dropped"
  
  // Attendance
  attendedSessions: [
    {
      sessionId: ObjectId,
      attended: Boolean,
      durationMinutes: Number,
    }
  ],
  attendancePercentage: Number,
  
  // Assignments
  assignments: [
    {
      assignmentId: ObjectId,
      submittedFile: String,
      score: Number,
      status: Enum, // "pending" | "graded"
      gradedAt: Date,
    }
  ],
  
  // Certification
  certificate: {
    earned: Boolean,
    certificateId: String,
    issueDate: Date,
    downloadUrl: String,
  },
  
  // Payment
  payment: {
    amount: Number,
    transactionId: String,
    paidAt: Date,
    refunded: Boolean,
    refundedAt: Date,
  },
  
  // Engagement
  totalTimeSpent: Number, // Minutes
  completedAt: Date,
  
  createdAt: Date,
  updatedAt: Date,
}
```

### 7. CERTIFICATE COLLECTION
```javascript
{
  _id: ObjectId,
  
  courseId: ObjectId,
  enrollmentId: ObjectId, // Either course enrollment or cohort enrollment
  
  certificateId: String, // Unique: CERT-YYYY-XXXXX
  recipientName: String,
  recipientEmail: String,
  
  courseTitle: String,
  specialistName: String,
  issueDate: Date,
  
  // Certificate PDF
  fileName: String,
  downloadUrl: String,
  verificationUrl: String, // Public URL to verify certificate
  
  // Verification
  isValid: Boolean,
  expiryDate: Date, // null = lifetime
  
  // Custom Data
  completionDate: Date,
  completionPercentage: Number,
  
  createdAt: Date,
}
```

### 8. COURSE_RATING COLLECTION
```javascript
{
  _id: ObjectId,
  
  courseId: ObjectId,
  customerId: String,
  enrollmentId: ObjectId,
  
  rating: Number, // 1-5
  review: String,
  
  // Dimensions (optional)
  contentQuality: Number,
  instructorClearity: Number,
  paceAndStructure: Number,
  
  createdAt: Date,
  updatedAt: Date,
}
```

### 9. COURSE_ANALYTICS COLLECTION
```javascript
{
  _id: ObjectId,
  
  courseId: ObjectId,
  specialistId: String,
  
  // Daily Stats
  date: Date,
  newEnrollments: Number,
  revenue: Number,
  
  // Accumulated
  totalEnrollments: Number,
  totalRevenue: Number,
  completionRate: Number,
  averageRating: Number,
  
  // Cohort-specific
  cohortStats: [
    {
      cohortId: ObjectId,
      totalEnrolled: Number,
      completionRate: Number,
      averageAttendance: Number,
    }
  ],
  
  createdAt: Date,
}
```

---

## 🔌 API ENDPOINTS

### SPECIALIST - COURSE MANAGEMENT

#### Create Course
```
POST /api/courses
Body: {
  title, description, category, price, difficulty, duration, tags, courseType
}
Response: { courseId, status: "draft" }
```

#### Update Course
```
PUT /api/courses/:courseId
Body: { courseData }
```

#### Publish Course
```
POST /api/courses/:courseId/publish
Validation:
  - At least 1 module with 2+ lessons
  - Price validated
  - Certification settings (if enabled)
```

#### Archive Course
```
POST /api/courses/:courseId/archive
```

#### Get Course Details (Draft/Edit)
```
GET /api/courses/:courseId/edit
Auth: Specialist only (owner)
```

#### Get Specialist's Courses
```
GET /api/courses?specialistEmail=email
Params: status=draft|published|archived
```

---

### SPECIALIST - MODULE & LESSON MANAGEMENT

#### Create Module
```
POST /api/courses/:courseId/modules
Body: { title, description, order }
```

#### Reorder Modules (Drag & Drop)
```
PUT /api/courses/:courseId/modules/reorder
Body: { moduleIds: [id1, id2, id3...] }
```

#### Create Lesson
```
POST /api/courses/:courseId/modules/:moduleId/lessons
Body: {
  title, description, type, content { video, documents },
  estimatedDuration, order
}
```

#### Reorder Lessons
```
PUT /api/courses/:courseId/modules/:moduleId/lessons/reorder
Body: { lessonIds: [id1, id2, id3...] }
```

#### Delete Lesson
```
DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
```

---

### SPECIALIST - QUIZ & ASSIGNMENT

#### Create Quiz
```
POST /api/courses/:courseId/lessons/:lessonId/quizzes
Body: {
  title, passingPercentage, questions: [{ type, question, options, correctAnswer, points}]
}
```

#### Create Assignment
```
POST /api/courses/:courseId/lessons/:lessonId/assignments
Body: {
  title, description, dueDate, maxScore, rubric, attachments
}
```

#### Grade Assignment
```
PUT /api/enrollments/:enrollmentId/assignments/:assignmentId/grade
Body: { score, notes }
```

---

### SPECIALIST - COHORT MANAGEMENT

#### Create Cohort
```
POST /api/courses/:courseId/cohorts
Body: {
  batchName, startDate, endDate, maxStudents,
  enrollmentDeadline,
  sessions: [{ title, scheduledDate, startTime, endTime, platform, link }]
}
```

#### Update Cohort
```
PUT /api/cohorts/:cohortId
```

#### Create Session
```
POST /api/cohorts/:cohortId/sessions
Body: { sessionNumber, title, scheduledDate, startTime, endTime, liveSessionLink }
```

#### Record Attendance
```
POST /api/cohorts/:cohortId/sessions/:sessionId/attendance
Body: { studentId, joined: true/false, joinedAt, leftAt }
```

#### Upload Session Recording
```
POST /api/cohorts/:cohortId/sessions/:sessionId/recording
Body: { recordingUrl }
```

#### Get Cohort Enrollments
```
GET /api/cohorts/:cohortId/enrollments
Response: [{ studentId, name, email, status, attendancePercentage }]
```

---

### SPECIALIST - CERTIFICATION

#### Create Certificate Template
```
POST /api/certificates/templates
Body: {
  title, design, customFields,
  headerImage, footerImage, signatureField
}
```

#### Auto-Issue Certificates (Trigger)
```
POST /api/courses/:courseId/issue-certificates
Condition: Check course completion criteria
```

#### Verify Certificate
```
GET /api/certificates/:certificateId/verify
Public endpoint - any visitor can verify
```

---

### SPECIALIST - ANALYTICS

#### Get Course Analytics
```
GET /api/courses/:courseId/analytics
Response: {
  totalEnrollments, revenue, completionRate,
  avgRating, enrollmentTrend, completionTrend,
  cohortStats (if applicable)
}
```

#### Get Student Progress (Cohort)
```
GET /api/cohorts/:cohortId/progress
Response: [{ studentId, attendance%, completionStatus, assignments }]
```

---

### CUSTOMER - COURSE DISCOVERY

#### Browse All Courses
```
GET /api/courses/browse
Filters: category, difficulty, price, rating, courseType
Search: ?query=string
Pagination: ?page=1&limit=20
```

#### Get Course Details (Public)
```
GET /api/courses/:courseId
Response: { title, description, modules_overview, reviews, ratings }
```

#### Search Courses
```
GET /api/courses/search?q=title
```

---

### CUSTOMER - ENROLLMENT (SELF-PACED)

#### Enroll in Course
```
POST /api/enrollments
Body: { courseId, paymentMethodId (if paid) }
Auth: Customer only
```

#### Initiate Payment (Paid Course)
```
POST /api/enrollments/payment
Body: { courseId, paymentMethodId, amount }
Integration: Stripe/PayPal
```

#### Get Customer's Enrollments
```
GET /api/enrollments/my-courses
Response: [{ courseId, status, progressPercent, lastAccessed }]
```

#### Get Course Progress
```
GET /api/enrollments/:enrollmentId
Response: {
  courseTitle, progressPercent, completedLessons,
  lastAccessedLesson, estimatedCompletion,
  quizScores, assignmentStatus, certificate (if earned)
}
```

---

### CUSTOMER - COURSE LEARNING (SELF-PACED)

#### Mark Lesson as Complete
```
POST /api/enrollments/:enrollmentId/lessons/:lessonId/complete
Action: Track completion time, update progress%
```

#### Submit Quiz
```
POST /api/enrollments/:enrollmentId/quizzes/:quizId/submit
Body: { answers: [answerId1, answerId2...], attemptNumber }
Response: { score, passed, correctAnswers }
```

#### Submit Assignment
```
POST /api/enrollments/:enrollmentId/assignments/:assignmentId/submit
Body: { submittedFile }
```

#### Resume Course
```
GET /api/enrollments/:enrollmentId/resume
Returns: { lastAccessedLesson, nextLesson }
```

#### Rate Course
```
POST /api/courses/:courseId/ratings
Body: { rating, review, contentQuality, instructorClearity, paceAndStructure }
```

---

### CUSTOMER - COHORT ENROLLMENT

#### Get Available Cohorts
```
GET /api/courses/:courseId/cohorts
Response: [{ cohortId, batchName, startDate, enrollmentDeadline, enrolled%, status }]
```

#### Enroll in Cohort
```
POST /api/cohorts/:cohortId/enroll
Body: { paymentMethodId (if paid) }
Auth: Customer only
```

#### Get Cohort Calendar
```
GET /api/cohorts/:cohortId/sessions
Response: [{ sessionNumber, date, time, recordingUrl (if available) }]
```

#### Join Live Session
```
GET /api/cohorts/:cohortId/sessions/:sessionId/join
Returns: { liveSessionLink, recordingLink }
```

#### View Session Recording
```
GET /api/cohorts/:cohortId/sessions/:sessionId/recording
Returns: { recordingUrl, uploadedAt }
```

#### View Attendance
```
GET /api/enrollments/:cohortEnrollmentId/attendance
Response: [{ sessionDate, attended, durationMinutes }]
```

---

### CERTIFICATE BASE

#### Get Certificate (Download)
```
GET /api/certificates/:certificateId/download
Auth: Certificate owner or specialist
Returns: PDF file
```

#### Verify Certificate (Public)
```
GET /api/public/certificates/:certificateId/verify
Returns: { recipientName, courseName, issueDate, isValid }
```

#### Print/Share Certificate
```
GET /api/certificates/:certificateId/share
Returns: { shareUrl, embedCode }
```

---

## 📊 SELF-PACED COURSE WORKFLOW

### Enrollment Flow
```
1. Customer browses course → GET /courses/browse
2. Views course details
3. Clicks "Enroll" → POST /enrollments
4. If paid:
   - Enters payment info → POST /enrollments/payment
   - Stripe processes payment
   - Update enrollment.payment field
5. CourseEnrollment record created
6. Status = "active"
7. Instant access to course
```

### Learning & Progress Tracking
```
1. Customer accesses course → GET /enrollments/:id
2. Frontend shows last accessed lesson
3. Customer clicks lesson → Content loaded
4. Lesson player tracks:
   - Video watch time
   - Document views
   - Time on lesson
5. Customer marks lesson complete → POST /lessons/:id/complete
   - Add to completedLessons array
   - Calculate: progressPercent = (completedLessons / totalLessons) * 100
   - Check if course criteria met

Progress = {
  completedLessons: 12,
  totalLessons: 20,
  percentComplete: 60%
}
```

### Quiz System
```
ATTEMPT QUIZ:
1. Customer takes quiz → GET /quizzes/:quizId
2. Fills answers
3. Submits → POST /enrollments/:enrollmentId/quizzes/:quizId/submit
4. Backend:
   - Compare answers with correctAnswer
   - Calculate: score = (correct_count / total) * 100
   - Check: score >= passingPercentage
   - Create quizAttempt record
   - Return: { score, passed, correctAnswers }

RETAKE:
- If maxAttempts not reached
- Increment attempt number
- Allow retry if passed: false
```

### Assignment Submission & Grading
```
SUBMIT:
1. Customer uploads assignment → POST /assignments/:id/submit
2. Assignment status = "pending"
3. Specialist receives notification

GRADE:
1. Specialist reviews → opens grading interface
2. Grades & adds notes → PUT /assignments/:id/grade
3. Updates assignmentStatus = "graded"
4. Notifies customer
```

### Completion & Certification
```
TRIGGER CERTIFICATION:
After lesson completion:
  completionPercent = (completedLessons / totalLessons) * 100,
  
  Check criteria:
  ✓ completionPercent >= certification.completionCriteria.lessonsCompleted
  ✓ All quiz attempts: score >= passingPercentage
  ✓ Assignments: status = "graded" (if required)
  
  If all met:
    - Generate certificate → POST /courses/:id/issue-certificates
    - Create Certificate record with unique certificateId
    - Create PDF with template
    - Update enrollment.certificate = { earned: true, ... }
    - Send email with certificate download link

AUTO-COMPLETION:
- If course requires 80% lessons + 70% quiz + all assignments
- System auto-checks on each completion event
- Issues certificate immediately if eligible
```

### Progress Dashboard
```
Customer sees:
- Course title
- Progress bar (0-100%)
- Completed lessons: X/Y
- Completed quizzes: X/Y with scores
- Pending assignments: X
- Certificate status (Not Earned / Earned / Download)
- Time spent: HH:MM
- Estimated completion: Date
- Resume button → goes to lastAccessedLesson
```

---

## 🎯 COHORT-BASED COURSE WORKFLOW

### Setup by Specialist
```
1. Create cohort batch → POST /courses/:courseId/cohorts
   - Set startDate, endDate
   - Define enrollment deadline
   - Set max students

2. Create sessions → POST /cohorts/:cohortId/sessions
   For each session:
   - Schedule date/time
   - Set live session link (Zoom/Meet)
   - Duplicate: Assign assignments/materials

3. Publish cohort
```

### Enrollment Flow
```
1. Customer browses courses
2. Selects course, views available cohorts → GET /courses/:id/cohorts
3. Shows:
   - Batch name, start date, enrollment deadline
   - Current enrollment count
   - Status badge
4. Clicks "Enroll in Batch" → POST /cohorts/:cohortId/enroll
5. If paid:
   - Payment processed
6. CohortEnrollment created
7. Status = "enrolled"
8. Customer receives:
   - Calendar invite (iCal format)
   - Cohort details email
   - Access to cohort materials
```

### Session Attendance & Engagement
```
LIVE SESSION:
1. Specialist schedules session
2. Sends join link → GET /cohorts/:cohortId/sessions/:sessionId/join
3. Customer clicks link, joins Zoom/Meet
4. Platform tracks:
   - joinedAt timestamp
   - leftAt timestamp
   - calculated durationMinutes

ATTENDANCE TRACKING:
1. Specialist marks attendance manually (via dashboard)
   OR
2. Automatic sync from Zoom API:
   - Pull participant list
   - Match with enrolled students
   - Calculate duration
   
POST /cohorts/:cohortId/sessions/:sessionId/attendance
Body: [{ studentId, joined, joinedAt, leftAt }]

Then calculate:
attendancePercentage = (attendedSessions / totalSessions) * 100
```

### Session Recording & Asynchronous Access
```
1. After live session ends
2. Specialist uploads recording → POST /sessions/:sessionId/recording
3. Update: sessions[i].recordingUrl = "https://..."
4. Notify students: "Recording available"
5. Students can rewatch: GET /sessions/:sessionId/recording

ASYNCHRONOUS OPTIONS:
- Students who missed can watch recording
- Marks as "attended_async" (different from live)
- May affect attendance% (configurable)
```

### Assignment & Grading
```
SPECIALIST ASSIGNS:
1. Creates assignment → POST /modules/:moduleId/assignments
2. Attaches to session/module
3. Sets dueDate, rubric, maxScore
4. Students notified via email

STUDENT SUBMITS:
1. POST /enrollments/:cohortEnrollmentId/assignments/:assignmentId/submit
2. Uploads file
3. Status = "pending"

SPECIALIST GRADES:
1. Reviews submissions dashboard
2. Opens assignment → views student file
3. Grades & adds feedback
4. PUT /assignments/:assignmentId/grade
5. Body: { score, notes, status: "graded" }
6. Student notified with grade & feedback
```

### Completion & Certification
```
TRIGGER COMPLETION CHECK:
After cohort end date:

Check criteria in completionCriteria:
✓ attendance% >= minSessionAttendance (e.g., 80%)
✓ Assignments: all graded (if required)
✓ Final quiz: passed (if required)

If all met:
  - Mark enrollment.status = "completed"
  - Issue certificate
  - Send completion email with cert

CERTIFICATE:
- Create Certificate record
- Include cohort name & dates
- Generate PDF
- Provide download & verification URL
```

### Cohort Management Dashboard (Specialist)
```
For each cohort, specialist sees:
- Total enrolled students
- Upcoming sessions (calendar view)
- Attendance statistics:
  * By session
  * Per student
- Assignment submission status
- Grade distribution
- Course completion status
- Revenue (if paid cohort)
- Option to:
  * Record session
  * Upload materials
  * Grade assignments
  * Send announcements
  * Extend cohort (if needed)
```

---

## 🏆 CERTIFICATION SYSTEM

### Certificate Data Structure
```
Certificate {
  certificateId: "CERT-2024-ABC123" (Unique, Tamper-proof)
  recipientName: "John Doe"
  recipientEmail: "john@example.com"
  courseTitle: "Advanced JavaScript"
  specialistName: "Jane Smith"
  issueDate: 2024-02-15
  
  enrollmentId: Reference // Links to enrollment
  courseType: "self-paced" | "cohort-based"
  
  // For self-paced
  completionPercentage: 100%
  
  // For cohort
  cohortName: "Batch 2024-03"
  attendancePercentage: 85%
  
  downloadUrl: "https://specialistly.com/certs/ABC123/download"
  verificationUrl: "https://specialistly.com/verify/CERT-2024-ABC123"
  
  expiryDate: null (lifetime)
  isValid: true
}
```

### Certificate Generation
```
1. TRIGGER EVENT:
   - After self-paced completion
   - After cohort end date with completion

2. VALIDATION CHECK:
   - Verify completion criteria met
   - Check for plagiarism/fraud
   - Validate enrollment status

3. GENERATION:
   - Create Certificate MongoDB record
   - Generate unique certificateId = "CERT-YYYY-" + randomString(6)
   - Use template (specialist can customize):
     * College-style (formal)
     * Modern (clean design)
     * Minimal (text-only)
   
4. PDF GENERATION:
   - Use library (e.g., pdfkit, puppeteer)
   - Embed:
     * Specialist logo/watermark
     * Course name
     * Recipient name
     * Issue date
     * Certificate ID
     * Verification QR code
     * Specialist signature (digital)
   - Save to S3/Cloud storage

5. EMAIL DELIVERY:
   Subject: "Certificate of Completion - [Course Name]"
   Body:
     Congratulations! You completed [Course].
     [Download Certificate]
     [Verify Certificate]
     [Share on LinkedIn]

6. DATABASE UPDATE:
   enrollment.certificate = {
     earned: true,
     certificateId: "CERT-2024-ABC123",
     issueDate: now,
     downloadUrl: "...",
     verificationUrl: "..."
   }
```

### Verification System (Public)
```
VERIFICATION URL (Public - No Auth):
GET /public/certificates/CERT-2024-ABC123/verify

Response:
{
  valid: true,
  certificateId: "CERT-2024-ABC123",
  recipientName: "John Doe",
  courseTitle: "Advanced JavaScript",
  specialistName: "Jane Smith",
  issueDate: "2024-02-15",
  cohortName: "Batch 2024-03" (if applicable),
  
  // Anti-fraud fields
  issuedBy: "Specialistly Marketplace",
  verificationCode: "UNIQUE_HASH",
  hasNotBeenRevoked: true,
}

VERIFICATION PAGE SHOWS:
- Green checkmark "Verified"
- Certificate picture
- Issue date
- Specialist profile link
- "Share this verification" button
```

### Certificate Customization (Specialist)
```
SPECIALIST CAN:
1. Choose template design
2. Upload custom logo
3. Add specialized text:
   - "With Distinction" (for high scores)
   - Custom message
4. Add digital signature/stamp
5. Set expiration (if applicable)
6. Choose presentation format (PDF, eCard)

TEMPLATES PROVIDED:
- Professional (formal design)
- Modern (contemporary design)
- Minimal (text-focused)
- Custom (upload HTML template)
```

---

## 🎨 FRONTEND ARCHITECTURE

### Pages & Components

#### SPECIALIST SECTION

**1. Courses Dashboard**
```
Components:
- CourseCard (Thumbnail, Title, Status, Stats)
- CreateCourseButton
- FilterBar (Status, Category)
- SortOptions (Newest, Popular, Revenue)

Routes:
/specialist/courses (list)
/specialist/courses/create (new)
/specialist/courses/:id (view/edit)
```

**2. Course Builder (Complex Component)**
```
Layout: 3-column
- Left: Module + Lesson Tree (Drag-drop)
- Center: Lesson Editor
- Right: Preview Panel

Components:
- ModuleList (collapsible, drag-drop reorder)
  - LessonItem (drag-drop, click to edit)
- LessonEditor
  - ContentUploader (Video, PDF, Links)
  - MetadataForm (Title, Duration, Type)
- QuizBuilder
  - QuestionCard (MCQ, T/F, Short-answer)
  - AnswerInput
  - ScoringConfig
- AssignmentForm
  - DescriptionEditor
  - RubricBuilder
  - AttachmentUpload
- PreviewPane
  - Shows course structure
  - Live preview of lessons
  - Quiz preview
```

**3. Cohort Management**
```
Components:
- CohortList (Cards showing batch info)
- CreateCohortModal
  - Date picker (start, end, enrollment deadline)
  - SessionScheduler (Add sessions with times)
- SessionCalendar (Month/Week view)
- StudentRoster
  - Attendance table
  - Download list
  - Mark attendance UI
- GradingDashboard
  - Assignment submission list
  - Inline grade editor
  - Feedback form

Routes:
/specialist/cohorts
/specialist/cohorts/:id/sessions
/specialist/cohorts/:id/students
/specialist/cohorts/:id/grading
```

**4. Analytics Dashboard**
```
Components:
- StatsCard (Enrollments, Revenue, Completion%)
- RevenueTrendChart (Line chart)
- CompletionRateChart (Pie chart)
- StudentProgressList
  - Show each student's progress%
- CohortPerformance (Table)

Routes:
/specialist/analytics
/specialist/analytics/courses/:id
/specialist/analytics/cohorts/:id
```

---

#### CUSTOMER SECTION

**1. Course Discovery**
```
Components:
- HeroSection ("Browse Courses")
- SearchBar (for course search)
- FilterSidebar
  - Category checkbox
  - Difficulty slider
  - Price range
  - Rating filter
  - Course type (self-paced/cohort)
- CourseGrid
  - CourseCard (Thumbnail, Title, Specialist, Price, Rating)
  - Hover effect (Quick preview)
  - "Enroll" / "View" button

Routes:
/dashboard (customer) [Marketplace]
```

**2. Course Details Page**
```
Components:
- HeroSection (Course image, title, specialist)
- CourseInfo
  - Description (rich text)
  - Difficulty, Duration
  - Rating & reviews
- CurriculumPreview
  - Show all modules/lessons (collapsed)
  - Can expand to see lesson titles
  - (Full content only after enrollment)
- EnrollmentCard (sticky)
  - Price (or "Free")
  - "Enroll Now" button
  - "Join Cohort" (if cohort-based)
  - Stats: Enrollments, Completion%
  - Reviews section
  
Routes:
/courses/:id
```

**3. My Courses (Enrolled)**
```
Components:
- TabBar (In Progress, Completed, Archived)
- CourseCard (Progress bar, Last accessed, Resume button)
- EnrollmentStatus
  - For self-paced: Progress%, last accessed lesson
  - For cohort: Upcoming sessions, attendance%
  - Certificate status

Routes:
/my-courses
/my-courses/:enrollmentId/details
```

**4. Learning Dashboard (Inside Course)**
```
Layout: 2-column
- Left: Sidebar with lesson tree + progress
- Right: Lesson content player

Components:
- LessonSidebar
  - Module titles (collapsible)
  - Lesson titles (with checkmarks for completed)
  - Progress bar (course %)
  - Current lesson highlight
- LessonPlayer
  - Video player (custom for embedded/upload)
  - Lesson title & description
  - Documents/Resources section (downloadable)
  - "Mark as Complete" button
  - Quiz button (if lesson has quiz)
  - Assignment button (if has assignment)
  - Next/Previous lesson navigation
- ProgressTracker
  - X/Y lessons completed
  - Quiz scores
  - Assignment status
  - Time spent
  - Certificate status
  - Resume later button

Routes:
/my-courses/:enrollmentId/learn/:lessonId
```

**5. Quiz Interface**
```
Components:
- QuestionCard
  - Question text
  - Options (radio buttons for MCQ)
  - Timer (if time limit)
- QuestionNavigator (progression through quiz)
- ProgressBar (Attempted / Total)
- SubmitButton (Shows warning if unanswered)

After Submit:
- Results Page
  - Score: X/Y
  - Passed: Yes/No
  - Correct answers breakdown
  - Explanation for each answer
  - Retake button (if attempts remaining)

Routes:
/my-courses/:enrollmentId/quiz/:quizId
```

**6. Assignment Submission**
```
Components:
- AssignmentDetail
  - Title, description, due date
  - Rubric (if visible)
  - Attachment section
- SubmissionForm
  - File uploader (drag-drop or browse)
  - Text editor (optional for written answers)
- SubmissionHistory
  - Previous attempts (before feedback)
  - Latest grade & feedback (from specialist)

Routes:
/my-courses/:enrollmentId/assignment/:assignmentId
```

**7. Cohort Session Interface**
```
Components:
- UpcomingSessions
  - Card per session: Date, Time, Join button
  - Calendar view option
- SessionDetails
  - Scheduled time
  - Duration
  - Specialist name
  - "Join Session" button → Opens Zoom/Meet in new tab
  - Materials/Downloads
  - Recording link (if session done)
- AttendanceTracker
  - List of sessions
  - Checkmark for attended
  - Attendance percentage

Routes:
/my-courses/:cohortEnrollmentId/sessions
/my-courses/:cohortEnrollmentId/sessions/:sessionId/join
```

**8. Certificate Page**
```
Components:
- CertificateCard
  - Certificate preview (image)
  - Issue date
  - Certificate ID
  - Download button (PDF)
  - Share button (LinkedIn, Twitter, Email)
  - Verify button (links to public verification)
- CertificateHistory
  - All earned certificates
  - Filter by course/date

Routes:
/my-certificates
/my-certificates/:certificateId
/public/verify/:certificateId (public route)
```

---

## ✅ VALIDATION RULES

### SELF-PACED COURSE
```
Enrollment Validation:
- ✓ Customer not already enrolled
- ✓ Course status = "published"
- ✓ If paid: valid payment method
- ✓ No duplicate enrollments

Completion Validation:
- ✓ Course has at least 2 modules
- ✓ Each module has at least 2 lessons
- ✓ If quiz required: quiz configured
- ✓ Pass percentage between 0-100

Lesson Completion:
- ✓ Video watched to 80%+ (if has video)
- ✓ OR Document viewed > 1 minute

Certificate Issuance:
- ✓ All criteria met
- ✓ No ongoing refund request
- ✓ Issue only once per enrollment

Refund Validation (within window days):
- ✓ Paid course
- ✓ Within refundWindow days
- ✓ Customer initiates
- ✓ Specialist approves (optional)
```

### COHORT-BASED COURSE
```
Cohort Creation:
- ✓ startDate < endDate
- ✓ enrollmentDeadline < startDate
- ✓ maxStudents > 0
- ✓ At least 1 session scheduled

Session Scheduling:
- ✓ Session date between cohort start & end
- ✓ All required fields filled
- ✓ Platform link provided (Zoom/Meet)

Enrollment:
- ✓ Current date < enrollmentDeadline
- ✓ Enrolled count < maxStudents
- ✓ Customer not already enrolled
- ✓ Valid payment (if paid)

Attendance Recording:
- ✓ Session must be completed
- ✓ Only specialist can mark
- ✓ Duration minutes validated (0 < x < session duration)

Completion:
- ✓ Current date >= cohort endDate
- ✓ attendance% >= minSessionAttendance
- ✓ All assignments graded
- ✓ Quiz passed (if required)
```

### ACROSS BOTH TYPES
```
Course Publishing:
- ✓ Title not empty
- ✓ Description > 100 chars
- ✓ Price >= 0
- ✓ Category selected
- ✓ Thumbnail uploaded
- ✓ At least 1 module
- ✓ Module has lessons
- ✓ Status = "draft" before publish

Specialist Permissions:
- ✓ Only course creator (specialistId) can edit/delete
- ✓ Only course creator can certificate details
- ✓ Can't delete published course (archive only)

Customer Permissions:
- ✓ Can only access enrolled courses
- ✓ Can't skip lessons (sequential access)
- ✓ Can't view module until previous completed

Analytics:
- ✓ Only specialist sees own course analytics
- ✓ Only admin sees cross-course analytics

Certification:
- ✓ Certificate can't be revoked (unless course archived)
- ✓ Certificate ID must be unique
- ✓ Invalid cert after course deletion
```

---

## 🚀 IMPLEMENTATION ROADMAP

### PHASE 1: CORE SELF-PACED (Weeks 1-3)
**Foundation**
- [ ] Create Course model (MongoDB)
- [ ] Create CourseEnrollment model
- [ ] Create Module, Lesson schemas
- [ ] Course creation API (POST /courses)
- [ ] Module & lesson CRUD APIs
- [ ] Course publish endpoints
- [ ] Get courses list (specialist)

**Customer Side**
- [ ] Course discovery/browse API
- [ ] Course detail page (public)
- [ ] Enroll endpoint (POST /enrollments)
- [ ] Get my courses (GET /enrollments/my-courses)

**Learning**
- [ ] Lesson player (mock content)
- [ ] Mark lesson complete endpoint
- [ ] Progress tracking calculation
- [ ] My courses dashboard

---

### PHASE 2: QUIZ & ASSIGNMENTS (Weeks 4-5)
**Specialist**
- [ ] Create Quiz model
- [ ] Create Assignment model
- [ ] Quiz builder API
- [ ] Assignment CRUD

**Customer**
- [ ] Quiz interface
- [ ] Submit quiz endpoint
- [ ] Grade quiz (calculate score)
- [ ] Assignment submission endpoint
- [ ] View assignment grades

---

### PHASE 3: CERTIFICATION (Weeks 6-7)
**Setup**
- [ ] Create Certificate model
- [ ] Create certificate templates
- [ ] Certificate generation logic
- [ ] PDF generation (pdfkit/puppeteer)

**Completion**
- [ ] Auto-trigger certificate logic
- [ ] Email delivery system
- [ ] Download certificate endpoint
- [ ] Public verification endpoint
- [ ] Certificate landing page

---

### PHASE 4: COHORT-BASED (Weeks 8-10)
**Specialist**
- [ ] Create Cohort model
- [ ] Create CohortEnrollment model
- [ ] Create Session schema
- [ ] Cohort CRUD endpoints
- [ ] Session scheduling API
- [ ] Record attendance endpoint
- [ ] Upload recording endpoint

**Customer**
- [ ] View available cohorts
- [ ] Enroll in cohort (POST /cohorts/:id/enroll)
- [ ] View session calendar
- [ ] Join live session (get link)
- [ ] View recordings
- [ ] Cohort progress tracking

**Engagement**
- [ ] Assignment upload for cohort
- [ ] Grading dashboard
- [ ] Attendance percentage display
- [ ] Certificate completion logic

---

### PHASE 5: ANALYTICS & ADMIN (Weeks 11-12)
**Analytics**
- [ ] Create CourseAnalytics model
- [ ] Build analytics dashboard
- [ ] Revenue reports
- [ ] Completion rate charts
- [ ] Student progress tracking

**Admin**
- [ ] Refund workflow
- [ ] Course approval (if needed)
- [ ] Dispute resolution
- [ ] Platform-wide analytics

---

### PHASE 6: ENHANCED FEATURES (Optional)
- [ ] Real-time notifications (Socket.io)
- [ ] Course reviews & ratings system
- [ ] Wishlist functionality
- [ ] Course recommendations (ML)
- [ ] Bulk student import (CSV)
- [ ] Batch certificate generation
- [ ] Mobile app support
- [ ] API documentation (Swagger)

---

## 📱 DATABASE INDEXES

```javascript
// Courses
db.courses.createIndex({ specialistEmail: 1, status: 1 })
db.courses.createIndex({ status: 1, updatedAt: -1 })
db.courses.createIndex({ category: 1, status: 1 })

// Enrollments
db.course_enrollments.createIndex({ customerId: 1, courseId: 1 }, { unique: true })
db.course_enrollments.createIndex({ courseId: 1, status: 1 })
db.course_enrollments.createIndex({ customerId: 1, status: 1 })
db.course_enrollments.createIndex({ createdAt: -1 })

// Cohorts
db.cohorts.createIndex({ courseId: 1, status: 1 })
db.cohorts.createIndex({ startDate: 1, endDate: 1 })

// Cohort Enrollments
db.cohort_enrollments.createIndex({ cohortId: 1, customerId: 1 }, { unique: true })
db.cohort_enrollments.createIndex({ customerId: 1, status: 1 })

// Analytics
db.course_analytics.createIndex({ courseId: 1, date: -1 })
db.course_analytics.createIndex({ specialistId: 1, date: -1 })

// Certificates
db.certificates.createIndex({ certificateId: 1 }, { unique: true })
db.certificates.createIndex({ enrollmentId: 1 })
db.certificates.createIndex({ courseId: 1 })
```

---

## 🔐 Security Considerations

```
1. AUTHENTICATION & AUTHORIZATION
   - Verify ownership before allowing edits
   - JWT tokens with role-based access
   - Rate limiting on API endpoints

2. PAYMENT SECURITY
   - Never expose payment credentials
   - Use Stripe/PayPal webhooks
   - Validate transaction IDs

3. CONTENT PROTECTION
   - Prevent direct video file access
   - Use signed S3 URLs with expiry
   - Log download/access attempts

4. FRAUD PREVENTION
   - Validate quiz attempts (no rapid retakes)
   - Track quiz session IP
   - Monitor certificate requests
   - Alert on suspicious patterns

5. DATA PRIVACY
   - Hash certificate IDs
   - Encrypt student emails in URLs
   - GDPR compliance for deletions
   - SOC 2 readiness
```

---

## 📊 Sample Data Structures

### Example Course (Self-Paced)
```json
{
  "_id": ObjectId("..."),
  "specialistId": "specialist_001",
  "specialistEmail": "jane@specialistly.com",
  "title": "Advanced JavaScript Mastery",
  "description": "Learn advanced patterns and modern JavaScript...",
  "category": "Technology",
  "price": {
    "amount": 99,
    "currency": "USD",
    "refundable": true,
    "refundWindow": 30
  },
  "courseType": "self-paced",
  "difficulty": "intermediate",
  "duration": 40,
  "certification": {
    "enabled": true,
    "title": "Advanced JavaScript Certificate",
    "completionCriteria": {
      "lessonsCompleted": 80,
      "quizPassPercentage": 70,
      "assignmentRequired": true
    }
  },
  "modules": [
    {
      "_id": ObjectId("..."),
      "title": "Module 1: ES6+ Fundamentals",
      "order": 1,
      "lessons": [
        {
          "_id": ObjectId("..."),
          "title": "Arrow Functions & Destructuring",
          "type": "video",
          "content": {
            "videoUrl": "https://youtube.com/watch?v=...",
            "videoDuration": 1200
          },
          "estimatedDuration": 20,
          "order": 1
        }
      ]
    }
  ],
  "status": "published",
  "publishedAt": ISODate("2024-02-15T10:00:00Z"),
  "stats": {
    "totalEnrollments": 234,
    "completionRate": 68,
    "averageRating": 4.7
  },
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-02-15T10:00:00Z")
}
```

### Example Enrollment (Self-Paced)
```json
{
  "_id": ObjectId("..."),
  "courseId": ObjectId("..."),
  "customerId": "customer_001",
  "status": "active",
  "progress": {
    "completedLessons": [ObjectId("..."), ObjectId("...")],
    "lastAccessedLesson": ObjectId("..."),
    "lastAccessedTime": ISODate("2024-02-20T15:30:00Z"),
    "percentComplete": 65
  },
  "quizAttempts": [
    {
      "quizId": ObjectId("..."),
      "attempt": 1,
      "score": 85,
      "maxScore": 100,
      "percentage": 85,
      "passed": true,
      "attemptedAt": ISODate("2024-02-18T10:00:00Z")
    }
  ],
  "certificate": {
    "earned": false
  },
  "payment": {
    "amount": 99,
    "transactionId": "ch_1234567890",
    "paidAt": ISODate("2024-02-15T10:00:00Z")
  },
  "totalTimeSpent": 1240,
  "createdAt": ISODate("2024-02-15T10:00:00Z")
}
```

---

## 🎯 Success Metrics

```
Specialist KPIs:
- Course creation completion rate (% who publish)
- Module/lesson count per course (avg)
- Student enrollment velocity
- Revenue per course
- Course completion rate (% students)
- Certificate issuance rate
- Rating/review count

Customer KPIs:
- Course enrollment rate
- Course completion rate
- Quiz pass rate
- Time-to-completion
- Certificate earned
- Review submission rate
- Repeat enrollment

Business KPIs:
- Courses published (monthly)
- Course revenue (monthly)
- Specialist retention
- Customer LTV
- Certificate verification rate
- Marketplace GMV (Gross Merchandise Value)
```

---

## 📝 Next Steps

1. **Choose starting phase** (recommend Phase 1)
2. **Review & approve schema design**
3. **Plan database migrations** (if existing data)
4. **Design UI mockups** (Figma)
5. **Create test plans**
6. **Set up CI/CD** for course features

---

**This architecture is production-ready and follows SaaS best practices.**
**Ready to implement any phase. Let me know which to start with!**
