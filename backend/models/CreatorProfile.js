import mongoose from 'mongoose';

const weeklyAvailabilitySchema = new mongoose.Schema({
  day: String,
  enabled: Boolean,
  startTime: String,
  endTime: String,
}, { _id: false });

const creatorProfileSchema = new mongoose.Schema({
  creatorName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  bio: String,
  phone: String,
  location: String,
  company: String,
  website: String,
  profileImage: {
    type: String,
    default: null,
  },
  weeklyAvailability: [weeklyAvailabilitySchema],
  appointmentSlots: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  paymentSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  savedAt: {
    type: Date,
    default: Date.now,
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

export default mongoose.model('CreatorProfile', creatorProfileSchema);
