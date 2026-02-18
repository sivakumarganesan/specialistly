import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  requestedAt: Date,
  requestedBy: mongoose.Schema.Types.ObjectId,
  reason: String,
  refundAmount: Number,
  refundedAt: Date,
  stripeRefundId: String,
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
  },
}, { _id: false });

const metadataSchema = new mongoose.Schema({
  specialistName: String,
  customerEmail: String,
  customerName: String,
  consultationType: String,
  duration: Number,
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  // References
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreatorProfile',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  
  // Payment Amount
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  
  // Split
  platformFee: Number, // e.g., amount * 0.2
  platformFeePercentage: {
    type: Number,
    default: 20,
  },
  specialistPayout: Number, // amount - platformFee
  
  // Stripe Integration
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  stripeChargeId: String,
  stripeCustomerId: String,
  stripeConnectAccountId: String,
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'chargeback'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet'],
  },
  
  // Timeline
  createdAt: {
    type: Date,
    default: Date.now,
  },
  initiatedAt: Date,
  succeededAt: Date,
  failedAt: Date,
  refundedAt: Date,
  
  // Failure Info
  failureCode: String,
  failureMessage: String,
  failureReason: String,
  
  // Refund
  refund: {
    type: refundSchema,
    default: () => ({}),
  },
  
  // Invoice
  invoiceId: String,
  invoiceUrl: String,
  receiptNumber: String,
  
  // Metadata
  metadata: {
    type: metadataSchema,
    default: () => ({}),
  },
  
  // Idempotency
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // Update timestamp
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for common queries
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ specialistId: 1, status: 1 });
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
