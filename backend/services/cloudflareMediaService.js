import dotenv from 'dotenv';
import cloudflareConfig from '../config/cloudflareConfig.js';
import axios from 'axios';

dotenv.config();

/**
 * Simplified Media Service - Cloudflare HLS + YouTube
 * Supports:
 * 1. Cloudflare Stream - HLS video streaming (primary)
 * 2. YouTube - Embedded video links (secondary)
 */

// ============ Cloudflare HLS Video ============

export const uploadVideoToCloudflare = async (file, videoTitle) => {
  try {
    if (!cloudflareConfig.apiToken || !cloudflareConfig.accountId) {
      console.error('❌ Cloudflare credentials not configured');
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
      console.error('❌ Cloudflare upload error:', response.data.errors);
      return {
        success: false,
        error: response.data.errors?.[0]?.message || 'Cloudflare upload failed',
      };
    }

    const videoData = response.data.result;
    console.log('✅ Cloudflare upload successful:', videoData.uid);

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
        uploadedVia: 'cloudflare',
      },
    };
  } catch (error) {
    console.error('❌ Cloudflare upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload video to Cloudflare',
    };
  }
};

export const deleteVideoFromCloudflare = async (cloudflareId) => {
  try {
    if (!cloudflareConfig.apiToken || !cloudflareConfig.accountId) {
      console.warn('⚠️ Cloudflare credentials not configured, skipping deletion');
      return { success: true };
    }

    console.log(`🗑️ Deleting Cloudflare video: ${cloudflareId}`);

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream/${cloudflareId}`;

    const response = await axios.delete(baseUrl, {
      headers: {
        'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
      },
    });

    if (!response.data.success) {
      console.warn('⚠️ Cloudflare deletion failed:', response.data.errors);
      return {
        success: false,
        error: response.data.errors?.[0]?.message || 'Deletion failed',
      };
    }

    console.log('✅ Cloudflare deletion successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Cloudflare deletion error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCloudflareVideoMetadata = async (cloudflareId) => {
  try {
    if (!cloudflareConfig.apiToken || !cloudflareConfig.accountId) {
      return { success: false, error: 'Cloudflare credentials not configured' };
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
        error: response.data.errors?.[0]?.message || 'Failed to get metadata',
      };
    }

    const videoData = response.data.result;
    return {
      success: true,
      duration: videoData.duration,
      status: videoData.status,
      thumbnail: videoData.thumbnail,
      hlsUrl: videoData.preview,
    };
  } catch (error) {
    console.error('❌ Metadata fetch error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ YouTube Video ============

export const extractYouTubeId = (url) => {
  if (!url) return null;

  // Handle direct ID
  if (url.length === 11 && !url.includes('/')) {
    return url;
  }

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const validateYouTubeVideo = (youtubeUrl) => {
  try {
    console.log(`📺 Validating YouTube URL: ${youtubeUrl}`);

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL format',
      };
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    console.log('✅ YouTube validation successful:', videoId);

    return {
      success: true,
      provider: 'youtube',
      videoId,
      embedUrl,
      url: embedUrl,
      thumbnailUrl,
      metadata: {
        uploadedVia: 'youtube',
      },
    };
  } catch (error) {
    console.error('❌ YouTube validation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate YouTube video',
    };
  }
};

// ============ Unified Upload ============

/**
 * Upload media to appropriate provider
 * @param {Object} file - Multer file object or { url } for external
 * @param {string} mediaType - Type of media: 'video'
 * @param {string} provider - Provider: 'cloudflare' or 'youtube'
 * @param {string} title - Video title
 */
export const uploadMedia = async (
  file,
  mediaType,
  provider = 'cloudflare',
  title = null
) => {
  try {
    console.log(`\n🎯 Uploading ${mediaType} to ${provider}`);

    switch (provider) {
      case 'cloudflare': {
        if (!file) {
          return {
            success: false,
            error: 'No file provided for Cloudflare upload',
          };
        }
        return await uploadVideoToCloudflare(file, title || file.originalname);
      }

      case 'youtube': {
        if (!file.url && !file.videoUrl) {
          return {
            success: false,
            error: 'No YouTube URL provided',
          };
        }
        return await validateYouTubeVideo(file.url || file.videoUrl);
      }

      default:
        return {
          success: false,
          error: `Unknown provider: ${provider}`,
        };
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
    console.log(`🗑️ Deleting ${provider} media`);

    switch (provider) {
      case 'cloudflare':
        return await deleteVideoFromCloudflare(cloudflareId);

      case 'youtube':
        // YouTube videos are external, nothing to delete on our side
        return { success: true };

      default:
        return {
          success: false,
          error: `Unknown provider: ${provider}`,
        };
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
  uploadVideoToCloudflare,
  deleteVideoFromCloudflare,
  getCloudflareVideoMetadata,
  extractYouTubeId,
  validateYouTubeVideo,
  uploadMedia,
  deleteMedia,
};
