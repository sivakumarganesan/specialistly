import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  lessonsCount: {
    type: Number,
    required: true,
  },
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['self-paced', 'cohort-based'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  studentsEnrolled: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'draft',
  },
  level: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  thumbnail: String,
  creator: {
    type: String,
    required: false,
  },
  // Self-paced specific
  modules: [moduleSchema],
  totalLessons: Number,
  certificateIncluded: Boolean,
  accessDuration: String,
  // Cohort-based specific
  cohortSize: String,
  startDate: Date,
  endDate: Date,
  schedule: String,
  meetingPlatform: String,
  liveSessions: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Course', courseSchema);
