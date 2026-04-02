import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import {
  getPlatformStats,
  getUsers,
  getUserDetail,
  toggleUserStatus,
  getRecentActivity,
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminMiddleware);

router.get('/stats', getPlatformStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/recent-activity', getRecentActivity);

export default router;
