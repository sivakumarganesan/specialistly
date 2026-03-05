import mongoose from 'mongoose';

const specialistPayoutSchema = new mongoose.Schema({
  // Reference to specialist
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreatorProfile',
    required: true,
  },
  specialistEmail: {
    type: String,
    required: true,
  },
  specialistName: {
    type: String,
    required: true,
  },

  // Reference to commission/enrollment
  commissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceCommission',
    default: null,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SelfPacedEnrollment',
    default: null,
  },

  // Payout details
  amount: {
    type: Number,
    required: true, // Amount in smallest unit (paise for INR)
  },
  currency: {
    type: String,
    default: 'INR',
  },
  originalPaymentAmount: {
    type: Number,
    required: true, // Full course price
  },
  commissionDeducted: {
    type: Number,
    required: true, // Commission (15%)
  },

  // Razorpay payout details
  razorpayPayoutId: {
    type: String,
    default: null, // e.g., "payout_1234567890"
  },
  razorpayTransferId: {
    type: String,
    default: null, // e.g., "trf_1234567890"
  },
  razorpayPaymentId: {
    type: String,
    default: null, // Original payment ID
  },

  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',        // Awaiting payout
      'processing',     // Payout initiated
      'completed',      // Successfully transferred
      'failed',         // Transfer failed
      'rejected',       // Manual rejection
      'on_hold',        // Held for verification
    ],
    default: 'pending',
  },
  failureReason: {
    type: String,
    default: null, // Error reason if payout fails
  },

  // Metadata
  payoutRequestedAt: {
    type: Date,
    default: Date.now, // When payout was requested
  },
  payoutInitiatedAt: {
    type: Date,
    default: null, // When Razorpay received the payout request
  },
  payoutCompletedAt: {
    type: Date,
    default: null, // When funds arrived at specialist's bank
  },

  // Bank details snapshot (for record keeping)
  bankDetailsSnapshot: {
    accountHolderName: String,
    accountNumber: String, // Last 4 digits only
    accountType: String,
    bankName: String,
  },

  // Notes
  notes: {
    type: String,
    default: null, // Admin notes for this payout
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick lookups
specialistPayoutSchema.index({ specialistId: 1, status: 1 });
specialistPayoutSchema.index({ commissionId: 1 });
specialistPayoutSchema.index({ razorpayPayoutId: 1 });
specialistPayoutSchema.index({ createdAt: -1 });

export default mongoose.model('SpecialistPayout', specialistPayoutSchema);
