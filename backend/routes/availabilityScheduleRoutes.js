import express from 'express';
import {
  getAvailabilitySchedule,
  createAvailabilitySchedule,
  updateAvailabilitySchedule,
  deleteAvailabilitySchedule,
  getAvailableTimeSlotsForDate,
} from '../controllers/availabilityScheduleController.js';

const router = express.Router();

// Get specialist's active availability schedule
router.get('/specialist/:specialistEmail', getAvailabilitySchedule);

// Get available time slots for a specific date
router.get('/slots/:specialistEmail/:date', getAvailableTimeSlotsForDate);

// Create new availability schedule
router.post('/', createAvailabilitySchedule);

// Update availability schedule
router.put('/:scheduleId', updateAvailabilitySchedule);

// Delete (deactivate) availability schedule
router.delete('/:scheduleId', deleteAvailabilitySchedule);

export default router;
