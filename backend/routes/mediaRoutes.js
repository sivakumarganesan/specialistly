import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
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
router.use(protect);

// Media library routes
router.get('/', getMediaLibrary);
router.post('/upload', upload.single('file'), uploadMedia);
router.put('/:mediaId', updateMedia);
router.delete('/:mediaId', deleteMedia);

export default router;
