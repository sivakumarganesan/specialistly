import express from 'express';
import {
  getSubscriptions,
  getSubscriptionByEmail,
  createSubscription,
  updateSubscription,
  updateSubscriptionByEmail,
  deleteSubscription,
  changePlan,
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Get all subscriptions
router.get('/', getSubscriptions);

// Get subscription by email
router.get('/email/:email', getSubscriptionByEmail);

// Create subscription
router.post('/', createSubscription);

// Update subscription by ID
router.put('/:id', updateSubscription);

// Update subscription by email (create if doesn't exist)
router.put('/email/:email', updateSubscriptionByEmail);

// Change plan
router.post('/email/:email/change-plan', changePlan);

// Delete subscription
router.delete('/:id', deleteSubscription);

export default router;
