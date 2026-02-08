import express from 'express';
import {
  createAppointmentSlot,
  getAllAppointmentSlots,
  getAvailableSlots,
  getScheduledWebinars,
  bookSlot,
  deleteAppointmentSlot,
  sendReminder,
  shareRecording,
  getRecording,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Appointment slot routes
// More specific routes must come BEFORE generic ones
router.get('/available', getAvailableSlots);  // Must be before router.get('/')
router.get('/scheduled-webinars', getScheduledWebinars);  // Must be before router.get('/')
router.post('/', createAppointmentSlot);
router.get('/', getAllAppointmentSlots);
router.put('/:slotId/book', bookSlot);
router.put('/:appointmentId/status', updateAppointmentStatus);

// Google Meet & Recording routes
router.post('/:appointmentId/send-reminder', sendReminder);
router.post('/:appointmentId/share-recording', shareRecording);
router.get('/:appointmentId/recording', getRecording);

router.delete('/:id', deleteAppointmentSlot);

export default router;
