import MediaLibrary from '../models/MediaLibrary.js';
import Website from '../models/Website.js';
import {
  uploadMedia as uploadMediaProvider,
  deleteMedia as deleteMediaProvider,
  uploadVideoToCloudflare,
  validateYouTubeVideo,
} from '../services/cloudflareMediaService.js';

// Get all media for a website
export const getMediaLibrary = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const specialistId = req.user.id || req.user.userId || req.user._id || req.user.sub;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Check ownership: specialistId match OR email match (for legacy websites)
    const websiteSpecialistId = website.specialistId?.toString() || website.specialistId;
    const userSpecialistId = specialistId?.toString ? specialistId.toString() : String(specialistId);
    const emailMatch = website.creatorEmail === req.user.email;
    const idMatch = websiteSpecialistId === userSpecialistId;

    if (!idMatch && !emailMatch) {
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
    const { provider = 'cloudflare', videoUrl, title } = req.body;
    
    // Extract user ID - check all possible property names from JWT payload
    const specialistId = req.user?.id || req.user?.userId || req.user?._id || req.user?.sub;

    console.log(`📤 Upload media request: websiteId=${websiteId}, provider=${provider}`);
    console.log(`📄 Auth details:`, {
      hasUser: !!req.user,
      userObject: req.user ? JSON.stringify(req.user) : 'NO USER OBJECT',
      userKeys: req.user ? Object.keys(req.user).join(', ') : 'no keys',
      extractedIds: {
        id: req.user?.id,
        userId: req.user?.userId,
        _id: req.user?._id,
        sub: req.user?.sub,
      },
      finalSpecialistId: specialistId,
    });

    // Check authentication
    if (!specialistId) {
      console.error('❌ Authentication failed - no user ID found');
      console.error('   Full req.user object:', req.user);
      console.error('   Authorization header:', req.headers.authorization?.substring(0, 50) + '...');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated. No valid user ID in token.',
        debug: {
          hasUser: !!req.user,
          userKeys: req.user ? Object.keys(req.user) : [],
        },
      });
    }

    // Validate provider
    const allowedProviders = ['cloudflare', 'youtube'];
    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider: ${provider}. Allowed: ${allowedProviders.join(', ')}`,
      });
    }

    // For YouTube: URL is provided
    if (provider === 'youtube' && videoUrl) {
      // Verify website ownership
      const website = await Website.findById(websiteId);
      if (!website) {
        return res.status(404).json({
          success: false,
          message: 'Website not found',
        });
      }

      // Check ownership: specialistId match OR email match (for legacy websites)
      const websiteSpecialistId = website.specialistId?.toString() || website.specialistId;
      const userSpecialistId = specialistId?.toString ? specialistId.toString() : String(specialistId);
      const emailMatch = website.creatorEmail === req.user.email;
      const idMatch = websiteSpecialistId === userSpecialistId;

      if (!idMatch && !emailMatch) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized - You do not own this website',
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
      console.error('❌ No file in request');
      console.log('Request keys:', Object.keys(req));
      console.log('Body keys:', Object.keys(req.body || {}));
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please upload a file using multipart/form-data format.',
      });
    }

    // Validate file object structure
    if (!req.file.buffer) {
      console.error('❌ File buffer is missing', {
        fileKeys: Object.keys(req.file),
        fileSize: req.file.size,
        originalname: req.file.originalname,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid file format - file buffer is missing.',
      });
    }

    if (!req.file.mimetype) {
      console.error('❌ File mimetype is missing');
      return res.status(400).json({
        success: false,
        message: 'Invalid file format - mimetype is missing.',
      });
    }

    console.log('📄 File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length,
    });

    // Verify website ownership
    console.log(`🔑 Finding website with ID: ${websiteId} (type: ${typeof websiteId})`);
    const website = await Website.findById(websiteId);
    
    console.log(`📊 Website query result:`, {
      found: !!website,
      website: website ? {
        _id: website._id,
        creatorEmail: website.creatorEmail,
        specialistId: website.specialistId,
        name: website.name,
      } : null,
    });
    
    if (!website) {
      console.error(`❌ Website not found: ${websiteId}`);
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Compare specialist IDs - handle both string and ObjectId formats
    const websiteSpecialistId = website.specialistId?.toString() || website.specialistId;
    const userSpecialistId = specialistId?.toString ? specialistId.toString() : String(specialistId);
    
    // Check for email match (fallback for legacy websites created before specialistId was added)
    const emailMatch = website.creatorEmail === req.user.email;
    const idMatch = websiteSpecialistId === userSpecialistId;

    console.log('🔐 Full Ownership check details:', {
      websiteId,
      websiteExists: !!website,
      websiteSpecialistId: websiteSpecialistId,
      websiteSpecialistIdType: typeof websiteSpecialistId,
      websiteCreatorEmail: website.creatorEmail,
      userSpecialistId: userSpecialistId,
      userSpecialistIdType: typeof userSpecialistId,
      userEmail: req.user.email,
      idMatch: idMatch,
      emailMatch: emailMatch,
      jwtUser: req.user,
    });

    // Allow if either specialistId matches OR email matches (for legacy websites)
    if (!idMatch && !emailMatch) {
      console.error(`❌ Ownership check FAILED`);
      console.error(`   Website ID match: ${idMatch}`);
      console.error(`   Website email match: ${emailMatch}`);
      console.error(`   ✅ SOLUTION: Log in with the account that created this website`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - You do not own this website',
        debug: {
          websiteSpecialistId,
          userSpecialistId,
          websiteCreatorEmail: website.creatorEmail,
          userEmail: req.user.email,
          websiteId,
        },
      });
    }
    
    console.log('✅ Ownership check PASSED - User owns this website');
    console.log(`   Match type: ${idMatch ? 'specialistId' : 'email (legacy)'}`);

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

    console.log(`🎯 Uploading ${fileType} (${mimeType}) to ${provider}`);

    // Upload to selected provider
    const uploadResult = await uploadMediaProvider(
      req.file,
      fileType,
      provider,
      title || req.file.originalname
    );

    if (!uploadResult?.success) {
      console.error('❌ Upload provider failed:', uploadResult?.error || 'Unknown error');
      return res.status(500).json({
        success: false,
        message: uploadResult?.error || 'Upload failed',
      });
    }

    console.log('✅ Upload successful:', {
      provider: uploadResult.provider,
      url: uploadResult.url,
    });

    console.log('✅ Upload successful:', {
      provider: uploadResult.provider,
      url: uploadResult.url,
    });

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
    console.error('❌ Upload media error:', {
      message: error.message,
      stack: error.stack,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      } : null,
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload media',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    const deleteResult = await deleteMediaProvider(
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
