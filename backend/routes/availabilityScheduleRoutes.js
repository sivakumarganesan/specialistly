import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getAvailabilitySchedule,
  createAvailabilitySchedule,
  updateAvailabilitySchedule,
  deleteAvailabilitySchedule,
  getAvailableTimeSlotsForDate,
} from '../controllers/availabilityScheduleController.js';

const router = express.Router();

// ===== AUTHENTICATED SPECIALIST ROUTES =====
// Get logged-in specialist's availability schedule
router.get('/my/schedule', authMiddleware, getAvailabilitySchedule);

// Create new availability schedule (for logged-in specialist)
router.post('/', authMiddleware, createAvailabilitySchedule);

// Update availability schedule (for logged-in specialist)
router.put('/:scheduleId', authMiddleware, updateAvailabilitySchedule);

// Delete (deactivate) availability schedule (for logged-in specialist)
router.delete('/:scheduleId', authMiddleware, deleteAvailabilitySchedule);

// ===== PUBLIC ROUTES (for customers to view specialist availability) =====
// Get specialist's active availability schedule by email
router.get('/specialist/:specialistEmail', getAvailabilitySchedule);

// Get available time slots for a specific date
router.get('/slots/:specialistEmail/:date', getAvailableTimeSlotsForDate);

export default router;
