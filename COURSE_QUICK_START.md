# 🚀 COURSE SYSTEM - QUICK START IMPLEMENTATION

## MongoDB Models (Start Here)

### 1. Course Model
```javascript
// backend/models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Basic Info
  specialistId: String,
  specialistEmail: String,
  title: { type: String, required: true },
  description: String,
  category: String, // "Business", "Tech", "Health", etc.
  tags: [String],
  
  // Pricing
  price: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    refundable: { type: Boolean, default: true },
    refundWindow: { type: Number, default: 30 }, // days
  },
  
  // Course Type
  courseType: {
    type: String,
    enum: ["self-paced", "cohort-based"],
    required: true,
  },
  
  // Metadata
  thumbnail: String,
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"] },
  duration: Number, // hours
  
  // Certification
  certification: {
    enabled: { type: Boolean, default: false },
    title: String,
    completionCriteria: {
      lessonsCompleted: { type: Number, default: 80 }, // %
      quizPassPercentage: { type: Number, default: 70 }, // %
      assignmentRequired: { type: Boolean, default: false },
    },
  },
  
  // Course Structure
  modules: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      order: Number,
      lessons: [
        {
          _id: mongoose.Schema.Types.ObjectId,
          title: String,
          order: Number,
          type: { type: String, enum: ["video", "document", "quiz", "assignment"] },
          content: {
            videoUrl: String,
            videoDuration: Number,
            documents: [{ name: String, url: String }],
            quizzes: [mongoose.Schema.Types.ObjectId],
            assignments: [mongoose.Schema.Types.ObjectId],
          },
        },
      ],
    },
  ],
  
  // Status
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  publishedAt: Date,
  
  // Analytics
  stats: {
    totalEnrollments: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', courseSchema);
```

### 2. CourseEnrollment Model (Self-Paced)
```javascript
// backend/models/CourseEnrollment.js
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  customerId: { type: String, required: true },
  customerEmail: String,
  
  // Status
  status: { type: String, enum: ["active", "completed", "dropped"], default: "active" },
  
  // Progress
  progress: {
    completedLessons: [mongoose.Schema.Types.ObjectId],
    lastAccessedLesson: mongoose.Schema.Types.ObjectId,
    lastAccessedTime: Date,
    percentComplete: { type: Number, default: 0 },
  },
  
  // Quiz Attempts
  quizAttempts: [
    {
      quizId: mongoose.Schema.Types.ObjectId,
      attempt: Number,
      score: Number,
      maxScore: Number,
      percentage: Number,
      passed: Boolean,
      attemptedAt: Date,
    },
  ],
  
  // Assignments
  assignments: [
    {
      assignmentId: mongoose.Schema.Types.ObjectId,
      submittedFile: String,
      score: Number,
      status: { type: String, enum: ["pending", "graded"] },
      gradedAt: Date,
    },
  ],
  
  // Certificate
  certificate: {
    earned: { type: Boolean, default: false },
    certificateId: String,
    issueDate: Date,
    downloadUrl: String,
  },
  
  // Payment
  payment: {
    amount: Number,
    transactionId: String,
    paidAt: Date,
    refunded: { type: Boolean, default: false },
  },
  
  // Engagement
  totalTimeSpent: { type: Number, default: 0 }, // minutes
  completedAt: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
enrollmentSchema.index({ customerId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ customerId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });

module.exports = mongoose.model('CourseEnrollment', enrollmentSchema);
```

### 3. Cohort Model
```javascript
// backend/models/Cohort.js
const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  specialistId: String,
  
  // Batch Info
  batchName: String,
  status: { type: String, enum: ["draft", "open", "ongoing", "completed"], default: "draft" },
  
  // Dates
  startDate: Date,
  endDate: Date,
  enrollmentDeadline: Date,
  
  // Enrollment
  maxStudents: { type: Number, required: true },
  enrolledCount: { type: Number, default: 0 },
  
  // Sessions
  sessions: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      sessionNumber: Number,
      title: String,
      scheduledDate: Date,
      startTime: String, // "14:00"
      endTime: String, // "15:30"
      duration: Number, // minutes
      
      // Live
      liveSessionLink: String,
      platform: String, // "zoom", "google-meet"
      recordingUrl: String,
      
      // Attendance
      attendance: [
        {
          studentId: String,
          joined: Boolean,
          joinedAt: Date,
          leftAt: Date,
          durationMinutes: Number,
        },
      ],
      
      createdAt: { type: Date, default: Date.now },
    },
  ],
  
  // Completion Requirements
  completionCriteria: {
    minSessionAttendance: { type: Number, default: 80 }, // %
    assignmentSubmission: { type: Boolean, default: true },
    finalQuizPassRequired: { type: Boolean, default: false },
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cohortSchema.index({ courseId: 1, status: 1 });
cohortSchema.index({ specialistId: 1, startDate: -1 });

module.exports = mongoose.model('Cohort', cohortSchema);
```

---

## Express API Endpoints (Start with These)

### Specialist Course Creation
```javascript
// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticate, roleCheck } = require('../middleware/auth');

// CREATE COURSE
router.post('/courses', authenticate, roleCheck('specialist'), async (req, res) => {
  try {
    const { title, description, category, price, courseType, difficulty } = req.body;
    
    // Validation
    if (!title || !description || !courseType) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const course = new Course({
      specialistId: req.user.id,
      specialistEmail: req.user.email,
      title,
      description,
      category,
      price: { amount: price || 0 },
      courseType,
      difficulty: difficulty || "beginner",
      modules: [],
      status: "draft",
    });
    
    await course.save();
    
    res.status(201).json({
      message: "Course created successfully",
      courseId: course._id,
      status: "draft",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SPECIALIST'S COURSES
router.get('/courses', authenticate, roleCheck('specialist'), async (req, res) => {
  try {
    const courses = await Course.find({
      specialistId: req.user.id,
    }).select('title status stats publishedAt createdAt thumbnail');
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE COURSE
router.put('/courses/:courseId', authenticate, roleCheck('specialist'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    // Authorization check
    if (course.specialistId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    Object.assign(course, req.body);
    course.updatedAt = new Date();
    await course.save();
    
    res.json({ message: "Course updated", courseId: course._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLISH COURSE
router.post('/courses/:courseId/publish', authenticate, roleCheck('specialist'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    // Validation - must have content
    if (course.modules.length < 1 || course.modules.some(m => m.lessons.length < 2)) {
      return res.status(400).json({
        error: "Course must have at least 1 module with 2 lessons",
      });
    }
    
    if (!course.title || !course.description) {
      return res.status(400).json({ error: "Title and description required" });
    }
    
    course.status = "published";
    course.publishedAt = new Date();
    await course.save();
    
    res.json({
      message: "Course published successfully",
      courseId: course._id,
      status: "published",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Customer Enrollment
```javascript
// Enrollment endpoint
router.post('/enrollments', authenticate, roleCheck('customer'), async (req, res) => {
  try {
    const { courseId, paymentMethodId } = req.body;
    
    // Get course
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ error: "Course not found or not published" });
    }
    
    // Check existing enrollment
    const existingEnrollment = await CourseEnrollment.findOne({
      customerId: req.user.id,
      courseId,
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled" });
    }
    
    // Handle payment if paid course
    if (course.price.amount > 0) {
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method required" });
      }
      
      // Process payment (Stripe)
      // const charge = await stripe.charges.create({ ...paymentMethodId, amount });
      // Store transaction ID
    }
    
    // Create enrollment
    const enrollment = new CourseEnrollment({
      courseId,
      customerId: req.user.id,
      customerEmail: req.user.email,
      status: "active",
      progress: {
        completedLessons: [],
        percentComplete: 0,
      },
      payment: {
        amount: course.price.amount,
        paidAt: course.price.amount > 0 ? new Date() : null,
      },
    });
    
    await enrollment.save();
    
    // Increment course enrollment count
    course.stats.totalEnrollments++;
    await course.save();
    
    res.status(201).json({
      message: "Enrolled successfully",
      enrollmentId: enrollment._id,
      courseId: course._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET CUSTOMER'S ENROLLED COURSES
router.get('/enrollments/my-courses', authenticate, roleCheck('customer'), async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({
      customerId: req.user.id,
    })
      .populate('courseId', 'title thumbnail specs')
      .sort({ createdAt: -1 });
    
    const formatted = enrollments.map(e => ({
      enrollmentId: e._id,
      courseId: e.courseId._id,
      courseTitle: e.courseId.title,
      thumbnail: e.courseId.thumbnail,
      status: e.status,
      progressPercent: e.progress.percentComplete,
      lastAccessed: e.progress.lastAccessedTime,
      createdAt: e.createdAt,
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Key Business Logic Functions

### Progress Calculation
```javascript
// backend/utils/progressCalculator.js

function calculateProgress(enrollment, course) {
  const totalLessons = getTotalLessons(course);
  const completedCount = enrollment.progress.completedLessons.length;
  
  const lessonsPercent = (completedCount / totalLessons) * 100;
  
  // Calculate quiz percentage
  const passedQuizzes = enrollment.quizAttempts.filter(q => q.passed).length;
  const totalQuizzes = getTotalQuizzes(course);
  const quizPercent = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 100;
  
  // Calculate assignment percentage
  const gradedAssignments = enrollment.assignments.filter(a => a.status === 'graded').length;
  const totalAssignments = getTotalAssignments(course);
  const assignmentPercent = totalAssignments > 0 
    ? (gradedAssignments / totalAssignments) * 100 
    : 100;
  
  // Weighted average
  const weights = { lessons: 0.5, quizzes: 0.3, assignments: 0.2 };
  const percentComplete = 
    (lessonsPercent * weights.lessons) +
    (quizPercent * weights.quizzes) +
    (assignmentPercent * weights.assignments);
  
  return {
    percentComplete: Math.round(percentComplete),
    lessonsCompleted: completedCount,
    totalLessons,
    lastUpdated: new Date(),
  };
}

function getTotalLessons(course) {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function getTotalQuizzes(course) {
  return course.modules.reduce((sum, m) => {
    return sum + m.lessons.filter(l => l.type === 'quiz').length;
  }, 0);
}

function getTotalAssignments(course) {
  return course.modules.reduce((sum, m) => {
    return sum + m.lessons.filter(l => l.type === 'assignment').length;
  }, 0);
}

module.exports = { calculateProgress };
```

### Completion Check & Certificate Issuance
```javascript
// backend/services/certificateService.js
const Certificate = require('../models/Certificate');
const { generatePDF } = require('../utils/pdfGenerator');

async function checkCompletionAndIssueCertificate(enrollmentId) {
  try {
    const enrollment = await CourseEnrollment.findById(enrollmentId).populate('courseId');
    const course = enrollment.courseId;
    
    // Check if already has certificate
    if (enrollment.certificate.earned) {
      return { eligible: false, reason: "Certificate already earned" };
    }
    
    // Get criteria
    const { lessonsCompleted, quizPassPercentage, assignmentRequired } = 
      course.certification.completionCriteria;
    
    // Check lesson completion %
    const { percentComplete } = calculateProgress(enrollment, course);
    if (percentComplete < lessonsCompleted) {
      return { 
        eligible: false, 
        reason: `Complete ${lessonsCompleted}% of lessons (current: ${percentComplete}%)`,
      };
    }
    
    // Check quiz pass %
    const passedQuizzes = enrollment.quizAttempts.filter(q => q.passed).length;
    const totalQuizzes = enrollment.quizAttempts.length;
    if (totalQuizzes > 0 && passedQuizzes < totalQuizzes) {
      return { 
        eligible: false, 
        reason: "Pass all required quizzes",
      };
    }
    
    // Check quiz pass percentage
    const quizScores = enrollment.quizAttempts.map(q => q.percentage);
    const avgQuizScore = quizScores.length > 0 
      ? quizScores.reduce((a, b) => a + b) / quizScores.length 
      : 0;
    if (avgQuizScore < quizPassPercentage) {
      return { 
        eligible: false, 
        reason: `Achieve ${quizPassPercentage}% average on quizzes (current: ${avgQuizScore}%)`,
      };
    }
    
    // Check assignments
    if (assignmentRequired) {
      const pendingAssignments = enrollment.assignments.filter(a => a.status === 'pending');
      if (pendingAssignments.length > 0) {
        return { 
          eligible: false, 
          reason: "Submit all required assignments",
        };
      }
    }
    
    // ✅ ELIGIBLE - Issue certificate
    
    // Generate unique certificate ID
    const certificateId = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Generate PDF
    const pdfPath = await generatePDF({
      recipientName: (await User.findById(enrollment.customerId)).name,
      courseTitle: course.title,
      specialistName: (await User.findById(course.specialistId)).name,
      issueDate: new Date(),
      certificateId,
    });
    
    // Save certificate to storage (S3)
    const downloadUrl = await uploadToS3(pdfPath);
    const verificationUrl = `https://specialistly.com/verify/${certificateId}`;
    
    // Create certificate record
    const certificate = new Certificate({
      courseId: course._id,
      enrollmentId,
      certificateId,
      recipientEmail: enrollment.customerEmail,
      courseTitle: course.title,
      issueDate: new Date(),
      downloadUrl,
      verificationUrl,
      isValid: true,
    });
    
    await certificate.save();
    
    // Update enrollment
    enrollment.certificate = {
      earned: true,
      certificateId,
      issueDate: new Date(),
      downloadUrl,
    };
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
    await enrollment.save();
    
    // Send email
    await sendCertificateEmail(enrollment.customerEmail, {
      courseName: course.title,
      downloadUrl,
      verificationUrl,
    });
    
    return {
      eligible: true,
      certificateId,
      downloadUrl,
      verificationUrl,
    };
  } catch (error) {
    console.error('Certificate issuance error:', error);
    return { eligible: false, error: error.message };
  }
}

module.exports = { checkCompletionAndIssueCertificate };
```

### Quiz Grading
```javascript
// backend/routes/quizRoutes.js

router.post('/enrollments/:enrollmentId/quizzes/:quizId/submit', 
  authenticate, 
  async (req, res) => {
    try {
      const { answers } = req.body; // answers: [selected option indices]
      const enrollment = await CourseEnrollment.findById(req.params.enrollmentId);
      const quiz = await Quiz.findById(req.params.quizId);
      
      // Validate
      if (!enrollment || !quiz) {
        return res.status(404).json({ error: "Not found" });
      }
      
      if (enrollment.customerId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Check attempt limit
      const previousAttempts = enrollment.quizAttempts.filter(q => q.quizId === req.params.quizId);
      if (previousAttempts.length >= quiz.maxAttempts) {
        return res.status(400).json({ error: "Max attempts reached" });
      }
      
      // Calculate score
      let correctCount = 0;
      const correctAnswers = [];
      
      quiz.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
          correctCount++;
        }
        
        correctAnswers.push({
          questionId: question._id,
          userAnswer,
          correct: isCorrect,
          explanation: question.explanation,
        });
      });
      
      const score = (correctCount / quiz.questions.length) * quiz.questions.length;
      const percentage = (correctCount / quiz.questions.length) * 100;
      const passed = percentage >= quiz.passingPercentage;
      
      // Record attempt
      const attempt = {
        quizId: req.params.quizId,
        attempt: previousAttempts.length + 1,
        score,
        maxScore: quiz.questions.length,
        percentage: Math.round(percentage),
        passed,
        answers: correctAnswers,
        attemptedAt: new Date(),
      };
      
      enrollment.quizAttempts.push(attempt);
      await enrollment.save();
      
      // Check completion
      await checkCompletionAndIssueCertificate(req.params.enrollmentId);
      
      res.json({
        attempt: attempt.attempt,
        score,
        percentage: Math.round(percentage),
        passed,
        correctAnswers,
        message: passed ? "Quiz passed!" : "Quiz failed. You can retake it.",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## Frontend Component Skeleton (React)

### Course Discovery
```jsx
// src/app/components/CoursesBrowse.tsx
import React, { useState, useEffect } from 'react';
import { courseAPI } from '../api/apiClient';

export default function CoursesBrowse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    courseType: '',
    priceRange: [0, 500],
  });

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseAPI.browseCourses(filters);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Explore Courses</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1">
          <FilterSidebar filters={filters} setFilters={setFilters} />
        </div>
        
        {/* Courses Grid */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
      <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg">{course.title}</h3>
        <p className="text-sm text-gray-600">{course.description.substring(0, 100)}...</p>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-2xl font-bold">
            {course.price.amount > 0 ? `$${course.price.amount}` : 'FREE'}
          </span>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Learning Dashboard
```jsx
// src/app/components/LearningDashboard.tsx
import React, { useState, useEffect } from 'react';
import { courseAPI } from '../api/apiClient';

export default function LearningDashboard({ enrollmentId }) {
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollment();
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    try {
      const data = await courseAPI.getEnrollment(enrollmentId);
      setEnrollment(data);
      setCourse(data.course);
      
      // Load last accessed lesson or first lesson
      if (data.progress.lastAccessedLesson) {
        setCurrentLesson(data.progress.lastAccessedLesson);
      }
    } catch (error) {
      console.error('Error loading enrollment:', error);
    }
    setLoading(false);
  };

  const completeLesson = async (lessonId) => {
    try {
      await courseAPI.markLessonComplete(enrollmentId, lessonId);
      loadEnrollment(); // Reload to update progress
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {/* Sidebar - Lesson Tree */}
      <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
        <h3 className="font-bold text-lg mb-4">Course Content</h3>
        
        <div className="space-y-2">
          {course.modules.map((module, mIdx) => (
            <div key={mIdx}>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">{module.title}</h4>
              <div className="ml-4 space-y-1">
                {module.lessons.map((lesson, lIdx) => (
                  <button
                    key={lIdx}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full text-left text-sm p-2 rounded ${
                      enrollment.progress.completedLessons.includes(lesson._id)
                        ? 'bg-green-100 text-green-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {enrollment.progress.completedLessons.includes(lesson._id) ? '✓ ' : '○ '}
                    {lesson.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="md:col-span-2 space-y-4">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Course Progress</span>
            <span className="text-lg font-bold text-indigo-600">
              {enrollment.progress.percentComplete}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full"
              style={{ width: `${enrollment.progress.percentComplete}%` }}
            />
          </div>
        </div>
        
        {/* Current Lesson */}
        {currentLesson && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
            
            {currentLesson.type === 'video' && (
              <div className="mb-4">
                <video
                  src={currentLesson.content.videoUrl}
                  controls
                  className="w-full rounded-lg bg-black"
                />
              </div>
            )}
            
            {currentLesson.type === 'document' && (
              <div className="mb-4">
                {currentLesson.content.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    download
                    className="block bg-gray-100 p-3 rounded mb-2 hover:bg-gray-200"
                  >
                    📄 {doc.name}
                  </a>
                ))}
              </div>
            )}
            
            <button
              onClick={() => completeLesson(currentLesson._id)}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
            >
              Mark as Complete ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Self-Paced Course
- [ ] Create draft course
- [ ] Publish course (validate checks)
- [ ] Enroll as customer (paid & free)
- [ ] Add modules & lessons
- [ ] Mark lessons complete
- [ ] Submit quiz (pass/fail scenarios)
- [ ] Submit assignment
- [ ] Award certificate auto-magically
- [ ] Verify certificate public URL
- [ ] Download certificate
- [ ] Test progress calculation

### Cohort-Based Course
- [ ] Create cohort batch
- [ ] Schedule sessions with Zoom link
- [ ] Customer enrolls
- [ ] Customer joins session (test link)
- [ ] Specialist uploads recording
- [ ] Customer views recording
- [ ] Attendance recorded
- [ ] Calculate attendance %
- [ ] Issue certificate based on attendance + assignments

---

## Next Steps

1. **Create models first** → Database foundation
2. **Build APIs** → Test with Postman
3. **Create basic UI** → Course browsing & enrollment
4. **Implement progress tracking** → Core logic
5. **Add certification** → PDF generation & email
6. **Build cohort system** → Schedule & attendance
7. **Deploy & test** → Production readiness

---

**Pick ANY ONE endpoint above and I'll help you implement it completely!**
