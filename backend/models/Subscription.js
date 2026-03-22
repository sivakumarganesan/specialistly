import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  planType: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    default: '₹',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  nextBillingDate: Date,
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'forever'],
    default: 'forever',
  },
  features: [String],
  autoRenew: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Subscription', subscriptionSchema);
