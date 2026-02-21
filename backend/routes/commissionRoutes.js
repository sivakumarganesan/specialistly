import express from 'express';
import {
  getCommissionRates,
  calculateCommissionBreakdown,
  updateCommissionRate,
  getCommissionPayments,
  getCommissionStatistics,
  getSpecialistEarnings,
} from '../controllers/commissionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

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
router.post('/update', authMiddleware, updateCommissionRate);

// Get commission payments history (admin only)
router.get('/payments', authMiddleware, getCommissionPayments);

// Get commission statistics (admin only)
router.get('/statistics', authMiddleware, getCommissionStatistics);

// Get specialist earnings
router.get('/specialist/:specialistId/earnings', authMiddleware, getSpecialistEarnings);

export default router;
