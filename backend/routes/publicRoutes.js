import express from 'express';
import { getPublicPage } from '../controllers/pageController.js';
import {
  createPublicPaymentIntent,
  confirmPublicPayment,
} from '../controllers/publicCourseController.js';

const router = express.Router();

// Public routes - NO authentication required
router.get('/page/:subdomain/:pageSlug', getPublicPage);

// Public course purchase routes - NO authentication required
router.post('/course-purchase/create-intent', createPublicPaymentIntent);
router.post('/course-purchase/confirm-payment', confirmPublicPayment);

export default router;
