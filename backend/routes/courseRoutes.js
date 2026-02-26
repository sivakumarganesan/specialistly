import express from 'express';
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addLesson,
  publishCourse,
  archiveCourse,
  browseCourses,
  addFileToLesson,
  removeFileFromLesson,
} from '../controllers/courseController.js';
import {
  enrollSelfPaced,
  getMyCourses,
  getEnrollmentDetails,
  markLessonComplete,
  checkCertificateEligibility,
  getCourseEnrollments,
} from '../controllers/enrollmentController.js';
import {
  createCohort,
  publishCohort,
  addSession,
  markSessionAttended,
  getCohortsByCourse,
  getCohortSessions,
  getSessionJoinLink,
  getMyCohorts,
} from '../controllers/cohortController.js';
import {
  enrollCohort,
  downloadCertificate,
  verifyCertificate,
  getCertificate,
  getMyCertificates,
} from '../controllers/certificateController.js';

const router = express.Router();

// ===== SPECIAL ROUTES (Most Specific - Before Wildcards) =====
// Get my courses (specialist's courses)
router.get('/my-courses', getAllCourses);

// Get all published courses (students can browse)
router.get('/browse', browseCourses);

// ===== SELF-PACED ENROLLMENT =====
// Enroll in self-paced course
router.post('/enrollments/self-paced', enrollSelfPaced);

// Get my self-paced courses
router.get('/enrollments/self-paced/my-courses', getMyCourses);

// Get self-paced enrollment details
router.get('/enrollments/self-paced/:enrollmentId', getEnrollmentDetails);

// Mark lesson as complete
router.post(
  '/enrollments/self-paced/:enrollmentId/lessons/:lessonId/complete',
  markLessonComplete
);

// Check certificate eligibility
router.get('/enrollments/self-paced/:enrollmentId/check-certificate', checkCertificateEligibility);

// ===== COHORT ENROLLMENT (Student) =====
// Enroll in cohort
router.post('/enrollments/cohort', enrollCohort);

// Get my cohorts
router.get('/enrollments/cohort/my-courses', getMyCohorts);

// Mark session attended
router.post(
  '/enrollments/cohort/:enrollmentId/sessions/:sessionId/attend',
  markSessionAttended
);

// Get join link for session (zoom)
router.get('/enrollments/cohort/:cohortId/sessions/:sessionId/join', getSessionJoinLink);

// ===== COHORT MANAGEMENT (Specialist) =====
// Create cohort batch
router.post('/cohorts', createCohort);

// Publish cohort
router.post('/cohorts/:cohortId/publish', publishCohort);

// Add session to cohort
router.post('/cohorts/:cohortId/sessions', addSession);

// Get cohort sessions
router.get('/cohorts/:cohortId/sessions', getCohortSessions);

// ===== CERTIFICATES =====
// Get my certificates
router.get('/certificates/my-certificates', getMyCertificates);

// Download certificate
router.get('/certificates/:certificateId/download', downloadCertificate);

// Get certificate details
router.get('/certificates/:certificateId', getCertificate);

// Verify certificate (public)
router.get('/verify/:certificateId', verifyCertificate);

// ===== COURSE MANAGEMENT (Specialist) - More Specific Routes First =====
// Create course
router.post('/', createCourse);

// TEST ENDPOINT - for debugging
router.get('/test-file-endpoint', (req, res) => {
  res.json({ success: true, message: 'File endpoint route is registered!' });
});

// Add file to lesson (Google Drive integration) - MUST be before /:id routes
router.post('/:courseId/lessons/:lessonId/files', addFileToLesson);

// Remove file from lesson - MUST be before /:id routes
router.delete('/:courseId/lessons/:lessonId/files/:fileId', removeFileFromLesson);

// Add lesson to course
router.post('/:id/lessons', addLesson);

// Publish course (make available)
router.post('/:id/publish', publishCourse);

// Archive course (remove from store)
router.post('/:id/archive', archiveCourse);

// Get cohorts by course (published only)
router.get('/:courseId/cohorts', getCohortsByCourse);

// Get course enrollments (specialist view)
router.get('/:courseId/enrollments', getCourseEnrollments);

// Update course
router.put('/:id', updateCourse);

// Delete course
router.delete('/:id', deleteCourse);

// Get course by ID - MUST be last (most generic)
router.get('/:id', getCourseById);

export default router;
