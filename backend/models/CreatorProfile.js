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
  // Stripe Connected Account (for marketplace commission model)
  stripeAccountId: {
    type: String,
    default: null, // e.g., "acct_1234567890"
  },
  stripeConnectStatus: {
    type: String,
    enum: ['pending', 'active', 'disabled', 'not_connected'],
    default: 'not_connected', // pending = onboarding in progress, active = ready to receive payouts
  },
  stripeConnectUrl: {
    type: String,
    default: null, // URL for specialist to complete onboarding
  },
  stripeOnboardingExpires: {
    type: Date,
    default: null, // Link expires after 24 hours
  },
  commissionPercentage: {
    type: Number,
    default: 15, // Specialistly takes 15% commission by default
  },
  totalEarnings: {
    type: Number,
    default: 0, // Total earnings (in cents/smallest unit)
  },
  totalCommissionPaid: {
    type: Number,
    default: 0, // Total commission to Specialistly
  },
  lastPayoutDate: {
    type: Date,
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
