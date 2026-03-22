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
  ensureSubdomain,
  updateSubdomain,
  updateCustomDomain,
  createPage,
  getPages,
  getPageById,
  updatePage,
  publishPage,
  deletePage,
  createSection,
  getSections,
  updateSection,
  deleteSection,
  getPublicWebsite,
} from '../controllers/pageBuilderController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/public/websites/:domain', getPublicWebsite);

// Protected routes - require authentication
router.use(authMiddleware);

// Website routes
router.post('/websites', createWebsite);
router.get('/websites', getWebsites);
router.get('/websites/:websiteId', getWebsiteById);
router.put('/websites/:websiteId', updateWebsite);
router.put('/websites/:websiteId/branding', updateBranding);
router.put('/websites/:websiteId/publish', publishWebsite);
router.put('/websites/:websiteId/ensure-subdomain', ensureSubdomain);
router.put('/websites/:websiteId/subdomain', updateSubdomain);
router.put('/websites/:websiteId/custom-domain', updateCustomDomain);
router.delete('/websites/:websiteId', deleteWebsite);

// Page routes
router.post('/websites/:websiteId/pages', createPage);
router.get('/websites/:websiteId/pages', getPages);
router.get('/websites/:websiteId/pages/:pageId', getPageById);
router.put('/websites/:websiteId/pages/:pageId', updatePage);
router.put('/websites/:websiteId/pages/:pageId/publish', publishPage);
router.delete('/websites/:websiteId/pages/:pageId', deletePage);

// Section routes
router.post('/websites/:websiteId/pages/:pageId/sections', createSection);
router.get('/websites/:websiteId/pages/:pageId/sections', getSections);
router.put('/websites/:websiteId/pages/:pageId/sections/:sectionId', updateSection);
router.delete('/websites/:websiteId/pages/:pageId/sections/:sectionId', deleteSection);

export default router;
