import express from 'express';
import * as websiteController from '../controllers/websiteController.js';

const router = express.Router();

// Get website configuration
router.get('/:email', websiteController.getWebsite);

// Save entire website configuration
router.post('/:email', websiteController.saveWebsite);

// Update subdomain
router.put('/:email/subdomain', websiteController.updateSubdomain);

// Update branding and theme
router.put('/:email/branding', websiteController.updateBranding);

// Update content selection
router.put('/:email/content', websiteController.updateContent);

// Publish website
router.put('/:email/publish', websiteController.publishWebsite);

export default router;
