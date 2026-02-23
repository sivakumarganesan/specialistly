/**
 * Video Routes
 * Handles all video upload, retrieval, and management endpoints
 */

import express from 'express';
import cloudflareConfig from '../config/cloudflareConfig.js';
import {
  getVideoUploadToken,
  saveLessonVideo,
  getVideoDetails,
  getLessonVideoUrl,
  deleteVideo,
  updateVideoMetadata,
} from '../controllers/videoController.js';

const router = express.Router();

/**
 * Diagnostic endpoint - check Cloudflare configuration
 * GET /api/videos/health
 */
router.get('/health', (req, res) => {
  const isConfigured = cloudflareConfig.isConfigured();
  
  res.json({
    status: isConfigured ? 'healthy' : 'misconfigured',
    cloudflareConfigured: isConfigured,
    accountId: cloudflareConfig.accountId ? '✓ Set' : '✗ Missing',
    apiToken: cloudflareConfig.apiToken ? '✓ Set' : '✗ Missing',
    message: isConfigured 
      ? 'Cloudflare Stream is properly configured'
      : 'Cloudflare credentials are missing. Check environment variables on server.'
  });
});

/**
 * Video Upload & Management Routes
 */

// Get upload token for client-side upload
router.post('/upload-token', getVideoUploadToken);

// Save video reference after upload
router.post('/save-lesson-video', saveLessonVideo);

// Get video details
router.get('/:videoId', getVideoDetails);

// Get lesson video playback URL
router.get('/lessons/:courseId/:lessonId', getLessonVideoUrl);

// Update video metadata
router.put('/:videoId/metadata', updateVideoMetadata);

// Delete video
router.delete('/:videoId', deleteVideo);

export default router;
