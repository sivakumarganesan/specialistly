import express from 'express';
import {
  signup,
  login,
  getProfile,
  updateSubscription,
  markOnboardingComplete,
  deleteAccount,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/onboarding-complete', markOnboardingComplete);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/subscription', authMiddleware, updateSubscription);
router.put('/change-password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
