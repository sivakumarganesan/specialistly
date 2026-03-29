import express from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addPurchaseToCustomer,
  enrollCourse,
  bookService,
  bookWebinar,
  getEnrollmentsByEmail,
  getBookingsByEmail,
  updateCustomerInterests,
  getCustomerInterests,
  getEnrichedCustomers,
  sendBulkEmail,
} from '../controllers/customerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Specific POST routes first (before parameterized routes)
router.post('/enroll', enrollCourse);
router.post('/book', bookService);
router.post('/book-webinar', bookWebinar);

// Customer interests routes
router.put('/interests', updateCustomerInterests);
router.get('/interests/:email', getCustomerInterests);

// Enriched customers with segmentation (auth required)
router.get('/enriched', authMiddleware, getEnrichedCustomers);

// Send email to selected customers (auth required)
router.post('/send-email', authMiddleware, sendBulkEmail);

// Email-based retrieval routes (before ID-based routes)
router.get('/:email/enrollments', getEnrollmentsByEmail);
router.get('/:email/bookings', getBookingsByEmail);

// General customer routes
router.post('/', createCustomer);
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.post('/:customerId/purchases', addPurchaseToCustomer);

export default router;
