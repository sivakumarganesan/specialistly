import express from 'express';
import {
  saveCreatorProfile,
  getCreatorProfile,
  getAllCreatorProfiles,
  updateCreatorAvailability,
  deleteCreatorProfile,
  getAllSpecialists,
} from '../controllers/creatorController.js';

const router = express.Router();

// Creator profile routes
router.post('/', saveCreatorProfile);
router.get('/specialists/all', getAllSpecialists);
router.get('/', getAllCreatorProfiles);
router.get('/:email', getCreatorProfile);
router.put('/:email/availability', updateCreatorAvailability);
router.delete('/:id', deleteCreatorProfile);

export default router;
