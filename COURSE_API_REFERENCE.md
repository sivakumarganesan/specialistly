# Course System API Reference & Examples

Quick reference for all 22 API endpoints with example requests and responses.

## Base URL
```
http://localhost:5000/api/courses
```

## Headers
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN"  // For protected routes
}
```

---

## 🎓 Course Management

### Create Course
**POST** `/`

Create a new course (draft status).

**Request**:
```json
{
  "title": "Learn TypeScript",
  "description": "Master TypeScript from basics to advanced",
  "courseType": "self-paced",
  "price": 0
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Course created successfully",
  "courseId": "507f1f77bcf86cd799439012",
  "status": "draft",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "specialistId": "user123",
    "specialistEmail": "instructor@example.com",
    "title": "Learn TypeScript",
    "description": "Master TypeScript from basics to advanced",
    "courseType": "self-paced",
    "price": 0,
    "lessons": [],
    "status": "draft",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-10T08:00:00Z"
  }
}
```

---

### Get My Courses
**GET** `/my-courses`

Get all courses created by the authenticated specialist.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Learn TypeScript",
      "courseType": "self-paced",
      "price": 0,
      "status": "draft",
      "lessons": [],
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

---

### Browse Public Courses
**GET** `/browse`

Get all published courses (public endpoint, no auth required).

**Query Parameters**:
- `courseType`: "self-paced" | "cohort" (optional filter)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Learn TypeScript",
      "description": "Master TypeScript...",
      "courseType": "self-paced",
      "price": 0,
      "lessons": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Lesson 1: Getting Started",
          "order": 1
        }
      ],
      "specialistName": "Dr. Jane Smith",
      "status": "published"
    }
  ]
}
```

---

### Get Course Details
**GET** `/:courseId`

Get full details for a specific course.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Learn TypeScript",
    "description": "Complete TypeScript course",
    "courseType": "self-paced",
    "price": 0,
    "lessons": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Getting Started",
        "videoUrl": "https://www.youtube.com/embed/abc123",
        "order": 1
      }
    ],
    "status": "published",
    "publishedAt": "2024-01-12T10:00:00Z"
  }
}
```

---

### Update Course
**PUT** `/:courseId`

Update course details (title, description, price only).

**Request**:
```json
{
  "title": "Advanced TypeScript",
  "description": "Deep dive into TypeScript",
  "price": 49
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": { /* updated course */ }
}
```

---

### Add Lesson
**POST** `/:courseId/lessons`

Add a video lesson to a course.

**Request**:
```json
{
  "title": "Functions & Types",
  "videoUrl": "https://www.youtube.com/embed/xyz789",
  "order": 2
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Lesson added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Learning TypeScript",
    "lessons": [
      { "order": 1, "title": "Getting Started" },
      { "order": 2, "title": "Functions & Types" }
    ]
  }
}
```

---

### Publish Course
**POST** `/:courseId/publish`

Make course available for enrollment (requires ≥1 lesson).

**Request**: Empty body

**Response** (200):
```json
{
  "success": true,
  "message": "Course published successfully",
  "status": "published",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "published",
    "publishedAt": "2024-01-12T14:30:00Z"
  }
}
```

**Error if no lessons**:
```json
{
  "success": false,
  "message": "Course must have at least 1 lesson"
}
```

---

### Archive Course
**POST** `/:courseId/archive`

Remove course from public listing (students keep access).

**Response** (200):
```json
{
  "success": true,
  "message": "Course archived successfully",
  "data": { "_id": "...", "status": "archived" }
}
```

---

### Delete Course
**DELETE** `/:courseId`

Permanently delete course (use with caution).

**Response** (200):
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": { "_id": "507f1f77bcf86cd799439012" }
}
```

---

## 👤 Self-Paced Enrollment

### Enroll in Self-Paced Course
**POST** `/enrollments/self-paced`

Enroll current student in a published self-paced course.

**Request**:
```json
{
  "courseId": "507f1f77bcf86cd799439012"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Enrolled successfully",
  "enrollmentId": "507f1f77bcf86cd799439050",
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "courseId": "507f1f77bcf86cd799439012",
    "customerId": "student123",
    "completedLessons": [],
    "completed": false,
    "certificate": null
  }
}
```

---

### Get My Self-Paced Courses
**GET** `/enrollments/self-paced/my-courses`

Get all self-paced courses student is enrolled in.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": "507f1f77bcf86cd799439050",
      "courseId": "507f1f77bcf86cd799439012",
      "title": "Learn TypeScript",
      "thumbnail": "https://...",
      "lessonsTotal": 5,
      "lessonsCompleted": 2,
      "percentComplete": 40,
      "completed": false,
      "certificate": null
    }
  ]
}
```

---

### Get Enrollment Details
**GET** `/enrollments/self-paced/:enrollmentId`

Get full details including lesson list and progress.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "enrollmentId": "507f1f77bcf86cd799439050",
    "courseTitle": "Learn TypeScript",
    "lessons": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Getting Started",
        "order": 1,
        "videoUrl": "https://...",
        "completed": true
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Functions & Types",
        "order": 2,
        "videoUrl": "https://...",
        "completed": true
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Advanced Types",
        "order": 3,
        "videoUrl": "https://...",
        "completed": false
      }
    ],
    "percentComplete": 66,
    "completed": false,
    "certificate": null
  }
}
```

---

### Mark Lesson Complete
**POST** `/enrollments/self-paced/:enrollmentId/lessons/:lessonId/complete`

Mark a lesson as watched/completed.

**Request**: Empty body

**Response** (200):
```json
{
  "success": true,
  "message": "Lesson marked complete",
  "percentComplete": 66,
  "completed": false,
  "certificate": null
}
```

**Response when all lessons done** (200):
```json
{
  "success": true,
  "message": "Lesson marked complete",
  "percentComplete": 100,
  "completed": true,
  "certificate": {
    "issued": true,
    "certificateId": "CERT-2024-XYZ789",
    "issuedDate": "2024-01-15T10:30:00Z",
    "downloadUrl": "/certificates/CERT-2024-XYZ789/download"
  }
}
```

---

### Check Certificate Eligibility
**GET** `/enrollments/self-paced/:enrollmentId/check-certificate`

Check if student is eligible for certificate.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "allLessonsDone": true,
    "certificate": {
      "issued": true,
      "certificateId": "CERT-2024-XYZ789",
      "downloadUrl": "/certificates/CERT-2024-XYZ789/download"
    }
  }
}
```

---

## 👥 Cohort Management

### Create Cohort
**POST** `/cohorts`

Create a new cohort batch for a course.

**Request**:
```json
{
  "courseId": "507f1f77bcf86cd799439012",
  "batchName": "Spring 2024 Batch 1",
  "startDate": "2024-03-01",
  "endDate": "2024-04-30",
  "enrollmentDeadline": "2024-02-28",
  "maxStudents": 30
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Cohort created successfully",
  "cohortId": "507f1f77bcf86cd799439020",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "courseId": "507f1f77bcf86cd799439012",
    "batchName": "Spring 2024 Batch 1",
    "startDate": "2024-03-01T00:00:00Z",
    "endDate": "2024-04-30T00:00:00Z",
    "enrollmentDeadline": "2024-02-28T23:59:59Z",
    "maxStudents": 30,
    "enrolledCount": 0,
    "sessions": [],
    "status": "draft"
  }
}
```

---

### Add Session to Cohort
**POST** `/cohorts/:cohortId/sessions`

Add a session to a cohort.

**Request**:
```json
{
  "sessionNumber": 1,
  "title": "Getting Started with TypeScript",
  "date": "2024-03-01",
  "time": "2:00 PM EST",
  "zoomLink": "https://zoom.us/j/123456789"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Session added successfully",
  "data": {
    "sessions": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "sessionNumber": 1,
        "title": "Getting Started with TypeScript",
        "date": "2024-03-01T14:00:00Z",
        "time": "2:00 PM EST",
        "zoomLink": "https://zoom.us/j/123456789",
        "completed": false
      }
    ]
  }
}
```

---

### Publish Cohort
**POST** `/cohorts/:cohortId/publish`

Make cohort available for enrollment (requires ≥1 session).

**Request**: Empty body

**Response** (200):
```json
{
  "success": true,
  "message": "Cohort published successfully",
  "data": { "_id": "...", "status": "published" }
}
```

---

### Get Cohorts for Course
**GET** `/:courseId/cohorts`

Get available cohorts for a specific course (published only).

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "cohortId": "507f1f77bcf86cd799439020",
      "batchName": "Spring 2024 Batch 1",
      "startDate": "2024-03-01T00:00:00Z",
      "enrollmentDeadline": "2024-02-28T23:59:59Z",
      "maxStudents": 30,
      "enrolledCount": 12,
      "spotsAvailable": 18,
      "sessionsCount": 8
    }
  ]
}
```

---

### Get Cohort Sessions
**GET** `/cohorts/:cohortId/sessions`

Get all sessions for a cohort.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "cohortId": "507f1f77bcf86cd799439020",
    "batchName": "Spring 2024 Batch 1",
    "status": "published",
    "sessions": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "sessionNumber": 1,
        "title": "Getting Started",
        "date": "2024-03-01T14:00:00Z",
        "time": "2:00 PM EST",
        "zoomLink": "https://zoom.us/j/123456789",
        "completed": true
      },
      {
        "_id": "507f1f77bcf86cd799439022",
        "sessionNumber": 2,
        "title": "Advanced Topics",
        "date": "2024-03-08T14:00:00Z",
        "time": "2:00 PM EST",
        "zoomLink": "https://zoom.us/j/987654321",
        "completed": false
      }
    ]
  }
}
```

---

## 👨‍🎓 Cohort Enrollment (Students)

### Enroll in Cohort
**POST** `/enrollments/cohort`

Enroll in a published cohort.

**Request**:
```json
{
  "cohortId": "507f1f77bcf86cd799439020"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Enrolled in cohort successfully",
  "enrollmentId": "507f1f77bcf86cd799439060",
  "data": {
    "_id": "507f1f77bcf86cd799439060",
    "cohortId": "507f1f77bcf86cd799439020",
    "customerId": "student123",
    "attendedSessions": [],
    "completed": false
  }
}
```

---

### Get My Cohorts
**GET** `/enrollments/cohort/my-courses`

Get all cohorts student is enrolled in.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": "507f1f77bcf86cd799439060",
      "cohortId": "507f1f77bcf86cd799439020",
      "batchName": "Spring 2024 Batch 1",
      "startDate": "2024-03-01T00:00:00Z",
      "sessionsTotal": 8,
      "sessionsAttended": 2,
      "percentComplete": 25,
      "completed": false,
      "certificate": null
    }
  ]
}
```

---

### Mark Session Attended
**POST** `/enrollments/cohort/:enrollmentId/sessions/:sessionId/attend`

Record that student attended a session.

**Request**: Empty body

**Response** (200):
```json
{
  "success": true,
  "message": "Attendance recorded",
  "percentComplete": 25,
  "completed": false,
  "certificate": null
}
```

**Response when all sessions attended** (200):
```json
{
  "success": true,
  "message": "Attendance recorded",
  "percentComplete": 100,
  "completed": true,
  "certificate": {
    "issued": true,
    "certificateId": "CERT-2024-ABC123",
    "issuedDate": "2024-04-30T15:00:00Z",
    "downloadUrl": "/certificates/CERT-2024-ABC123/download"
  }
}
```

---

### Get Session Join Link
**GET** `/enrollments/cohort/:cohortId/sessions/:sessionId/join`

Get Zoom link for joining a specific session.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "507f1f77bcf86cd799439021",
    "title": "Getting Started with TypeScript",
    "date": "2024-03-01T14:00:00Z",
    "time": "2:00 PM EST",
    "zoomLink": "https://zoom.us/j/123456789"
  }
}
```

---

## 📜 Certificates

### Download Certificate
**GET** `/certificates/:certificateId/download`

Get certificate details for download.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "certificateId": "CERT-2024-XYZ789",
    "courseName": "Learn TypeScript",
    "customerName": "John Doe",
    "specialistName": "Dr. Jane Smith",
    "issueDate": "2024-01-15T10:30:00Z",
    "courseType": "self-paced",
    "pdfUrl": "https://specialistly.com/certificates/CERT-2024-XYZ789.pdf"
  }
}
```

---

### Get Certificate Details
**GET** `/certificates/:certificateId`

Protected endpoint to get full certificate details.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "certificateId": "CERT-2024-XYZ789",
    "courseId": "507f1f77bcf86cd799439012",
    "courseName": "Learn TypeScript",
    "courseType": "self-paced",
    "customerId": "student123",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "specialistId": "specialist123",
    "specialistName": "Dr. Jane Smith",
    "issueDate": "2024-01-15T10:30:00Z",
    "verifyUrl": "https://specialistly.com/verify/CERT-2024-XYZ789"
  }
}
```

---

### Verify Certificate (Public)
**GET** `/verify/:certificateId`

Public endpoint to verify certificate authenticity.

**Response** (200):
```json
{
  "success": true,
  "verified": true,
  "data": {
    "certificateId": "CERT-2024-XYZ789",
    "courseName": "Learn TypeScript",
    "customerName": "John Doe",
    "specialistName": "Dr. Jane Smith",
    "courseType": "self-paced",
    "issueDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get My Certificates
**GET** `/certificates/my-certificates`

Get all certificates earned by authenticated user.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "certificateId": "CERT-2024-XYZ789",
      "courseName": "Learn TypeScript",
      "specialistName": "Dr. Jane Smith",
      "issueDate": "2024-01-15T10:30:00Z",
      "courseType": "self-paced"
    },
    {
      "_id": "507f1f77bcf86cd799439041",
      "certificateId": "CERT-2024-ABC123",
      "courseName": "Advanced Python",
      "specialistName": "Prof. Mike Johnson",
      "issueDate": "2024-01-20T14:00:00Z",
      "courseType": "cohort"
    }
  ]
}
```

---

## ❌ Error Responses

All endpoints follow common error format:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Title and course type are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found or not published"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - no token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to access this course"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📝 Usage Examples

### Complete Self-Paced Workflow
```bash
# 1. Browse courses
curl http://localhost:5000/api/courses/browse

# 2. Enroll in course
curl -X POST http://localhost:5000/api/courses/enrollments/self-paced \
  -H "Authorization: Bearer TOKEN" \
  -d '{"courseId": "ID"}'

# 3. Get enrollment details
curl http://localhost:5000/api/courses/enrollments/self-paced/ENROLLMENT_ID \
  -H "Authorization: Bearer TOKEN"

# 4. Mark lesson complete (repeat for each lesson)
curl -X POST http://localhost:5000/api/courses/enrollments/self-paced/ENROLLMENT_ID/lessons/LESSON_ID/complete \
  -H "Authorization: Bearer TOKEN"

# 5. Download certificate
curl http://localhost:5000/api/courses/certificates/CERT_ID \
  -H "Authorization: Bearer TOKEN"
```

---

Last Updated: 2024
