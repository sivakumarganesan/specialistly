import mongoose from 'mongoose';

const marketplaceCommissionSchema = new mongoose.Schema({
  // Payment Reference
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
  },
  chargeId: {
    type: String,
    default: null,
  },

  // Involved Parties
  customerId: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  specialistId: {
    type: String,
    required: true,
  },
  specialistEmail: {
    type: String,
    required: true,
  },
  stripeAccountId: {
    type: String,
    required: true, // Specialist's Stripe Connect account
  },

  // Service Details
  serviceId: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['course', 'service', 'consultation', 'webinar'],
    default: 'course',
  },
  serviceName: {
    type: String,
    required: true,
  },

  // Amount Breakdown
  grossAmount: {
    type: Number,
    required: true, // Total amount paid by customer (in cents)
  },
  commissionPercentage: {
    type: Number,
    required: true, // Specialistly's commission percentage
  },
  commissionAmount: {
    type: Number,
    required: true, // Amount to Specialistly (in cents)
  },
  specialistPayout: {
    type: Number,
    required: true, // Amount to specialist (in cents)
  },
  currency: {
    type: String,
    default: 'usd',
  },

  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending',
  },

  // Payout Status (for specialist)
  payoutStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  payoutDate: {
    type: Date,
    default: null,
  },
  transferId: {
    type: String,
    default: null, // Stripe transfer ID to specialist's account
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

// Index for quick lookups
marketplaceCommissionSchema.index({ specialistId: 1, status: 1 });
marketplaceCommissionSchema.index({ customerId: 1, createdAt: -1 });
marketplaceCommissionSchema.index({ paymentIntentId: 1 });
marketplaceCommissionSchema.index({ payoutStatus: 1 });

export default mongoose.model('MarketplaceCommission', marketplaceCommissionSchema);
