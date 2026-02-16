import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  // Unique identifier
  certificateId: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Course info
  courseId: mongoose.Schema.Types.ObjectId,
  courseName: String,
  courseType: {
    type: String,
    enum: ['self-paced', 'cohort'],
  },
  
  // Recipient info
  customerId: String,
  customerName: String,
  customerEmail: String,
  
  // Specialist info
  specialistId: String,
  specialistName: String,
  
  // Certificate details
  issueDate: {
    type: Date,
    default: Date.now,
  },
  
  // References
  enrollmentId: mongoose.Schema.Types.ObjectId,
  
  // URLs
  pdfUrl: String,
  verifyUrl: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ customerId: 1 });
certificateSchema.index({ courseId: 1 });

export default mongoose.model('Certificate', certificateSchema);
