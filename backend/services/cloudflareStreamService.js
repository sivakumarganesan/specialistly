/**
 * Cloudflare Stream API Service
 * Handles video uploads, retrieval, and management
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import cloudflareConfig from '../config/cloudflareConfig.js';

class CloudflareStreamService {
  constructor() {
    this.baseUrl = cloudflareConfig.baseUrl;
    this.headers = {
      'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
    };
  }

  /**
   * Upload video from file path (local file upload)
   * Supports: MP4, WebM, MOV
   * Max size: 5GB
   */
  async uploadVideoFromFile(filePath, videoMetadata = {}) {
    try {
      const fileStream = fs.createReadStream(filePath);
      const formData = new FormData();
      
      formData.append('file', fileStream);
      
      // Add metadata
      if (videoMetadata.title) {
        formData.append('meta', JSON.stringify({
          name: videoMetadata.title,
        }));
      }

      const response = await axios.post(
        `${this.baseUrl}/direct_upload`,
        formData,
        {
          headers: {
            ...this.headers,
            ...formData.getHeaders(),
          },
          maxContentLength: 5 * 1024 * 1024 * 1024, // 5GB
          maxBodyLength: 5 * 1024 * 1024 * 1024,
        }
      );

      return {
        success: true,
        videoId: response.data?.result?.uid,
        playbackUrl: response.data?.result?.playback?.hls,
        dashUrl: response.data?.result?.playback?.dash,
        thumbnail: response.data?.result?.thumbnail,
        duration: response.data?.result?.duration,
      };
    } catch (error) {
      console.error('Error uploading video to Cloudflare Stream:', error);
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }

  /**
   * Get direct upload token (client-side upload)
   * Allows frontend to upload directly to Cloudflare
   */
  async getUploadToken(videoMetadata = {}) {
    try {
      console.log('[Cloudflare] Requesting upload token...');
      console.log('[Cloudflare] API Base URL:', this.baseUrl);
      console.log('[Cloudflare] Account ID:', this.baseUrl.includes('accounts') ? 'Set' : 'Missing');
      console.log('[Cloudflare] Authorization Header Present:', !!this.headers['Authorization']);
      
      // Cloudflare Stream direct_upload endpoint expects camelCase field names
      // Required: maxDurationSeconds
      const requestBody = {
        maxDurationSeconds: 3600, // 1 hour max duration
      };
      
      // Optional: add metadata if title is provided
      if (videoMetadata.title) {
        requestBody.meta = { name: videoMetadata.title };
      }
      
      console.log('[Cloudflare] Request Body:', JSON.stringify(requestBody));
      console.log('[Cloudflare] Full URL:', `${this.baseUrl}/direct_upload`);
      
      const response = await axios.post(
        `${this.baseUrl}/direct_upload`,
        requestBody,
        { 
          headers: this.headers,
          validateStatus: () => true // Accept any status to see full response
        }
      );

      console.log('[Cloudflare] Response Status:', response.status);
      console.log('[Cloudflare] Response Data:', JSON.stringify(response.data, null, 2));
      
      if (response.status !== 200) {
        throw new Error(response.data?.errors?.[0]?.message || 'Upload token request failed');
      }

      return {
        success: true,
        uploadUrl: response.data?.result?.uploadURL,
        videoId: response.data?.result?.uid,
        expiresIn: 3600,
      };
    } catch (error) {
      console.error('[Cloudflare] ERROR getting upload token:');
      console.error('  Status Code:', error.response?.status);
      console.error('  Status Text:', error.response?.statusText);
      console.error('  URL:', error.config?.url);
      console.error('  Request Body:', error.config?.data);
      console.error('  Cloudflare Response:', JSON.stringify(error.response?.data, null, 2));
      console.error('  Full Error:', error.message);
      
      const errorDetails = error.response?.data?.errors?.[0]?.message || error.message;
      throw new Error(`Failed to get upload token: ${errorDetails}`);
    }
  }

  /**
   * Get video details by ID
   */
  async getVideoDetails(videoId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${videoId}`,
        { headers: this.headers }
      );

      const video = response.data?.result;
      console.log(`[CloudflareStream] getVideoDetails response for ${videoId}:`, JSON.stringify({
        uid: video?.uid,
        status: video?.status,
        playback: video?.playback,
        thumbnail: video?.thumbnail,
        duration: video?.duration,
      }, null, 2));

      return {
        success: true,
        videoId: video?.uid,
        title: video?.meta?.name || 'Untitled',
        duration: video?.duration,
        status: video?.status?.state, // ready, inprogress, error
        hlsPlaybackUrl: video?.playback?.hls,
        dashPlaybackUrl: video?.playback?.dash,
        thumbnail: video?.thumbnail,
        uploaded: video?.uploadedAt,
        size: video?.size,
      };
    } catch (error) {
      console.error('Error getting video details:', error);
      throw new Error(`Failed to get video details: ${error.message}`);
    }
  }

  /**
   * List all videos
   */
  async listVideos(limit = 20, before = null) {
    try {
      const params = new URLSearchParams({
        limit,
      });
      
      if (before) {
        params.append('before', before);
      }

      const response = await axios.get(
        `${this.baseUrl}?${params}`,
        { headers: this.headers }
      );

      const videos = response.data?.result || [];
      return {
        success: true,
        videos: videos.map(video => ({
          videoId: video.uid,
          title: video.meta?.name || 'Untitled',
          duration: video.duration,
          status: video.status?.state,
          hlsPlaybackUrl: video.playback?.hls,
          thumbnail: video.thumbnail,
          uploaded: video.uploadedAt,
        })),
        hasMore: response.data?.result_info?.cursor !== null,
      };
    } catch (error) {
      console.error('Error listing videos:', error);
      throw new Error(`Failed to list videos: ${error.message}`);
    }
  }

  /**
   * Delete video by ID
   */
  async deleteVideo(videoId) {
    try {
      await axios.delete(
        `${this.baseUrl}/${videoId}`,
        { headers: this.headers }
      );

      return {
        success: true,
        message: 'Video deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }

  /**
   * Update video metadata
   */
  async updateVideoMetadata(videoId, metadata) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${videoId}/meta`,
        { name: metadata.title || '' },
        { headers: this.headers }
      );

      return {
        success: true,
        videoId: response.data?.result?.uid,
      };
    } catch (error) {
      console.error('Error updating video metadata:', error);
      throw new Error(`Failed to update video metadata: ${error.message}`);
    }
  }

  /**
   * Get HLS manifest URL (for direct HLS streaming)
   */
  getHlsUrl(videoId) {
    return `${this.baseUrl}/${videoId}/manifest/video.m3u8`;
  }

  /**
   * Get DASH manifest URL
   */
  getDashUrl(videoId) {
    return `${this.baseUrl}/${videoId}/manifest/video.mpd`;
  }
}

export default new CloudflareStreamService();
