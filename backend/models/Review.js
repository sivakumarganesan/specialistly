import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // References
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
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
  
  // Overall Rating
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  
  // Review Text
  reviewText: {
    type: String,
    maxlength: 5000,
  },
  
  // Detailed Aspects
  aspects: {
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  
  // Specialist Response
  specialistResponse: String,
  respondedAt: Date,
  responseReadAt: Date,
  
  // Images (optional)
  images: [String], // URLs to review images
  
  // Visibility & Verification
  isPublic: {
    type: Boolean,
    default: true,
  },
  isVerifiedBooking: {
    type: Boolean,
    default: true,
  },
  isModerated: Boolean,
  moderationNotes: String,
  
  // Engagement
  helpfulCount: {
    type: Number,
    default: 0,
  },
  notHelpfulCount: {
    type: Number,
    default: 0,
  },
  
  // Metadata
  consultationType: String,
  sessionDuration: Number, // minutes
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'removed'],
    default: 'approved',
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for common queries
reviewSchema.index({ specialistId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ specialistId: 1, rating: 1 });
reviewSchema.index({ isPublic: 1, status: 1 });

// Virtual for average aspect rating
reviewSchema.virtual('averageAspectRating').get(function() {
  const aspects = this.aspects || {};
  const values = Object.values(aspects).filter(val => val);
  if (values.length === 0) return 0;
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
});

export default mongoose.model('Review', reviewSchema);
