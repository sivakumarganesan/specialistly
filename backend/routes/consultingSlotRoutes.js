import express from 'express';
import * as consultingSlotController from '../controllers/consultingSlotController.js';

const router = express.Router();

// ===== GET ROUTES =====

// Get available slots for a specialist (Customer view)
// GET /api/consulting-slots/available?specialistEmail=john@example.com&startDate=2026-02-19&endDate=2026-03-19
router.get('/available', consultingSlotController.getAvailableSlots);

// Get single slot by ID (must match MongoDB ObjectId: 24-character hex string)
// GET /api/consulting-slots/slot/:slotId
router.get('/slot/:slotId([a-f0-9]{24})', consultingSlotController.getSlotById);

// Get specialist's slots stats
// GET /api/consulting-slots/:specialistEmail/stats
router.get('/:specialistEmail/stats', consultingSlotController.getSpecialistStats);

// Get all slots for a specialist (Specialist view)
// GET /api/consulting-slots/:specialistEmail?status=active
router.get('/:specialistEmail', consultingSlotController.getSpecialistSlots);

// ===== POST ROUTES =====

// Create a new slot
// POST /api/consulting-slots
router.post('/', consultingSlotController.createSlot);

// Book a slot
// POST /api/consulting-slots/:slotId/book
router.post('/:slotId/book', consultingSlotController.bookSlot);

// Bulk create slots
// POST /api/consulting-slots/bulk/create
router.post('/bulk/create', consultingSlotController.bulkCreateSlots);

// ===== PUT ROUTES =====

// Update slot (time and status only)
// PUT /api/consulting-slots/:slotId
router.put('/:slotId', consultingSlotController.updateSlot);

// ===== DELETE ROUTES =====

// Delete slot
// DELETE /api/consulting-slots/:slotId
router.delete('/:slotId', consultingSlotController.deleteSlot);

// Cancel a booking
// DELETE /api/consulting-slots/:slotId/book/:customerId
router.delete('/:slotId/book/:customerId', consultingSlotController.cancelBooking);

export default router;
