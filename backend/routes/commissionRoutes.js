import express from 'express';
import {
  getCommissionRates,
  calculateCommissionBreakdown,
  updateCommissionRate,
  getCommissionPayments,
  getCommissionStatistics,
  getSpecialistEarnings,
} from '../controllers/commissionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public endpoints
 */

// Get current commission rates (public for payment display)
router.get('/rates', getCommissionRates);

// Calculate commission breakdown for any amount
router.post('/calculate', calculateCommissionBreakdown);

/**
 * Protected endpoints
 */

// Update commission rate (admin only)
router.post('/update', authenticate, updateCommissionRate);

// Get commission payments history (admin only)
router.get('/payments', authenticate, getCommissionPayments);

// Get commission statistics (admin only)
router.get('/statistics', authenticate, getCommissionStatistics);

// Get specialist earnings
router.get('/specialist/:specialistId/earnings', authenticate, getSpecialistEarnings);

export default router;
