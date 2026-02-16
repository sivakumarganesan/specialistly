import mongoose from 'mongoose';

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
    required: true,
  },
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
