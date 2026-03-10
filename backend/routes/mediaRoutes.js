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
  upload.single('file'),
  uploadMedia
);

router.put('/:mediaId', updateMedia);
router.delete('/:mediaId', deleteMedia);

export default router;
