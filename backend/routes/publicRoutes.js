import express from 'express';
import { getPublicPage } from '../controllers/pageController.js';
import {
  createPublicPaymentIntent,
  confirmPublicPayment,
  confirmRazorpayPublicPayment,
} from '../controllers/publicCourseController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - NO authentication required
router.get('/page/:subdomain/:pageSlug', getPublicPage);

// Public course purchase routes - optional auth (uses real userId if logged in)
router.post('/course-purchase/create-intent', optionalAuthMiddleware, createPublicPaymentIntent);
router.post('/course-purchase/confirm-payment', optionalAuthMiddleware, confirmPublicPayment);
router.post('/course-purchase/confirm-razorpay', optionalAuthMiddleware, confirmRazorpayPublicPayment);

export default router;
