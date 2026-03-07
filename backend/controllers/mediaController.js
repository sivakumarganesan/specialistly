import MediaLibrary from '../models/MediaLibrary.js';
import Website from '../models/Website.js';
import {
  uploadMedia: uploadMediaToProvider,
  deleteMedia: deleteMediaFromProvider,
  uploadMediaToS3,
  uploadVideoToCloudflare,
  validateYouTubeVideo,
} from '../services/unifiedMediaService.js';

// Get all media for a website
export const getMediaLibrary = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const media = await MediaLibrary.find({
      websiteId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error('Get media library error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload media file or video
export const uploadMedia = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { provider = 's3', videoUrl, title } = req.body;
    const specialistId = req.user.id;

    // For YouTube: URL is provided
    if (provider === 'youtube' && videoUrl) {
      // Verify website ownership
      const website = await Website.findById(websiteId);
      if (!website || website.specialistId.toString() !== specialistId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Validate YouTube URL
      const youtubeResult = await validateYouTubeVideo(videoUrl);
      if (!youtubeResult.success) {
        return res.status(400).json({
          success: false,
          message: youtubeResult.error,
        });
      }

      // Create media entry
      const media = new MediaLibrary({
        specialistId,
        websiteId,
        filename: youtubeResult.videoId,
        originalName: title || youtubeResult.videoId,
        fileType: 'video',
        mimeType: 'video/youtube',
        url: youtubeResult.embedUrl,
        thumbnailUrl: youtubeResult.thumbnailUrl,
        storageProvider: 'youtube',
        youtubeVideoId: youtubeResult.videoId,
        embedUrl: youtubeResult.embedUrl,
        metadata: {
          source: 'youtube',
        },
      });

      if (req.body.tags) {
        media.tags = req.body.tags.split(',').map(t => t.trim());
      }

      if (req.body.alt) {
        media.alt = req.body.alt;
      }

      await media.save();

      return res.status(201).json({
        success: true,
        data: media,
        message: 'YouTube video added successfully',
      });
    }

    // For file uploads (S3 or Cloudflare)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Determine file type
    const mimeType = req.file.mimetype;
    let fileType = 'document';

    if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else if (mimeType.startsWith('video/')) {
      fileType = 'video';
    } else if (mimeType.startsWith('audio/')) {
      fileType = 'audio';
    }

    // Upload to selected provider
    const uploadResult = await uploadMediaToProvider(
      req.file,
      fileType,
      provider,
      title || req.file.originalname
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: uploadResult.error || 'Upload failed',
      });
    }

    // Create media entry
    const media = new MediaLibrary({
      specialistId,
      websiteId,
      filename: uploadResult.filename || req.file.originalname,
      originalName: req.file.originalname,
      fileType,
      mimeType,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl || null,
      size: req.file.size,
      storageProvider: uploadResult.provider,
      storageKey: uploadResult.key || null,
      cloudflareId: uploadResult.cloudflareId || null,
      cloudflarePlaylistUrl: uploadResult.hlsPlaylistUrl || null,
      metadata: {
        ...uploadResult.metadata,
        uploadedVia: uploadResult.provider,
      },
    });

    if (req.body.tags) {
      media.tags = req.body.tags.split(',').map(t => t.trim());
    }

    if (req.body.alt) {
      media.alt = req.body.alt;
    }

    if (req.body.description) {
      media.description = req.body.description;
    }

    await media.save();

    res.status(201).json({
      success: true,
      data: media,
      message: `Media uploaded successfully via ${uploadResult.provider.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update media metadata
export const updateMedia = async (req, res) => {
  try {
    const { websiteId, mediaId } = req.params;
    const specialistId = req.user.id;
    const { alt, tags, description } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const media = await MediaLibrary.findById(mediaId);
    if (!media || media.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Media not found',
      });
    }

    if (alt) media.alt = alt;
    if (description) media.description = description;
    if (tags) media.tags = tags;

    await media.save();

    res.json({
      success: true,
      data: media,
      message: 'Media updated successfully',
    });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete media
export const deleteMedia = async (req, res) => {
  try {
    const { websiteId, mediaId } = req.params;
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const media = await MediaLibrary.findById(mediaId);
    if (!media || media.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Media not found',
      });
    }

    // Delete from appropriate provider
    const deleteResult = await deleteMediaFromProvider(
      media.storageProvider,
      media.storageKey,
      media.cloudflareId
    );

    if (!deleteResult.success) {
      console.warn(
        `Warning: Failed to delete from ${media.storageProvider}: ${deleteResult.error}`
      );
      // Continue with soft delete even if provider deletion fails
    }

    // Soft delete
    media.isDeleted = true;
    await media.save();

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
