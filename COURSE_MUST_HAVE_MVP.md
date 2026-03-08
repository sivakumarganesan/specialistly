# 🎓 MUST-HAVE COURSE SYSTEM
## Self-Paced + Cohort (Minimal Viable)

---

## 📊 Database Schema (5 Collections)

### 1. COURSE
```javascript
{
  _id: ObjectId,
  specialistId: String,
  specialistEmail: String,
  
  title: String,
  description: String,
  thumbnail: String,
  
  courseType: "self-paced" | "cohort",
  price: Number, // 0 for free
  
  // For BOTH types
  lessons: [
    {
      _id: ObjectId,
      title: String,
      videoUrl: String, // YouTube or uploaded
      order: Number
    }
  ],
  
  status: "draft" | "published" | "archived",
  publishedAt: Date,
  createdAt: Date
}
```

### 2. SELF_PACED_ENROLLMENT
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  customerId: String,
  customerEmail: String,
  
  enrolledAt: Date,
  paidAt: Date, // if paid course
  amount: Number,
  
  completedLessons: [ObjectId], // Lesson IDs
  completed: Boolean, // true when all lessons done
  
  certificate: {
    issued: Boolean,
    certificateId: String, // CERT-2024-ABC123
    issuedDate: Date,
    downloadUrl: String
  },
  
  createdAt: Date
}
```

### 3. COHORT
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  specialistId: String,
  
  batchName: String, // "Python - Batch 1"
  startDate: Date,
  endDate: Date,
  
  maxStudents: Number,
  enrolledCount: Number,
  
  sessions: [
    {
      _id: ObjectId,
      sessionNumber: Number,
      title: String,
      date: Date,
      time: String, // "7:00 PM"
      zoomLink: String,
      completed: Boolean
    }
  ],
  
  status: "draft" | "published" | "ongoing" | "ended",
  createdAt: Date
}
```

### 4. COHORT_ENROLLMENT
```javascript
{
  _id: ObjectId,
  cohortId: ObjectId,
  customerId: String,
  customerEmail: String,
  
  enrolledAt: Date,
  paidAt: Date,
  amount: Number,
  
  attendedSessions: [ObjectId], // Session IDs attended
  completed: Boolean, // true after all sessions
  
  certificate: {
    issued: Boolean,
    certificateId: String,
    issuedDate: Date,
    downloadUrl: String
  },
  
  createdAt: Date
}
```

### 5. CERTIFICATE
```javascript
{
  _id: ObjectId,
  
  certificateId: String, // Unique: CERT-YYYY-RANDOM
  courseName: String,
  specialistName: String,
  customerName: String,
  issueDate: Date,
  
  courseType: "self-paced" | "cohort",
  enrollmentId: ObjectId, // Reference
  
  pdfUrl: String, // S3 or storage
  verifyUrl: String, // Public verification link
  
  createdAt: Date
}
```

---

## 🔌 API Endpoints (22 Total)

### SPECIALIST (9 endpoints)

```javascript
// Create course (self-paced or cohort)
POST /api/courses
Body: { 
  title, description, courseType: "self-paced" | "cohort",
  price: 0
}
Response: { courseId, status: "draft" }

// Update course
PUT /api/courses/:courseId
Body: { title, description, thumbnail, price }

// Add lesson to course
POST /api/courses/:courseId/lessons
Body: { title, videoUrl, order }
Response: { lessonId }

// Publish course
POST /api/courses/:courseId/publish
Response: { status: "published" }

// Archive course
POST /api/courses/:courseId/archive

// Get my courses
GET /api/courses
Response: [{ _id, title, type, status, enrollments }]

// CREATE COHORT (self-paced courses don't use this)
POST /api/cohorts
Body: { 
  courseId, batchName, startDate, endDate,
  sessions: [{ title, date, time, zoomLink }]
}
Response: { cohortId, status: "draft" }

// Publish cohort
POST /api/cohorts/:cohortId/publish

// Mark student attended session (optional - manual)
POST /api/cohorts/:cohortId/sessions/:sessionId/mark-attended
Body: { customerId }
```

### CUSTOMER (13 endpoints)

```javascript
// Browse all published courses
GET /api/courses/browse
Response: [{ _id, title, type, price, thumbnail, specialistName }]

// Get course details
GET /api/courses/:courseId/details
Response: {
  title, description, lessons, courseType, price,
  lessons: [{ _id, title, order }]
}

// SELF-PACED: Enroll in course
POST /api/enrollments/self-paced
Body: { courseId, paymentMethodId (if paid) }
Response: { enrollmentId, status: "active" }

// Get my self-paced courses
GET /api/enrollments/self-paced/my-courses
Response: [{ 
  enrollmentId, courseId, title, 
  lessonsTotal, lessonsCompleted, percentComplete,
  completed, certificate
}]

// Get self-paced enrollment details
GET /api/enrollments/self-paced/:enrollmentId
Response: {
  courseTitle, lessons: [{ _id, title, completed: bool }],
  percentComplete, certificate
}

// Mark lesson complete (self-paced)
POST /api/enrollments/self-paced/:enrollmentId/lessons/:lessonId/complete
Response: { percentComplete, allDone: true/false }

// Check if eligible for certificate (self-paced)
GET /api/enrollments/self-paced/:enrollmentId/check-certificate
Response: { eligible: true/false, allLessonsDone, certificateUrl }

// Download certificate
GET /api/certificates/:certificateId/download

// COHORT: Get available cohorts
GET /api/courses/:courseId/cohorts
Response: [{ 
  cohortId, batchName, startDate, enrolledCount,
  maxStudents, sessions: [{ date, time }]
}]

// COHORT: Enroll in cohort
POST /api/enrollments/cohort
Body: { cohortId, paymentMethodId (if paid) }
Response: { cohortEnrollmentId }

// Get my cohort courses
GET /api/enrollments/cohort/my-courses
Response: [{ 
  cohortEnrollmentId, cohortId, courseName,
  sessionsTotal, sessionsAttended, nextSession,
  completed, certificate
}]

// Get cohort sessions and join link
GET /api/enrollments/cohort/:cohortEnrollmentId/sessions
Response: [{ 
  sessionId, sessionNumber, date, time, 
  zoomLink, attended: bool
}]

// Get single session (join link)
GET /api/enrollments/cohort/:cohortEnrollmentId/sessions/:sessionId/join
Response: { zoomLink, title, date, time }

// Mark self attended (for self-marking)
POST /api/enrollments/cohort/:cohortEnrollmentId/sessions/:sessionId/mark-attended
Response: { attended: true, completionPercent }
```

---

## 🎨 Frontend Pages (8 Total)

### SPECIALIST (4 pages)

#### 1. Courses Dashboard
```
- List of courses (self-paced or cohort)
- Status: draft, published, archived
- Actions: edit, publish, delete
- Button: "+ Create Course"
```

#### 2. Create/Edit Course
```
Fields:
- Course title (required)
- Description
- Type: Self-paced | Cohort
- Price (optional, default 0)
- Thumbnail upload

If Self-Paced:
  - List of lessons
  - Add lesson button
  - Edit lesson (title, videoUrl)
  - Reorder lessons

If Cohort:
  - List of sessions
  - Add session (title, date, time, zoomLink)
  - Sessions table

Publish Button (validates: has lessons, title, description)
```

#### 3. Cohort Manager
```
- List cohorts
- Edit cohort (dates, max students)
- View enrollments
- Session list with dates
- Mark students attended (if needed)
```

#### 4. Analytics (Simple)
```
- Total revenue (if paid courses)
- Total enrollments
- Completion rate
- Upcoming sessions (for cohorts)
```

---

### CUSTOMER (4 pages)

#### 1. Browse Courses (Marketplace)
```
Grid view:
- Course thumbnail
- Title
- Specialist name
- Price (FREE or $XX)
- Type badge (Self-paced | Cohort)
- Enroll button
```

#### 2. Course Detail
```
- Hero: title, description, thumbnail
- Lessons list (collapsed, just shows count)
- Price
- Specialist info
- Enroll button (if not enrolled)
```

#### 3. Learning (Self-Paced)
```
Left sidebar:
- List of lessons
- Checkmark when complete
- Progress: X/Y lessons

Right content:
- Video player (embedded or YouTube)
- "Mark as complete" button
- Next/Previous buttons

After all done:
- "Certificate earned!" ✨
- Download button
- Share on LinkedIn button
```

#### 4. Cohort Sessions (Cohort-Based)
```
Calendar view or list:
- Session 1: Tue Feb 20, 7PM - [Join Zoom]
- Session 2: Thu Feb 22, 7PM - [Join Zoom]
- Session 3: Tue Feb 27, 7PM - [Join Zoom]
- Session 4: Thu Mar 1, 7PM - [Join Zoom]

Progress:
- Attended: 2/4 sessions
- Next: Thu Feb 22, 7PM [Join]

After all sessions:
- "Certificate earned!" ✨
- Download button
```

#### 5. My Courses
```
SELF-PACED SECTION:
- Course title
- Progress: 5/10 lessons (50%)
- [Continue Learning] button

COHORT SECTION:
- Batch name
- Progress: 2/4 sessions
- Next session date/time
- [Join Next Session] button
- [View All Sessions] link

COMPLETED SECTION:
- Course name
- Completion date
- [Download Certificate] button
```

---

## 💻 Minimal Code Examples

### Backend: Create Course
```javascript
// POST /api/courses
router.post('/courses', authenticate, roleCheck('specialist'), async (req, res) => {
  const { title, description, courseType, price } = req.body;
  
  if (!title || !courseType) {
    return res.status(400).json({ error: "Title and course type required" });
  }
  
  const course = new Course({
    specialistId: req.user.id,
    specialistEmail: req.user.email,
    title,
    description,
    courseType,
    price: price || 0,
    lessons: [],
    status: "draft"
  });
  
  await course.save();
  res.json({ courseId: course._id, status: "draft" });
});
```

### Backend: Mark Lesson Complete
```javascript
// POST /api/enrollments/self-paced/:enrollmentId/lessons/:lessonId/complete
router.post('/enrollments/self-paced/:enrollmentId/lessons/:lessonId/complete', 
  authenticate, async (req, res) => {
  
  const enrollment = await SelfPacedEnrollment.findById(req.params.enrollmentId);
  
  // Add lesson to completed
  if (!enrollment.completedLessons.includes(req.params.lessonId)) {
    enrollment.completedLessons.push(req.params.lessonId);
  }
  
  // Get total lessons
  const course = await Course.findById(enrollment.courseId);
  const totalLessons = course.lessons.length;
  const completedCount = enrollment.completedLessons.length;
  const percentComplete = (completedCount / totalLessons) * 100;
  
  // Check if all done
  if (completedCount === totalLessons) {
    enrollment.completed = true;
    
    // Generate certificate
    const cert = await generateCertificate({
      enrollmentId: enrollment._id,
      courseName: course.title,
      specialistName: (await User.findById(course.specialistId)).name,
      customerName: (await User.findById(enrollment.customerId)).name,
      courseType: "self-paced"
    });
    
    enrollment.certificate = {
      issued: true,
      certificateId: cert.certificateId,
      issuedDate: new Date(),
      downloadUrl: cert.pdfUrl
    };
    
    // Email certificate
    await sendCertificateEmail(enrollment.customerEmail, cert);
  }
  
  await enrollment.save();
  
  res.json({
    percentComplete: Math.round(percentComplete),
    completed: enrollment.completed,
    certificate: enrollment.certificate
  });
});
```

### Backend: Mark Cohort Attended
```javascript
// POST /api/enrollments/cohort/:cohortEnrollmentId/sessions/:sessionId/mark-attended
router.post('/enrollments/cohort/:cohortEnrollmentId/sessions/:sessionId/mark-attended',
  authenticate, async (req, res) => {
  
  const enrollment = await CohortEnrollment.findById(req.params.cohortEnrollmentId);
  const cohort = await Cohort.findById(enrollment.cohortId);
  
  // Add session to attended
  if (!enrollment.attendedSessions.includes(req.params.sessionId)) {
    enrollment.attendedSessions.push(req.params.sessionId);
  }
  
  const totalSessions = cohort.sessions.length;
  const attendedCount = enrollment.attendedSessions.length;
  
  // Check if all sessions done
  if (attendedCount === totalSessions) {
    enrollment.completed = true;
    
    // Generate certificate
    const cert = await generateCertificate({
      enrollmentId: enrollment._id,
      courseName: cohort.batchName,
      specialistName: (await User.findById(cohort.specialistId)).name,
      customerName: (await User.findById(enrollment.customerId)).name,
      courseType: "cohort"
    });
    
    enrollment.certificate = {
      issued: true,
      certificateId: cert.certificateId,
      issuedDate: new Date(),
      downloadUrl: cert.pdfUrl
    };
    
    // Email certificate
    await sendCertificateEmail(enrollment.customerEmail, cert);
  }
  
  await enrollment.save();
  
  res.json({
    percentComplete: Math.round((attendedCount / totalSessions) * 100),
    completed: enrollment.completed,
    certificate: enrollment.certificate
  });
});
```

### Frontend: Learn Page (React)
```jsx
export default function LearnSelfPaced({ enrollmentId }) {
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);

  useEffect(() => {
    loadEnrollment();
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    const data = await courseAPI.getSelfPacedEnrollment(enrollmentId);
    setEnrollment(data);
    setCourse(data.course);
  };

  const markComplete = async () => {
    const lesson = course.lessons[currentLessonIdx];
    await courseAPI.markLessonComplete(enrollmentId, lesson._id);
    loadEnrollment(); // Reload
  };

  if (!course) return <div>Loading...</div>;

  const currentLesson = course.lessons[currentLessonIdx];
  const isCompleted = enrollment.completedLessons.includes(currentLesson._id);

  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      {/* Sidebar */}
      <div className="col-span-1 bg-white rounded p-4">
        <h3 className="font-bold mb-4">Lessons ({enrollment.completedLessons.length}/{course.lessons.length})</h3>
        {course.lessons.map((lesson, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentLessonIdx(idx)}
            className={`block w-full text-left p-2 mb-1 rounded ${
              enrollment.completedLessons.includes(lesson._id)
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}
          >
            {enrollment.completedLessons.includes(lesson._id) ? '✓ ' : '○ '}
            {lesson.title}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="col-span-3 space-y-4">
        {/* Progress */}
        <div className="bg-white rounded p-4">
          <div className="flex justify-between mb-2">
            <span>Progress</span>
            <span className="font-bold">{enrollment.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-indigo-600 h-2 rounded"
              style={{ width: `${enrollment.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Video */}
        <div className="bg-white rounded p-4">
          <h2 className="text-xl font-bold mb-4">{currentLesson.title}</h2>
          <iframe
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/${extractYouTubeId(currentLesson.videoUrl)}`}
            frameBorder="0"
            allowFullScreen
          />
        </div>

        {/* Actions */}
        <div className="bg-white rounded p-4 flex gap-4">
          <button
            onClick={markComplete}
            disabled={isCompleted}
            className={`px-4 py-2 rounded text-white ${
              isCompleted ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isCompleted ? '✓ Completed' : 'Mark as Complete'}
          </button>

          {currentLessonIdx > 0 && (
            <button
              onClick={() => setCurrentLessonIdx(currentLessonIdx - 1)}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              ← Previous
            </button>
          )}

          {currentLessonIdx < course.lessons.length - 1 && (
            <button
              onClick={() => setCurrentLessonIdx(currentLessonIdx + 1)}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Next →
            </button>
          )}
        </div>

        {/* Certificate */}
        {enrollment.completed && (
          <div className="bg-green-100 border border-green-400 rounded p-4">
            <h3 className="font-bold text-green-800 mb-2">🏆 Certificate Earned!</h3>
            <a
              href={enrollment.certificate.downloadUrl}
              className="text-indigo-600 hover:underline"
            >
              Download Certificate
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📋 Implementation Checklist

### Database (1 day)
- [ ] Create 5 MongoDB schemas
- [ ] Create indexes
- [ ] Test locally

### Backend APIs (2 days)
- [ ] Course CRUD (create, update, publish)
- [ ] Add lessons
- [ ] Self-paced enrollment + mark complete
- [ ] Cohort enrollment + sessions
- [ ] Certificate generation
- [ ] Test with Postman

### Frontend (1.5 days)
- [ ] Browse courses
- [ ] Learn page (self-paced)
- [ ] Cohort sessions page
- [ ] My courses dashboard
- [ ] Certificate download

### Certificate System (0.5 days)
- [ ] PDF generation library
- [ ] Email delivery
- [ ] Verification URL

### Testing & Deploy (0.5 days)
- [ ] Test workflows
- [ ] Deploy to Railway
- [ ] Production testing

**Total: ~5 days**

---

## 🚀 Deployment Steps

1. Push code to git
2. Railway auto-deploys
3. Create indexes in MongoDB Atlas
4. Test enrollment workflow
5. Test certificate generation
6. Send test email

---

## ✅ Definition of Done

**Self-Paced Course:**
- [ ] Specialist creates course, adds 3 lessons, publishes
- [ ] Customer enrolls (free)
- [ ] Customer watches lesson 1, marks complete
- [ ] Customer watches lesson 2, marks complete
- [ ] Customer watches lesson 3, marks complete
- [ ] System auto-generates certificate
- [ ] Customer receives email with certificate link
- [ ] Customer downloads PDF

**Cohort Course:**
- [ ] Specialist creates cohort batch
- [ ] Specialist schedules 2 sessions with Zoom links
- [ ] Specialist publishes cohort
- [ ] Customer enrolls in cohort
- [ ] Customer sees 2 sessions in calendar
- [ ] Specialist marks customer attended session 1
- [ ] Specialist marks customer attended session 2
- [ ] System auto-generates certificate
- [ ] Customer receives email

---

## 🎯 What's NOT Included

❌ Quizzes
❌ Assignments
❌ Grading
❌ Attendance auto-tracking
❌ Reviews/ratings
❌ Advanced analytics
❌ Refunds
❌ Wallets

This is JUST:
✅ Create + publish courses
✅ Enroll
✅ Access content
✅ Mark done
✅ Auto-issue certificates

---

## Ready?

This is the absolute minimum for both course types to function.

Should I:
1. **Start implementing** this right now?
2. **Show you more details** on any section?
3. **Build it for you** (I can do this in 3 days)?

What next?
