import dotenv from 'dotenv';
import { uploadToS3, deleteFromS3 } from './s3Service.js';
import cloudflareConfig from '../config/cloudflareConfig.js';
import axios from 'axios';

dotenv.config();

/**
 * Unified Media Service
 * Supports three media sources:
 * 1. S3 - General files and images
 * 2. Cloudflare Stream - HLS video streaming
 * 3. YouTube - Embedded video links
 */

// ============ S3 Media ============

export const uploadMediaToS3 = async (file, fileName, mimeType) => {
  try {
    console.log(`📤 Uploading to S3: ${fileName}`);
    const result = await uploadToS3(file.buffer, fileName, mimeType, 'media');
    
    return {
      success: true,
      provider: 's3',
      url: result.url,
      key: result.key,
      filename: result.filename,
      originalFilename: result.originalFilename,
    };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteMediaFromS3 = async (s3Key) => {
  try {
    const result = await deleteFromS3(s3Key);
    return result;
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ Cloudflare HLS Video ============

export const uploadVideoToCloudflare = async (file, videoTitle) => {
  try {
    if (!cloudflareConfig.apiToken || !cloudflareConfig.accountId) {
      return {
        success: false,
        error: 'Cloudflare credentials not configured',
      };
    }

    console.log(`🎬 Uploading to Cloudflare Stream: ${videoTitle}`);

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream`;

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('meta', JSON.stringify({ name: videoTitle }));

    const response = await axios.post(`${baseUrl}`, formData, {
      headers: {
        'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
        ...formData.getHeaders?.(),
      },
      maxContentLength: 5 * 1024 * 1024 * 1024, // 5GB
    });

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.errors?.[0]?.message || 'Cloudflare upload failed',
      };
    }

    const videoData = response.data.result;

    return {
      success: true,
      provider: 'cloudflare',
      cloudflareId: videoData.uid,
      url: `https://watch.cloudflarestream.com/${videoData.uid}`,
      hlsPlaylistUrl: videoData.preview,
      thumbnailUrl: videoData.thumbnail,
      duration: videoData.duration,
      metadata: {
        duration: videoData.duration,
        status: videoData.status,
      },
    };
  } catch (error) {
    console.error('❌ Cloudflare upload error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message,
    };
  }
};

export const deleteVideoFromCloudflare = async (cloudflareId) => {
  try {
    if (!cloudflareConfig.apiToken || !cloudflareConfig.accountId) {
      return {
        success: false,
        error: 'Cloudflare credentials not configured',
      };
    }

    console.log(`🗑️  Deleting from Cloudflare Stream: ${cloudflareId}`);

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream/${cloudflareId}`;

    await axios.delete(baseUrl, {
      headers: {
        'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Cloudflare delete error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get Cloudflare video metadata
 */
export const getCloudflareVideoMetadata = async (cloudflareId) => {
  try {
    if (!cloudflareConfig.apiToken || !cloudflareConfig.accountId) {
      return {
        success: false,
        error: 'Cloudflare credentials not configured',
      };
    }

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream/${cloudflareId}`;

    const response = await axios.get(baseUrl, {
      headers: {
        'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
      },
    });

    if (!response.data.success) {
      return {
        success: false,
        error: 'Failed to fetch video metadata',
      };
    }

    const videoData = response.data.result;

    return {
      success: true,
      metadata: {
        duration: videoData.duration,
        width: videoData.width,
        height: videoData.height,
        status: videoData.status,
        created: videoData.created,
      },
    };
  } catch (error) {
    console.error('❌ Cloudflare metadata error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ YouTube Video ============

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (direct ID)
 */
export const extractYouTubeId = (url) => {
  try {
    // Direct ID
    if (url && url.length === 11 && !url.includes('/')) {
      return url;
    }

    // YouTube URLs
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url?.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('❌ YouTube ID extraction error:', error);
    return null;
  }
};

/**
 * Validate YouTube URL and extract metadata
 */
export const validateYouTubeVideo = async (youtubeUrl) => {
  try {
    const videoId = extractYouTubeId(youtubeUrl);

    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL or video ID',
      };
    }

    console.log(`🎥 Validating YouTube video: ${videoId}`);

    return {
      success: true,
      provider: 'youtube',
      videoId,
      url: youtubeUrl,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbUrl480: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      thumbUrl120: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    };
  } catch (error) {
    console.error('❌ YouTube validation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ Unified Upload Handler ============

/**
 * Upload media with automatic provider selection
 * @param {Object} file - Multer file object or { url, type } for external
 * @param {string} mediaType - Type of media: 'image', 'video', 'document'
 * @param {string} provider - Provider: 's3', 'cloudflare', 'youtube'
 * @param {string} title - Video title (for Cloudflare/YouTube)
 */
export const uploadMedia = async (
  file,
  mediaType,
  provider = 's3',
  title = null
) => {
  try {
    console.log(`\n🎯 Uploading ${mediaType} to ${provider}`);

    switch (provider) {
      case 'cloudflare': {
        if (!['video', 'audio'].includes(mediaType)) {
          return {
            success: false,
            error: `Cloudflare only supports video/audio, got ${mediaType}`,
          };
        }

        const result = await uploadVideoToCloudflare(
          file,
          title || file.originalname
        );
        return result;
      }

      case 'youtube': {
        if (!file.url) {
          return {
            success: false,
            error: 'YouTube requires URL input',
          };
        }

        const result = await validateYouTubeVideo(file.url);
        return result;
      }

      case 's3':
      default: {
        // S3 is default for all file types
        const result = await uploadMediaToS3(
          file,
          file.originalname,
          file.mimetype
        );
        return result;
      }
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete media from provider
 */
export const deleteMedia = async (provider, storageKey, cloudflareId) => {
  try {
    console.log(`🗑️  Deleting ${provider} media`);

    switch (provider) {
      case 'cloudflare':
        return await deleteVideoFromCloudflare(cloudflareId);

      case 'youtube':
        // YouTube videos are external, nothing to delete on our side
        return { success: true };

      case 's3':
      default:
        return await deleteMediaFromS3(storageKey);
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  uploadMediaToS3,
  deleteMediaFromS3,
  uploadVideoToCloudflare,
  deleteVideoFromCloudflare,
  getCloudflareVideoMetadata,
  extractYouTubeId,
  validateYouTubeVideo,
  uploadMedia,
  deleteMedia,
};
