import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getMediaLibrary,
  uploadMedia,
  updateMedia,
  deleteMedia,
} from '../controllers/mediaController.js';

const router = express.Router({ mergeParams: true });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB for Cloudflare Stream
  },
  fileFilter: (req, file, cb) => {
    // Allow both image and video files
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Only image and video files are supported.`), false);
    }
  },
});

// Protected routes
router.use(authMiddleware);

// Media library routes
router.get('/', getMediaLibrary);

// Upload endpoint supports:
// 1. File upload (multipart/form-data with 'file' field)
//    - For images and videos
// 2. YouTube URL (JSON with 'videoUrl' field)
//    - provider: 'youtube'
router.post(
  '/upload',
  (req, res, next) => {
    // For YouTube URL uploads, skip multer
    if ((req.headers['content-type'] || '').includes('application/json')) {
      console.log('📹 YouTube URL upload detected, skipping multer');
      return next();
    }
    
    // For file uploads, use multer
    console.log('📤 File upload detected, processing with multer');
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err.message);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  },
  uploadMedia
);

router.put('/:mediaId', updateMedia);
router.delete('/:mediaId', deleteMedia);

export default router;
