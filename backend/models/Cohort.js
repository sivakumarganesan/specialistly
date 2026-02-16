import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  sessionNumber: Number,
  title: String,
  date: Date,
  time: String, // "7:00 PM"
  zoomLink: String,
  completed: {
    type: Boolean,
    default: false,
  },
});

const cohortSchema = new mongoose.Schema({
  // References
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  specialistId: {
    type: String,
    required: true,
  },
  
  // Batch info
  batchName: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  
  // Enrollment limits
  maxStudents: {
    type: Number,
    required: true,
  },
  enrolledCount: {
    type: Number,
    default: 0,
  },
  
  // Sessions
  sessions: [sessionSchema],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'ended'],
    default: 'draft',
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

cohortSchema.index({ courseId: 1 });
cohortSchema.index({ specialistId: 1 });

export default mongoose.model('Cohort', cohortSchema);
