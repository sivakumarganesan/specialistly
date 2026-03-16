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
   * Get TUS upload URL for client-side resumable upload
   * Allows frontend to upload directly to Cloudflare via TUS protocol
   */
  async getUploadToken(videoMetadata = {}) {
    try {
      console.log('[Cloudflare] Requesting TUS upload URL...');
      const fileSize = videoMetadata.fileSize || 0;

      // TUS: POST to stream endpoint with Tus-Resumable header
      const tusHeaders = {
        ...this.headers,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(fileSize),
      };

      // Add metadata as base64-encoded Upload-Metadata header
      const metaParts = [];
      if (videoMetadata.title) {
        metaParts.push(`name ${Buffer.from(videoMetadata.title).toString('base64')}`);
      }
      if (videoMetadata.fileName) {
        metaParts.push(`filename ${Buffer.from(videoMetadata.fileName).toString('base64')}`);
      }
      metaParts.push(`maxDurationSeconds ${Buffer.from('3600').toString('base64')}`);
      if (metaParts.length > 0) {
        tusHeaders['Upload-Metadata'] = metaParts.join(',');
      }

      console.log('[Cloudflare] TUS URL:', `${this.baseUrl}?direct_user=true`);

      const response = await axios.post(
        `${this.baseUrl}?direct_user=true`,
        null,
        {
          headers: tusHeaders,
          validateStatus: () => true,
          maxRedirects: 0,
        }
      );

      console.log('[Cloudflare] TUS Response Status:', response.status);
      console.log('[Cloudflare] TUS Location Header:', response.headers?.location);

      // Cloudflare returns 201 with Location header for TUS
      if (response.status !== 201 && response.status !== 200) {
        console.error('[Cloudflare] TUS Response Data:', JSON.stringify(response.data, null, 2));
        throw new Error(response.data?.errors?.[0]?.message || `TUS create failed with status ${response.status}`);
      }

      const tusUploadUrl = response.headers?.location;
      // Extract stream ID from the location URL or response
      const streamId = response.headers?.['stream-media-id'] || tusUploadUrl?.split('/').pop() || response.data?.result?.uid;

      if (!tusUploadUrl) {
        throw new Error('No TUS upload URL returned from Cloudflare');
      }

      return {
        success: true,
        uploadUrl: tusUploadUrl,
        videoId: streamId,
        expiresIn: 3600,
      };
    } catch (error) {
      console.error('[Cloudflare] ERROR getting TUS upload URL:');
      console.error('  Status Code:', error.response?.status);
      console.error('  Full Error:', error.message);

      const errorDetails = error.response?.data?.errors?.[0]?.message || error.message;
      throw new Error(`Failed to get upload URL: ${errorDetails}`);
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
