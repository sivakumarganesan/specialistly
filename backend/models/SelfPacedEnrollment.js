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
selfPacedEnrollmentSchema.index({ courseId: 1, customerId: 1 }, { unique: true });
selfPacedEnrollmentSchema.index({ customerId: 1 });
selfPacedEnrollmentSchema.index({ courseId: 1 });

export default mongoose.model('SelfPacedEnrollment', selfPacedEnrollmentSchema);
