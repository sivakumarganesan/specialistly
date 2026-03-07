import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createWebsite,
  getWebsites,
  getWebsiteById,
  updateWebsite,
  updateBranding,
  publishWebsite,
  deleteWebsite,
  getPublicWebsite,
} from '../controllers/pageBuilderController.js';

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Website routes
router.post('/websites', createWebsite);
router.get('/websites', getWebsites);
router.get('/websites/:websiteId', getWebsiteById);
router.put('/websites/:websiteId', updateWebsite);
router.put('/websites/:websiteId/branding', updateBranding);
router.put('/websites/:websiteId/publish', publishWebsite);
router.delete('/websites/:websiteId', deleteWebsite);

// Public routes - no authentication required
router.get('/public/websites/:domain', getPublicWebsite);

export default router;
