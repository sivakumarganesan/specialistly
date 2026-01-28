import express from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addPurchaseToCustomer,
} from '../controllers/customerController.js';

const router = express.Router();

// Customer routes
router.post('/', createCustomer);
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.post('/:customerId/purchases', addPurchaseToCustomer);

export default router;
