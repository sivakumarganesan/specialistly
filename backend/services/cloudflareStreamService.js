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
        playbackUrl: response.data?.result?.playback?.hls?.href,
        dashUrl: response.data?.result?.playback?.dash?.href,
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
      const response = await axios.post(
        `${this.baseUrl}/direct_upload`,
        {
          meta: videoMetadata.title ? { name: videoMetadata.title } : {},
          max_duration_seconds: 3600, // 1 hour
          expiry: 3600, // Token expires in 1 hour
        },
        { headers: this.headers }
      );

      return {
        success: true,
        uploadUrl: response.data?.result?.uploadURL,
        videoId: response.data?.result?.uid,
        expiresIn: 3600,
      };
    } catch (error) {
      console.error('Error getting upload token:', error);
      throw new Error(`Failed to get upload token: ${error.message}`);
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
      return {
        success: true,
        videoId: video.uid,
        title: video.meta?.name || 'Untitled',
        duration: video.duration,
        status: video.status?.state, // ready, inprogress, error
        hlsPlaybackUrl: video.playback?.hls?.href,
        dashPlaybackUrl: video.playback?.dash?.href,
        thumbnail: video.thumbnail,
        uploaded: video.uploadedAt,
        size: video.size,
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
          hlsPlaybackUrl: video.playback?.hls?.href,
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
