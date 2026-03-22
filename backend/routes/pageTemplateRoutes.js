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
router.get('/', listTemplates);
router.get('/:templateId', getTemplate);

// Seed templates (admin only)
router.post('/admin/seed', seedTemplates);

// Protected routes - require authentication
router.use(authMiddleware);

// Create page from template
router.post('/:templateId/create-page', createPageFromTemplate);

// Admin only routes - template management
router.get('/admin/all', getAllTemplates);
router.post('/admin', createTemplate);
router.put('/admin/:templateId', updateTemplate);
router.delete('/admin/:templateId', deleteTemplate);

export default router;
