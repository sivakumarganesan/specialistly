import MediaLibrary from '../models/MediaLibrary.js';
import Website from '../models/Website.js';
import { uploadToS3, deleteFromS3 } from '../services/s3Service.js';

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

// Upload media file
export const uploadMedia = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const specialistId = req.user.id;

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

    // Upload to S3
    const s3Key = `media/${specialistId}/${websiteId}/${Date.now()}-${req.file.originalname}`;
    const uploadResult = await uploadToS3(req.file, s3Key);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Upload failed',
      });
    }

    // Create media entry
    const media = new MediaLibrary({
      specialistId,
      websiteId,
      filename: uploadResult.filename,
      originalName: req.file.originalname,
      fileType,
      mimeType,
      url: uploadResult.url,
      size: req.file.size,
      storageProvider: 's3',
      storageKey: s3Key,
      metadata: req.body.metadata || {},
    });

    if (req.body.tags) {
      media.tags = req.body.tags.split(',').map(t => t.trim());
    }

    if (req.body.alt) {
      media.alt = req.body.alt;
    }

    await media.save();

    res.status(201).json({
      success: true,
      data: media,
      message: 'Media uploaded successfully',
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

    // Delete from S3
    if (media.storageProvider === 's3') {
      await deleteFromS3(media.storageKey);
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
