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
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Protected routes
router.use(authMiddleware);

// Media library routes
router.get('/', getMediaLibrary);

// Upload endpoint supports:
// 1. File upload (multipart/form-data with 'file' field)
//    - provider: 's3' (default), 'cloudflare' (for videos), 'youtube'
// 2. YouTube URL (JSON with 'videoUrl' field)
//    - provider: 'youtube'
router.post(
  '/upload',
  (req, res, next) => {
    // Skip multer if it's a YouTube URL upload
    if (req.body.provider === 'youtube' && req.body.videoUrl) {
      return next();
    }
    // Otherwise process file upload
    upload.single('file')(req, res, next);
  },
  uploadMedia
);

router.put('/:mediaId', updateMedia);
router.delete('/:mediaId', deleteMedia);

export default router;
