import express from 'express';
import {
  signup,
  login,
  getProfile,
  updateSubscription,
  markOnboardingComplete,
  deleteAccount,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/onboarding-complete', markOnboardingComplete);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/subscription', authMiddleware, updateSubscription);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
