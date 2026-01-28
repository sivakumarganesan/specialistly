import express from 'express';
import {
  signup,
  login,
  getProfile,
  updateSubscription,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/subscription', authMiddleware, updateSubscription);

export default router;
