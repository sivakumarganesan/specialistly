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
    // Allow video files for Cloudflare HLS
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Only video files are supported.`), false);
    }
  },
});

// Protected routes
router.use(authMiddleware);

// Media library routes
router.get('/', getMediaLibrary);

// Upload endpoint supports:
// 1. File upload (multipart/form-data with 'file' field)
//    - provider: 'cloudflare' (default, for HLS video)
// 2. YouTube URL (JSON with 'videoUrl' field)
//    - provider: 'youtube'
router.post(
  '/upload',
  (req, res, next) => {
    // Skip multer if it's a YouTube URL upload
    if (req.body.provider === 'youtube' && req.body.videoUrl) {
      return next();
    }
    // Otherwise process file upload (Cloudflare)
    upload.single('file')(req, res, next);
  },
  uploadMedia
);

router.put('/:mediaId', updateMedia);
router.delete('/:mediaId', deleteMedia);

export default router;
