import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getSpecialistOverview } from '../controllers/reportController.js';

const router = express.Router();

// GET /api/reports/specialist-overview
router.get('/specialist-overview', authMiddleware, getSpecialistOverview);

export default router;
