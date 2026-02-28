/**
 * Video/Cloudflare Stream Controller
 * Handles video uploads, retrieval, and metadata management
 */

import cloudflareStreamService from '../services/cloudflareStreamService.js';
import cloudflareConfig from '../config/cloudflareConfig.js';
import Course from '../models/Course.js';

/**
 * Get upload token for client-side video upload
 * POST /api/videos/upload-token
 */
export const getVideoUploadToken = async (req, res) => {
  try {
    console.log('[Video Controller] Upload token request received');
    
    // Check if Cloudflare is configured
    if (!cloudflareConfig.isConfigured()) {
      console.warn('[Video Controller] Cloudflare NOT configured');
      return res.status(503).json({
        success: false,
        message: 'Video upload service is not configured. Please contact administrator. Missing Cloudflare credentials in .env file.',
        error: 'CLOUDFLARE_NOT_CONFIGURED',
      });
    }

    console.log('[Video Controller] Cloudflare IS configured, processing request');
    const { title, courseId, lessonId } = req.body;

    // Only title is required for Cloudflare token generation
    // courseId and lessonId are for reference/logging purposes
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Video title is required',
      });
    }

    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and lesson ID are required',
      });
    }

    console.log('[Video Controller] Calling cloudflareStreamService.getUploadToken()');
    const token = await cloudflareStreamService.getUploadToken({ title });

    console.log('[Video Controller] Successfully obtained upload token');
    res.json({
      success: true,
      uploadUrl: token.uploadUrl,
      streamId: token.videoId,
      expiresIn: token.expiresIn,
    });
  } catch (error) {
    console.error('[Video Controller] ERROR getting upload token:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Save video reference after upload
 * POST /api/videos/save-lesson-video
 */
export const saveLessonVideo = async (req, res) => {
  try {
    const { courseId, lessonId, videoId, title, duration, thumbnail } = req.body;

    if (!courseId || !lessonId || !videoId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, lesson ID, and video ID are required',
      });
    }

    // Get video details from Cloudflare
    const videoDetails = await cloudflareStreamService.getVideoDetails(videoId);

    // Update course lesson with video information
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = course.lessons.find(l => l._id.toString() === lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Update lesson with video information
    // Map Cloudflare status to our enum: 'ready', 'inprogress', 'error', 'pending'
    let mappedStatus = videoDetails.status || 'pending';
    if (mappedStatus === 'inprogress' || mappedStatus === 'processing') {
      mappedStatus = 'inprogress';
    } else if (mappedStatus !== 'ready' && mappedStatus !== 'error' && mappedStatus !== 'pending') {
      mappedStatus = 'inprogress'; // Default to inprogress for unknown statuses
    }

    lesson.cloudflareStreamId = videoId;
    lesson.cloudflarePlaybackUrl = videoDetails.hlsPlaybackUrl;
    lesson.cloudflareStatus = mappedStatus;
    lesson.videoDuration = videoDetails.duration || duration || 0;
    lesson.videoThumbnail = videoDetails.thumbnail || thumbnail;

    await course.save();

    res.json({
      success: true,
      message: 'Video saved successfully',
      lesson: {
        lessonId: lesson._id,
        cloudflareStreamId: lesson.cloudflareStreamId,
        status: lesson.cloudflareStatus,
        duration: lesson.videoDuration,
      },
    });
  } catch (error) {
    console.error('Error saving lesson video:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get video details
 * GET /api/videos/:videoId
 */
export const getVideoDetails = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    const videoDetails = await cloudflareStreamService.getVideoDetails(videoId);

    res.json({
      success: true,
      video: videoDetails,
    });
  } catch (error) {
    console.error('Error getting video details:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get lesson video playback URL
 * GET /api/lessons/:courseId/:lessonId/video
 */
export const getLessonVideoUrl = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and lesson ID are required',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = course.lessons.find(l => l._id.toString() === lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (!lesson.cloudflareStreamId) {
      return res.status(404).json({
        success: false,
        message: 'No Cloudflare Stream video found for this lesson',
      });
    }

    // Get latest video details
    const videoDetails = await cloudflareStreamService.getVideoDetails(
      lesson.cloudflareStreamId
    );

    res.json({
      success: true,
      video: {
        videoId: lesson.cloudflareStreamId,
        hlsUrl: videoDetails.hlsPlaybackUrl,
        dashUrl: videoDetails.dashPlaybackUrl,
        thumbnail: videoDetails.thumbnail,
        duration: videoDetails.duration,
        status: videoDetails.status,
        title: lesson.title,
      },
    });
  } catch (error) {
    console.error('Error getting lesson video URL:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete video
 * DELETE /api/videos/:videoId
 */
export const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    await cloudflareStreamService.deleteVideo(videoId);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update video metadata
 * PUT /api/videos/:videoId/metadata
 */
export const updateVideoMetadata = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    await cloudflareStreamService.updateVideoMetadata(videoId, { title });

    res.json({
      success: true,
      message: 'Video metadata updated successfully',
    });
  } catch (error) {
    console.error('Error updating video metadata:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  getVideoUploadToken,
  saveLessonVideo,
  getVideoDetails,
  getLessonVideoUrl,
  deleteVideo,
  updateVideoMetadata,
};
