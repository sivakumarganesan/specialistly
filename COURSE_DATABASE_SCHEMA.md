# Course System Database Schema

Complete reference for the 5 new MongoDB collections added to Specialistly.

## 📦 Collections Overview

| Collection | Purpose | Records | Indexes |
|---|---|---|---|
| **Course** | Master course data | 1 per course | specialistId, status, createdAt |
| **SelfPacedEnrollment** | Student progress (self-paced) | 1 per enrollment | (courseId, customerId), customerId |
| **Cohort** | Instructor-led batches | 1 per batch | courseId, specialistId |
| **CohortEnrollment** | Student progress (cohort) | 1 per enrollment | (cohortId, customerId), customerId |
| **Certificate** | Issued certificates | 1 per completion | certificateId, customerId, courseId |

---

## 1. Course Collection

**Master course data for both self-paced and cohort types**

```javascript
{
  _id: ObjectId,
  specialistId: String,        // Reference to User._id
  specialistEmail: String,      // For email notifications
  title: String,                // Course name (required, indexed)
  description: String,          // Full course description
  courseType: String,           // "self-paced" | "cohort" (enum)
  price: Number,                // 0 for free
  thumbnail: String,            // URL to course image
  lessons: [                    // Embedded lessons (only for self-paced)
    {
      _id: ObjectId,
      title: String,            // Lesson title
      videoUrl: String,         // YouTube/Vimeo embed URL
      order: Number,            // Sequence number
      createdAt: Date
    }
  ],
  status: String,               // "draft" | "published" | "archived"
  publishedAt: Date,            // When course went live
  createdAt: Date,              // Auto: current time
  updatedAt: Date               // Auto: updated on each save
}
```

**Indexes**:
- `specialistId`
- `status`
- `createdAt`
- `updatedAt`

**Example Usage**:
```javascript
// Create course
const course = new Course({
  specialistId: userId,
  specialistEmail: userEmail,
  title: "Learn React",
  courseType: "self-paced",
  price: 0,
  lessons: []
});

// Add lesson
course.lessons.push({
  title: "Introduction",
  videoUrl: "https://www.youtube.com/embed/abc123",
  order: 1
});

// Publish
course.status = "published";
course.publishedAt = new Date();
await course.save();
```

---

## 2. SelfPacedEnrollment Collection

**Track self-paced student progress**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId,           // Reference to Course._id
  customerId: String,           // Reference to User._id
  customerEmail: String,        // For certificate email
  completedLessons: [ObjectId], // Array of lesson._id completed
  completed: Boolean,           // true when all lessons done
  certificate: {                // Auto-populated on completion
    issued: Boolean,
    certificateId: String,      // e.g., "CERT-2024-ABC123"
    issuedDate: Date,
    downloadUrl: String         // e.g., "/certificates/CERT-2024-ABC123/download"
  },
  paidAt: Date,                 // When payment processed (if price > 0)
  amount: Number,               // Price customer paid
  createdAt: Date,              // When enrolled
  updatedAt: Date               // Last activity
}
```

**Indexes**:
- Unique on `(courseId, customerId)` - prevents duplicate enrollments
- `customerId`

**Example Document**:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  courseId: ObjectId("507f1f77bcf86cd799439012"),
  customerId: "user123",
  customerEmail: "student@example.com",
  completedLessons: [
    ObjectId("507f1f77bcf86cd799439013"),
    ObjectId("507f1f77bcf86cd799439014")
  ],
  completed: true,
  certificate: {
    issued: true,
    certificateId: "CERT-2024-XYZ789",
    issuedDate: ISODate("2024-01-15T10:30:00Z"),
    downloadUrl: "/certificates/CERT-2024-XYZ789/download"
  },
  paidAt: ISODate("2024-01-10T08:00:00Z"),
  amount: 0,
  createdAt: ISODate("2024-01-10T08:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

---

## 3. Cohort Collection

**Instructor-led cohort batches with sessions**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId,           // Reference to Course._id
  specialistId: String,         // Reference to User._id (course creator)
  specialistEmail: String,      // For notifications
  batchName: String,            // e.g., "Batch 1 - Jan 2024"
  startDate: Date,              // Cohort start date
  endDate: Date,                // Cohort end date
  enrollmentDeadline: Date,     // Last day to enroll
  maxStudents: Number,          // Capacity
  enrolledCount: Number,        // Current enrolled (auto-updated)
  sessions: [                   // Embedded session list
    {
      _id: ObjectId,
      sessionNumber: Number,    // 1, 2, 3, etc.
      title: String,            // "Week 1: Fundamentals"
      date: Date,               // Session date
      time: String,             // "2:00 PM EST" or "14:00"
      zoomLink: String,         // Zoom meeting URL
      completed: Boolean        // Marked as done by instructor
    }
  ],
  status: String,               // "draft" | "published" | "ongoing" | "ended"
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `courseId`
- `specialistId`
- `updatedAt`

**Example Document**:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439020"),
  courseId: ObjectId("507f1f77bcf86cd799439012"),
  specialistId: "specialist123",
  specialistEmail: "instructor@example.com",
  batchName: "Python for Beginners - Spring 2024",
  startDate: ISODate("2024-03-01T00:00:00Z"),
  endDate: ISODate("2024-04-30T00:00:00Z"),
  enrollmentDeadline: ISODate("2024-02-28T23:59:59Z"),
  maxStudents: 30,
  enrolledCount: 25,
  sessions: [
    {
      _id: ObjectId("507f1f77bcf86cd799439021"),
      sessionNumber: 1,
      title: "Getting Started with Python",
      date: ISODate("2024-03-01T14:00:00Z"),
      time: "2:00 PM EST",
      zoomLink: "https://zoom.us/j/123456789",
      completed: true
    },
    {
      _id: ObjectId("507f1f77bcf86cd799439022"),
      sessionNumber: 2,
      title: "Variables and Data Types",
      date: ISODate("2024-03-08T14:00:00Z"),
      time: "2:00 PM EST",
      zoomLink: "https://zoom.us/j/987654321",
      completed: false
    }
  ],
  status: "published",
  createdAt: ISODate("2024-02-15T10:00:00Z"),
  updatedAt: ISODate("2024-02-20T15:30:00Z")
}
```

---

## 4. CohortEnrollment Collection

**Track cohort student attendance and progress**

```javascript
{
  _id: ObjectId,
  cohortId: ObjectId,           // Reference to Cohort._id
  customerId: String,           // Reference to User._id
  customerEmail: String,        // For notifications
  attendedSessions: [ObjectId], // Array of attended session._id
  completed: Boolean,           // true when all sessions attended
  certificate: {                // Auto-populated on completion
    issued: Boolean,
    certificateId: String,      // e.g., "CERT-2024-ABC123"
    issuedDate: Date,
    downloadUrl: String
  },
  paidAt: Date,                 // When enrolled (payment processed)
  amount: Number,               // Price paid
  createdAt: Date,              // When enrolled
  updatedAt: Date               // Last activity
}
```

**Indexes**:
- Unique on `(cohortId, customerId)` - prevents duplicate enrollments
- `customerId`

**Example Document**:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439030"),
  cohortId: ObjectId("507f1f77bcf86cd799439020"),
  customerId: "student456",
  customerEmail: "student456@example.com",
  attendedSessions: [
    ObjectId("507f1f77bcf86cd799439021"),  // Session 1 attended
    ObjectId("507f1f77bcf86cd799439022")   // Session 2 attended
  ],
  completed: false,
  certificate: null,
  paidAt: ISODate("2024-02-25T09:00:00Z"),
  amount: 50,
  createdAt: ISODate("2024-02-25T09:00:00Z"),
  updatedAt: ISODate("2024-03-08T14:30:00Z")
}
```

---

## 5. Certificate Collection

**Issued certificates with verification**

```javascript
{
  _id: ObjectId,
  certificateId: String,        // Unique ID (required), e.g., "CERT-2024-ABC123XYZ"
  courseId: ObjectId,           // Reference to Course._id
  courseName: String,           // e.g., "Learn React"
  courseType: String,           // "self-paced" | "cohort"
  customerId: String,           // Reference to User._id (recipient)
  customerName: String,         // Full name of certificate holder
  customerEmail: String,        // For certificate delivery
  specialistId: String,         // Reference to User._id (instructor)
  specialistName: String,       // Instructor name
  enrollmentId: ObjectId,       // Reference to enrollment document
  issueDate: Date,              // When certificate issued
  pdfUrl: String,               // URL to downloadable PDF
  verifyUrl: String,            // Public verification link
  createdAt: Date
}
```

**Indexes**:
- Unique on `certificateId`
- `customerId`
- `courseId`
- `specialistId`

**Example Document**:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439040"),
  certificateId: "CERT-2024-XYZ789ABC",
  courseId: ObjectId("507f1f77bcf86cd799439012"),
  courseName: "Advanced Python Programming",
  courseType: "self-paced",
  customerId: "student789",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  specialistId: "specialist123",
  specialistName: "Dr. Jane Smith",
  enrollmentId: ObjectId("507f1f77bcf86cd799439011"),
  issueDate: ISODate("2024-02-20T10:00:00Z"),
  pdfUrl: "https://specialistly.com/certificates/CERT-2024-XYZ789ABC.pdf",
  verifyUrl: "https://specialistly.com/verify/CERT-2024-XYZ789ABC",
  createdAt: ISODate("2024-02-20T10:00:00Z")
}
```

---

## 🔍 Query Examples

### Get all published courses
```javascript
db.Course.find({ status: "published" }).sort({ createdAt: -1 })
```

### Get specialist's courses
```javascript
db.Course.find({ specialistId: "specialist123", status: "published" })
```

### Get student's self-paced enrollments with progress
```javascript
db.SelfPacedEnrollment.aggregate([
  { $match: { customerId: "student123" } },
  { $lookup: {
      from: "Course",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
    }
  },
  { $project: {
      courseName: "$course.title",
      lessonsTotal: { $size: "$course.lessons" },
      lessonsCompleted: { $size: "$completedLessons" },
      percentComplete: {
        $round: [{
          $multiply: [
            { $divide: [{ $size: "$completedLessons" }, { $size: "$course.lessons" }] },
            100
          ]
        }, 0]
      }
    }
  }
])
```

### Get student's certificates
```javascript
db.Certificate.find({ customerId: "student123" }).sort({ issueDate: -1 })
```

### Verify a certificate
```javascript
db.Certificate.findOne({ certificateId: "CERT-2024-XYZ789ABC" })
```

### Get cohort with attendance statistics
```javascript
db.Cohort.aggregate([
  { $match: { _id: ObjectId("507f1f77bcf86cd799439020") } },
  { $lookup: {
      from: "CohortEnrollment",
      localField: "_id",
      foreignField: "cohortId",
      as: "enrollments"
    }
  },
  { $project: {
      batchName: 1,
      totalEnrolled: { $size: "$enrollments" },
      totalCompleted: {
        $size: {
          $filter: {
            input: "$enrollments",
            as: "enrollment",
            cond: { $eq: ["$$enrollment.completed", true] }
          }
        }
      }
    }
  }
])
```

---

## 📊 Database Size Estimates

For ~1000 active students with 50 courses:

| Collection | Avg Docs | Doc Size | Total |
|---|---|---|---|
| Course | 50 | ~2KB | ~100KB |
| SelfPacedEnrollment | 2500+ | ~1JSON | ~2.5MB |
| Cohort | 100 | ~5KB | ~500KB |
| CohortEnrollment | 2500+ | ~1KB | ~2.5MB |
| Certificate | 5000+ | ~1KB | ~5MB |
| **Total** | | | **~10.5MB** |

MongoDB Atlas free tier includes 512MB, so plenty of space.

---

## 🔐 Security Considerations

1. **Always verify specialistId matches req.user.id** before allowing modifications
2. **Always filter by customerId** when fetching student's own data
3. **Certificates are public** (verifyUrl accessible without auth)
4. **Keep specialistEmail and customerEmail** for audit trail
5. Consider adding soft deletes instead of hard deletes for compliance

---

## 🚀 Migration Notes

If migrating from existing schema:
1. These are NEW collections - no data migration needed
2. Existing User, Service, Message collections untouched
3. Safe to deploy alongside existing features
4. Rollback: Delete the 5 new collections if needed

---

Last Updated: 2024
