import express from 'express';
import {
  createAppointmentSlot,
  getAllAppointmentSlots,
  getAvailableSlots,
  bookSlot,
  deleteAppointmentSlot,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Appointment slot routes
router.post('/', createAppointmentSlot);
router.get('/', getAllAppointmentSlots);
router.get('/available', getAvailableSlots);
router.put('/:slotId/book', bookSlot);
router.delete('/:id', deleteAppointmentSlot);

export default router;
