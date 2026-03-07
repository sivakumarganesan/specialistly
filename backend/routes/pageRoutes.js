import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createPage,
  getPages,
  getPageById,
  updatePage,
  publishPage,
  deletePage,
  reorderPages,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../controllers/pageController.js';

const router = express.Router({ mergeParams: true });

// Protected routes - require authentication
router.use(authMiddleware);

// Page routes
router.post('/', createPage);
router.get('/', getPages);
router.get('/:pageId', getPageById);
router.put('/:pageId', updatePage);
router.put('/:pageId/publish', publishPage);
router.delete('/:pageId', deletePage);
router.put('/reorder', reorderPages);

// Section routes
router.post('/:pageId/sections', addSection);
router.put('/:pageId/sections/:sectionId', updateSection);
router.delete('/:pageId/sections/:sectionId', deleteSection);
router.put('/:pageId/sections/reorder', reorderSections);

export default router;
