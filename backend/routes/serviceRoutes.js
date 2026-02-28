import express from 'express';
import {
  createService,
  createWebinarWithSlots,
  getAllServices,
  getServiceById,
  updateService,
  publishWebinar,
  deleteService,
} from '../controllers/serviceController.js';

const router = express.Router();

// Service routes
router.post('/webinar/create', createWebinarWithSlots); // Must be before generic POST
router.post('/:id/publish', publishWebinar); // Publish draft webinar
router.post('/', createService);
router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
