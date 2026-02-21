import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as consultingSlotController from '../controllers/consultingSlotController.js';

const router = express.Router();

// ===== POST ROUTES (must come FIRST for priority) =====

// Create a new slot (for authenticated specialist)
// POST /api/consulting-slots
router.post('/', authMiddleware, consultingSlotController.createSlot);

// Bulk create slots (must come BEFORE /:slotId pattern to avoid conflicts)
// POST /api/consulting-slots/bulk/create
router.post('/bulk/create', authMiddleware, consultingSlotController.bulkCreateSlots);

// Auto-generate slots from availability schedule (for authenticated specialist)
// POST /api/consulting-slots/generate/from-availability
router.post('/generate/from-availability', authMiddleware, consultingSlotController.generateSlotsFromAvailability);

// Book a slot
// POST /api/consulting-slots/:slotId/book
router.post('/:slotId/book', consultingSlotController.bookSlot);

// Create Zoom meeting for a booking (specialist only)
// POST /api/consulting-slots/:slotId/booking/:bookingIndex/create-zoom
router.post('/:slotId/booking/:bookingIndex/create-zoom', authMiddleware, consultingSlotController.createZoomMeetingForBooking);

// Cancel a booking (specialist only)
// POST /api/consulting-slots/:slotId/booking/:bookingIndex/cancel
router.post('/:slotId/booking/:bookingIndex/cancel', authMiddleware, consultingSlotController.cancelBooking);

// ===== GET ROUTES (more specific routes first) =====

// Get available slots for a specialist with booking rules applied (Customer view)
// GET /api/consulting-slots/customer/available?specialistEmail=john@example.com&startDate=2026-02-19
router.get('/customer/available', consultingSlotController.getAvailableSlotsForCustomer);

// Get available slots for a specialist (legacy)
// GET /api/consulting-slots/available?specialistEmail=john@example.com&startDate=2026-02-19&endDate=2026-03-19
router.get('/available', consultingSlotController.getAvailableSlots);

// Get single slot by ID
// GET /api/consulting-slots/slot/:slotId
router.get('/slot/:slotId', consultingSlotController.getSlotById);

// Get specialist's slots stats (must come before /:specialistEmail)
// GET /api/consulting-slots/:specialistEmail/stats
router.get('/:specialistEmail/stats', consultingSlotController.getSpecialistStats);

// Get all slots for a specialist (Specialist view - generic catch-all)
// GET /api/consulting-slots/:specialistEmail?status=active
router.get('/:specialistEmail', consultingSlotController.getSpecialistSlots);

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
