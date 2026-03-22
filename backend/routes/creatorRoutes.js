import express from 'express';
import {
  saveCreatorProfile,
  getCreatorProfile,
  getAllCreatorProfiles,
  updateCreatorAvailability,
  deleteCreatorProfile,
  getAllSpecialists,
  getCreatorById,
  getAllCategories,
  updateSpecialityCategories,
  getSpecialistCategories,
  getSpecialistsByCategory,
} from '../controllers/creatorController.js';

const router = express.Router();

// Creator profile routes
router.post('/', saveCreatorProfile);
router.get('/specialists/all', getAllSpecialists);
router.get('/id/:id', getCreatorById);
router.get('/', getAllCreatorProfiles);
router.get('/:email', getCreatorProfile);
router.put('/:email/availability', updateCreatorAvailability);
router.delete('/:id', deleteCreatorProfile);

// Speciality categories routes
router.get('/categories/all', getAllCategories);  // Get all predefined categories
router.get('/categories/specialist/:email', getSpecialistCategories);  // Get specialist's categories
router.put('/categories/specialist/:email', updateSpecialityCategories);  // Update specialist's categories
router.get('/categories/filter/:category', getSpecialistsByCategory);  // Get specialists by category

export default router;
