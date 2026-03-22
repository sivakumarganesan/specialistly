import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  slotDuration: {
    type: Number,
    default: 60, // minutes
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  slots: [slotSchema],
}, { _id: false });

const dateExceptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  slots: [slotSchema],
}, { _id: false });

const availabilityScheduleSchema = new mongoose.Schema({
  // Reference to Specialist
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreatorProfile',
    required: true,
  },
  
  // Schedule Type
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'custom'],
    default: 'weekly',
  },
  
  // Weekly Recurring Pattern
  weeklyPattern: {
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    sunday: dayScheduleSchema,
  },
  
  // Exceptions & Overrides
  dateExceptions: [dateExceptionSchema],
  
  // Break Times
  breakTimes: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    startTime: String,
    endTime: String,
    recurring: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true,
  },
  appliedFrom: {
    type: Date,
    default: Date.now,
  },
  appliedTo: Date,
  
  // Timezone
  timezone: String,
  
  // Slot Generation Config
  slotConfig: {
    defaultDuration: {
      type: Number,
      default: 60, // minutes
    },
    availableDurations: {
      type: [Number],
      default: [30, 45, 60, 90],
    },
    buffer: {
      type: Number,
      default: 0, // minutes between slots
    },
  },
  
  // Booking Rules
  bookingRules: {
    minBookingNotice: {
      type: Number,
      default: 24, // hours
    },
    maxAdvanceBooking: {
      type: Number,
      default: 90, // days
    },
    cancellationDeadline: {
      type: Number,
      default: 24, // hours before meeting
    },
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

// Index for common queries
availabilityScheduleSchema.index({ specialistId: 1, isActive: 1 });
availabilityScheduleSchema.index({ specialistId: 1, appliedFrom: -1 });

export default mongoose.model('AvailabilitySchedule', availabilityScheduleSchema);
