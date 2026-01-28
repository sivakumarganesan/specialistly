import express from 'express';
import {
  createAppointmentSlot,
  getAllAppointmentSlots,
  getAvailableSlots,
  bookSlot,
  deleteAppointmentSlot,
  sendReminder,
  shareRecording,
  getRecording,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Appointment slot routes
router.post('/', createAppointmentSlot);
router.get('/', getAllAppointmentSlots);
router.get('/available', getAvailableSlots);
router.put('/:slotId/book', bookSlot);
router.put('/:appointmentId/status', updateAppointmentStatus);

// Google Meet & Recording routes
router.post('/:appointmentId/send-reminder', sendReminder);
router.post('/:appointmentId/share-recording', shareRecording);
router.get('/:appointmentId/recording', getRecording);

router.delete('/:id', deleteAppointmentSlot);

export default router;
