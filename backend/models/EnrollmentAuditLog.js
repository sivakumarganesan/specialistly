import mongoose from 'mongoose';

const enrollmentAuditLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    enum: ['add', 'remove', 'payment_override', 'manual_adjustment'],
    required: true,
  },
  
  // Enrollment info
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SelfPacedEnrollment',
    default: null,
  },
  cohortEnrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CohortEnrollment',
    default: null,
  },
  
  // Course info
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: String,
  
  // Customer info
  customerId: {
    type: String,
    required: true,
  },
  customerEmail: String,
  customerName: String,
  
  // Admin info (who performed the action)
  adminId: {
    type: String,
    required: true,
  },
  adminEmail: String,
  adminName: String,
  
  // Course type (self-paced or cohort)
  courseType: {
    type: String,
    enum: ['self-paced', 'cohort-based'],
    required: true,
  },
  
  // Reason for manual action
  reason: String,
  
  // Previous state (for auditing)
  previousState: {
    paymentStatus: String,
    enrolledAt: Date,
  },
  
  // New state
  newState: {
    paymentStatus: String,
    enrolledAt: Date,
  },
  
  // Additional metadata
  notes: String,
  
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
enrollmentAuditLogSchema.index({ courseId: 1 });
enrollmentAuditLogSchema.index({ customerId: 1 });
enrollmentAuditLogSchema.index({ adminId: 1 });
enrollmentAuditLogSchema.index({ createdAt: -1 });
enrollmentAuditLogSchema.index({ courseId: 1, createdAt: -1 });

export default mongoose.model('EnrollmentAuditLog', enrollmentAuditLogSchema);
