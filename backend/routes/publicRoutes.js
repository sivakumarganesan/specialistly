import express from 'express';
import { getPublicPage } from '../controllers/pageController.js';

const router = express.Router();

// Public routes - NO authentication required
router.get('/page/:subdomain/:pageSlug', getPublicPage);

export default router;
