import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  updateBankAccount,
  getBankAccount,
  getPayoutHistory,
  getPayoutStats,
  processPayoutManual,
} from '../controllers/payoutController.js';

const router = express.Router();

/**
 * Specialist Payout Routes
 */

// Update specialist bank account
router.post('/bank-account', authMiddleware, updateBankAccount);

// Get specialist bank account
router.get('/bank-account', authMiddleware, getBankAccount);

// Get payout history
router.get('/payouts', authMiddleware, getPayoutHistory);

// Get payout statistics
router.get('/payout-stats', authMiddleware, getPayoutStats);

/**
 * Admin Routes
 */

// Manual payout trigger (admin only)
router.post('/payouts/:commissionId/process', authMiddleware, processPayoutManual);

export default router;
