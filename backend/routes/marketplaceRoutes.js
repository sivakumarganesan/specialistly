import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createMarketplacePaymentIntent,
  confirmMarketplacePayment,
  getSpecialistOnboardingLink,
  getSpecialistStatus,
  getSpecialistEarnings,
  getSpecialistDashboardLink,
  getSpecialistCommissions,
  disconnectStripeAccount,
} from '../controllers/marketplaceController.js';

const router = express.Router();

/**
 * Marketplace Payment Routes
 */

// Create payment intent for marketplace (customer pays, specialist gets payout after commission)
router.post('/payments/create-intent', authMiddleware, createMarketplacePaymentIntent);

// Confirm marketplace payment and create enrollment
router.post('/payments/confirm-payment', authMiddleware, confirmMarketplacePayment);

/**
 * Specialist Stripe Connect Routes
 */

// Get onboarding link for specialist to connect their Stripe account
router.post('/specialist/onboarding-link', authMiddleware, getSpecialistOnboardingLink);

// Get specialist Stripe account status
router.get('/specialist/status', authMiddleware, getSpecialistStatus);

// Get specialist earnings and balance
router.get('/specialist/earnings', authMiddleware, getSpecialistEarnings);

// Get login link to Stripe dashboard
router.post('/specialist/dashboard-link', authMiddleware, getSpecialistDashboardLink);

// Get commission records
router.get('/specialist/commissions', authMiddleware, getSpecialistCommissions);

// Disconnect Stripe account
router.post('/specialist/disconnect', authMiddleware, disconnectStripeAccount);

export default router;
