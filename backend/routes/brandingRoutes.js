import express from 'express';
import {
  getBrandingByEmail,
  getBrandingBySlug,
  createBranding,
  updateBranding,
  updatePageSection,
  togglePublish,
  checkSlugAvailability,
  addTestimonial,
  removeTestimonial,
  addSocialLink,
  removeSocialLink,
} from '../controllers/brandingController.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public/slug/:slug', getBrandingBySlug); // Get branding by slug for public pages
router.get('/available/slug', checkSlugAvailability); // Check if slug is available

// Specialist routes (auth required)
router.get('/:email', getBrandingByEmail); // Get branding by email
router.post('/', createBranding); // Create branding
router.put('/:email', updateBranding); // Update branding
router.put('/:email/section/:section', updatePageSection); // Update page section
router.put('/:email/publish', togglePublish); // Publish/unpublish page

// Testimonials
router.post('/:email/testimonials', addTestimonial);
router.delete('/:email/testimonials/:testimonialId', removeTestimonial);

// Social Links
router.post('/:email/social', addSocialLink);
router.delete('/:email/social/:platform', removeSocialLink);

export default router;
