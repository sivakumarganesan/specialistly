/**
 * Video Routes
 * Handles all video upload, retrieval, and management endpoints
 */

import express from 'express';
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
