import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'other'],
    default: 'other',
  },
  fileSize: Number, // in bytes
  uploadedAt: {
    type: Date,
    default: () => new Date(),
  },
});

const lessonSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    default: null, // Optional - lessons can have videos or just files
  },
  files: [fileSchema], // Array of downloadable files (PDF, Word docs, etc)
  order: {
    type: Number,
    required: true,
  },
});

const courseSchema = new mongoose.Schema({
  // Basic Info
  specialistId: {
    type: String,
    required: true,
  },
  specialistEmail: {
    type: String,
    required: true,
  },
  
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  thumbnail: String,
  
  // Course Details
  duration: String,
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'Beginner',
  },
  category: {
    type: String,
    enum: ['Technology', 'Marketing', 'Business', 'Design', 'Personal Development', 'Health & Fitness'],
    default: 'Technology',
  },
  
  // Course Type
  courseType: {
    type: String,
    enum: ['self-paced', 'cohort'],
    required: true,
  },
  
  // Pricing
  price: {
    type: Number,
    default: 0,
  },
  
  // Lessons (for both types)
  lessons: [lessonSchema],
  
  // Self-Paced Specific Fields
  totalLessons: Number,
  certificateIncluded: {
    type: Boolean,
    default: true,
  },
  accessDuration: {
    type: String,
    default: 'Lifetime',
  },
  
  // Cohort-Based Specific Fields
  cohortSize: String,
  startDate: Date,
  endDate: Date,
  schedule: String,
  meetingPlatform: {
    type: String,
    default: 'Zoom',
  },
  liveSessions: Number,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: Date,
  
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
