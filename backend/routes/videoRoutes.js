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
 * Token verification endpoint - test API credentials and permissions
 * GET /api/videos/verify-token
 */
router.get('/verify-token', async (req, res) => {
  try {
    if (!cloudflareConfig.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudflare credentials missing'
      });
    }

    const axios = (await import('axios')).default;
    
    // Test 1: Verify token
    console.log('[Token Verify] Testing token authentication...');
    const verifyResponse = await axios.get(
      'https://api.cloudflare.com/client/v4/user/tokens/verify',
      {
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`
        }
      }
    );

    const tokenInfo = verifyResponse.data?.result;
    
    // Test 2: Try to access Stream API
    console.log('[Token Verify] Testing Stream API access...');
    const streamResponse = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream/direct_upload`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`
        }
      }
    );

    res.json({
      success: true,
      tokenStatus: 'valid',
      tokenInfo: {
        status: tokenInfo?.status,
        permissions: tokenInfo?.policies?.[0]?.effect_scope?.resources || []
      },
      message: 'Token is valid and has Stream API access'
    });

  } catch (error) {
    console.error('[Token Verify] ERROR:', error.response?.data || error.message);
    
    res.status(400).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message,
      details: error.response?.data?.errors || [],
      suggestions: [
        '1. Verify CLOUDFLARE_API_TOKEN matches exactly (no spaces)',
        '2. Verify CLOUDFLARE_ACCOUNT_ID is correct',
        '3. Check if token has Stream:Edit permission',
        '4. Check if Cloudflare Stream is enabled on your account',
        '5. Rotate token: cloudflare.com → Account → API Tokens'
      ]
    });
  }
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
