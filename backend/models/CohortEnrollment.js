import mongoose from 'mongoose';

const cohortEnrollmentSchema = new mongoose.Schema({
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
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
  
  // Sessions attended
  attendedSessions: [mongoose.Schema.Types.ObjectId],
  
  // Completion status
  completed: {
    type: Boolean,
    default: false,
  },
  
  // Payment info
  paidAt: Date,
  amount: Number,
  
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
cohortEnrollmentSchema.index({ cohortId: 1, customerId: 1 }, { unique: true });
cohortEnrollmentSchema.index({ customerId: 1 });
cohortEnrollmentSchema.index({ cohortId: 1 });

export default mongoose.model('CohortEnrollment', cohortEnrollmentSchema);
