import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentDetails,
  getPaymentHistory,
  processRefund,
  getSpecialistStatistics,
} from '../controllers/paymentController.js';
import {
  handleStripeWebhook,
  webhookHealth,
  testWebhook,
} from '../controllers/webhookController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== WEBHOOK ROUTES (No authentication required) =====
// Must be first and use raw body
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.get('/webhooks/health', webhookHealth);

// Test webhook (development only)
router.post('/webhooks/test', testWebhook);

// ===== PAYMENT ROUTES (Authentication required) =====

// Create Payment Intent
router.post('/create-intent', authMiddleware, createPaymentIntent);

// Confirm Payment
router.post('/confirm-payment', authMiddleware, confirmPayment);

// Get Payment Details
router.get('/:paymentId', authMiddleware, getPaymentDetails);

// Get Payment History
router.get('/history/customer', authMiddleware, getPaymentHistory);

// Process Refund
router.post('/:paymentId/refund', authMiddleware, processRefund);

// Get Specialist Statistics
router.get('/specialist/statistics', authMiddleware, getSpecialistStatistics);

export default router;
