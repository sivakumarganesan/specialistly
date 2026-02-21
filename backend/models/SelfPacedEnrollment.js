import mongoose from 'mongoose';

const selfPacedEnrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  customerId: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  
  // Lessons completed
  completedLessons: [mongoose.Schema.Types.ObjectId],
  
  // Completion status
  completed: {
    type: Boolean,
    default: false,
  },
  
  // Payment info (OLD)
  paidAt: Date,
  amount: Number,

  // Payment info (NEW - Stripe Integration)
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    description: 'Payment status from Stripe',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    description: 'Reference to Payment document',
  },
  paymentDate: {
    type: Date,
    description: 'Date when payment was completed',
  },
  webhookVerified: {
    type: Boolean,
    default: false,
    description: 'Whether payment was verified via Stripe webhook',
  },

  // Enrollment status
  status: {
    type: String,
    enum: ['inactive', 'active', 'cancelled', 'refunded'],
    default: 'inactive',
    index: true,
  },

  // Tracking specialist info
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  specialistEmail: String,
  
  // Certificate
  certificate: {
    issued: {
      type: Boolean,
      default: false,
    },
    certificateId: String,
    issuedDate: Date,
    downloadUrl: String,
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

// Index for unique enrollment
selfPacedEnrollmentSchema.index({ courseId: 1, customerId: 1 }, { unique: true });
selfPacedEnrollmentSchema.index({ customerId: 1 });
selfPacedEnrollmentSchema.index({ courseId: 1 });

export default mongoose.model('SelfPacedEnrollment', selfPacedEnrollmentSchema);
