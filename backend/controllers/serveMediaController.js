import MediaLibrary from '../models/MediaLibrary.js';
import { downloadImageFromR2 } from '../services/cloudflareMediaService.js';

/**
 * PUBLIC endpoint to serve media files
 * This proxies R2 images to bypass the private bucket authentication
 */
export const serveMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;

    // Get media from database
    const media = await MediaLibrary.findById(mediaId);
    if (!media || media.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Media not found',
      });
    }

    // If it's a YouTube video, redirect to the embed URL
    if (media.storageProvider === 'youtube' && media.embedUrl) {
      return res.redirect(media.embedUrl);
    }

    // For R2 stored images, download and serve them with proper auth
    if (media.storageProvider === 'r2' && media.url) {
      try {
        // Extract the key from the full URL
        // URL format: https://{bucket}.{accountId}.r2.cloudflarestorage.com/{key}
        const urlParts = media.url.split('.r2.cloudflarestorage.com/');
        if (urlParts.length !== 2) {
          return res.status(400).json({
            success: false,
            message: 'Invalid R2 URL format',
          });
        }

        const key = urlParts[1];
        console.log(`📥 Downloading R2 media: ${key}`);
        
        const fileData = await downloadImageFromR2(key);

        // Set proper headers
        res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin access

        // Send the file
        console.log(`✅ Serving R2 media: ${key}`);
        res.send(fileData);
      } catch (error) {
        console.error('Failed to download from R2:', error);
        // If download fails, return error
        return res.status(500).json({
          success: false,
          message: 'Failed to download media from storage',
          error: error.message,
        });
      }
    }

    // For other providers (Cloudflare Stream, etc.), redirect to the URL
    res.redirect(media.url);
  } catch (error) {
    console.error('Serve media error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
