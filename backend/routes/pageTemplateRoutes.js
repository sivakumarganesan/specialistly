import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  listTemplates,
  getTemplate,
  createPageFromTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
  seedTemplates,
} from '../controllers/pageTemplateController.js';

const router = express.Router();

// Public routes - list templates
router.get('/templates', listTemplates);
router.get('/templates/:templateId', getTemplate);

// Seed templates (admin only)
router.post('/templates/admin/seed', seedTemplates);

// Protected routes - require authentication
router.use(authMiddleware);

// Create page from template
router.post('/templates/:templateId/create-page', createPageFromTemplate);

// Admin only routes - template management
router.get('/templates/admin/all', getAllTemplates);
router.post('/templates/admin', createTemplate);
router.put('/templates/admin/:templateId', updateTemplate);
router.delete('/templates/admin/:templateId', deleteTemplate);

export default router;
