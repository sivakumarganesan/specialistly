import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: mongoose.Schema.Types.ObjectId,
  reason: String,
}, { _id: false });

const cancellationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['not-cancelled', 'cancelled-by-specialist', 'cancelled-by-customer'],
    default: 'not-cancelled',
  },
  cancelledAt: Date,
  reason: String,
  requestedAt: Date,
  approvedAt: Date,
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  zoomMeetingId: String,
  zoomLink: String,
  zoomStartUrl: String,
  zoomJoinUrl: String,
  googleMeetLink: String,
  
  // Session Timeline
  startedAt: Date,
  endedAt: Date,
  actualDuration: Number, // in minutes
  
  // Recording
  recordingId: String,
  recordingUrl: String,
  recordingDuration: Number,
  recordingExpiryDate: Date,
  recordingNotificationSent: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  specialistJoined: Boolean,
  customerJoined: Boolean,
  specialistJoinedAt: Date,
  customerJoinedAt: Date,
  specialistLeftAt: Date,
  customerLeftAt: Date,
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  customerRating: Number, // 1-5
  customerReview: String,
  specialistRating: Number, // 1-5
  specialistReview: String,
  ratedAt: Date,
}, { _id: false });

const rescheduleHistorySchema = new mongoose.Schema({
  fromSlotId: mongoose.Schema.Types.ObjectId,
  toSlotId: mongoose.Schema.Types.ObjectId,
  rescheduledAt: {
    type: Date,
    default: Date.now,
  },
  rescheduledBy: mongoose.Schema.Types.ObjectId,
  reason: String,
}, { _id: false });

const remindersSchema = new mongoose.Schema({
  day_before_sent: {
    type: Boolean,
    default: false,
  },
  hour_before_sent: {
    type: Boolean,
    default: false,
  },
  post_session_sent: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  // References
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentSlot',
    required: true,
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
  
  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending',
  },
  statusHistory: [statusHistorySchema],
  
  // Session Details
  consultationType: String,
  sessionDuration: Number, // minutes
  sessionPrice: Number,
  currency: {
    type: String,
    default: 'USD',
  },
  
  // Cancellation
  cancellation: {
    type: cancellationSchema,
    default: () => ({}),
  },
  
  // Notes
  customerNotes: String,
  specialistNotes: String,
  
  // Session Execution
  meeting: {
    type: meetingSchema,
    default: () => ({}),
  },
  
  // Attendance
  attendance: {
    type: attendanceSchema,
    default: () => ({}),
  },
  
  // Feedback (post-session)
  feedback: {
    type: feedbackSchema,
    default: () => ({}),
  },
  
  // Rescheduling History
  rescheduleHistory: [rescheduleHistorySchema],
  
  // Metadata
  timezone: String,
  reminders: {
    type: remindersSchema,
    default: () => ({}),
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
bookingSchema.index({ slotId: 1 });
bookingSchema.index({ specialistId: 1, status: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ 'meeting.zoomMeetingId': 1 });
bookingSchema.index({ createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
