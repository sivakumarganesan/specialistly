import MediaLibrary from '../models/MediaLibrary.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * PUBLIC endpoint to serve media files
 * This proxies R2 images to bypass the private bucket authentication
 */
export const serveMedia = async (req, res) => {
  try {
    console.log(`[serveMedia] Request for media: ${req.params.mediaId}`);
    const { mediaId } = req.params;

    // Get media from database
    const media = await MediaLibrary.findById(mediaId);
    if (!media || media.isDeleted) {
      console.error(`[serveMedia] Media not found: ${mediaId}`);
      return res.status(404).json({
        success: false,
        message: 'Media not found',
      });
    }

    console.log(`[serveMedia] Found media: ${media._id}, provider: ${media.storageProvider}`);

    // If it's a YouTube video, redirect to the embed URL
    if (media.storageProvider === 'youtube' && media.embedUrl) {
      console.log(`[serveMedia] Redirecting to YouTube embed URL`);
      return res.redirect(media.embedUrl);
    }

    // For R2 stored images, download and serve them with proper auth
    if (media.storageProvider === 'r2') {
      try {
        let key = media.storageKey;
        
        // If no storageKey, try to extract from metadata or URL
        if (!key) {
          console.log('📝 No storageKey found, attempting to extract from metadata or construct');
          // Try to extract from original upload metadata if available
          if (media.metadata?.key) {
            key = media.metadata.key;
          } else if (media.url && media.url.includes('.r2.cloudflarestorage.com/')) {
            // Last resort: try to extract from the full URL
            const urlParts = media.url.split('.r2.cloudflarestorage.com/');
            if (urlParts.length === 2) {
              key = urlParts[1];
            }
          }
        }
        
        if (!key) {
          console.error('[serveMedia] Cannot determine R2 storage key');
          return res.status(400).json({
            success: false,
            message: 'Cannot determine R2 storage key for this media',
          });
        }
        
        console.log(`[serveMedia] Downloading R2 media with key: ${key}`);
        
        // Create R2 client for this request
        const r2 = new S3Client({
          region: 'auto',
          credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
          },
          endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        });

        const command = new GetObjectCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
          Key: key,
        });

        const response = await r2.send(command);

        // Set proper headers for cross-origin access
        res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin access
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Stream directly from R2
        console.log(`✅ Streaming R2 media: ${key}`);
        
        if (response.Body && typeof response.Body.pipe === 'function') {
          // It's a readable stream, pipe it directly to response
          response.Body.pipe(res);
          response.Body.on('error', (error) => {
            console.error('[serveMedia] Stream error:', error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: 'Error streaming media',
              });
            }
          });
          // Return after streaming starts
          return;
        } else if (response.Body) {
          // Handle as buffer or async iterable
          try {
            const chunks = [];
            if (response.Body[Symbol.asyncIterator]) {
              for await (const chunk of response.Body) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
            } else if (Buffer.isBuffer(response.Body)) {
              chunks.push(response.Body);
            } else {
              chunks.push(Buffer.from(response.Body));
            }
            const buffer = Buffer.concat(chunks);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
            return;
          } catch (chunkError) {
            console.error('[serveMedia] Error reading response body:', chunkError);
            res.status(500).json({
              success: false,
              message: 'Error reading media from storage',
            });
            return;
          }
        } else {
          throw new Error('No body in R2 response');
        }
      } catch (error) {
        console.error('[serveMedia] Failed to download from R2:', error);
        // If download fails, return error
        return res.status(500).json({
          success: false,
          message: 'Failed to download media from storage',
          error: error.message,
        });
      }
    }

    // For other providers (Cloudflare Stream, YouTube, etc.), redirect to the URL
    console.log(`[serveMedia] Redirecting to URL for provider ${media.storageProvider}: ${media.url}`);
    return res.redirect(media.url);
  } catch (error) {
    console.error('Serve media error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
