import express from 'express';
import {
  getCourseEnrollments,
  addSelfPacedEnrollment,
  removeSelfPacedEnrollment,
  addCohortEnrollment,
  removeCohortEnrollment,
  getAuditLogs,
  getCourseAuditLogs,
} from '../controllers/enrollmentManagementController.js';

const router = express.Router();

// All enrollment management routes require admin authentication (enforced by parent router)

/**
 * GET /api/admin/enrollments/course/:courseId
 * Get all enrolled customers for a specific course
 */
router.get('/course/:courseId', getCourseEnrollments);

/**
 * POST /api/admin/enrollments/self-paced/add
 * Manually add a customer to a self-paced course
 */
router.post('/self-paced/add', addSelfPacedEnrollment);

/**
 * DELETE /api/admin/enrollments/self-paced/:enrollmentId
 * Manually remove a customer from a self-paced course
 */
router.delete('/self-paced/:enrollmentId', removeSelfPacedEnrollment);

/**
 * POST /api/admin/enrollments/cohort/add
 * Manually add a customer to a cohort course
 */
router.post('/cohort/add', addCohortEnrollment);

/**
 * DELETE /api/admin/enrollments/cohort/:enrollmentId
 * Manually remove a customer from a cohort course
 */
router.delete('/cohort/:enrollmentId', removeCohortEnrollment);

/**
 * GET /api/admin/enrollments/audit-logs
 * Get enrollment audit logs with optional filtering
 */
router.get('/audit-logs', getAuditLogs);

/**
 * GET /api/admin/enrollments/:courseId/audit-logs
 * Get audit logs for a specific course
 */
router.get('/:courseId/audit-logs', getCourseAuditLogs);

export default router;
