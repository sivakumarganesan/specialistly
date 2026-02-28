import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  joinTime: Date,
  leaveTime: Date,
  duration: Number, // minutes
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  // References
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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
  
  // Meeting Info
  zoomMeetingId: String,
  meetingType: {
    type: String,
    enum: ['zoom', 'google_meet', 'other'],
    default: 'zoom',
  },
  
  // Timing
  scheduledStartTime: {
    type: Date,
    required: true,
  },
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Zoom Data
  duration: Number, // minutes (from Zoom)
  participants: [participantSchema],
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'no-show'],
    default: 'scheduled',
  },
  
  // Recording
  hasRecording: {
    type: Boolean,
    default: false,
  },
  recordingId: String,
  recordingUrl: String,
  recordingDuration: Number, // minutes
  recordingExpiryDate: Date,
  recordingDownloadUrl: String,
  
  // Analytics
  screenshare: Boolean,
  screenshareStartTime: Date,
  screenshareEndTime: Date,
  screenshareCount: Number,
  
  // Notes
  sessionNotes: String,
  
  // Metadata
  metadata: {
    specialistEmail: String,
    customerEmail: String,
    consultationType: String,
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
sessionSchema.index({ bookingId: 1 });
sessionSchema.index({ specialistId: 1, actualStartTime: -1 });
sessionSchema.index({ customerId: 1, actualStartTime: -1 });
sessionSchema.index({ zoomMeetingId: 1 });
sessionSchema.index({ createdAt: -1 });

export default mongoose.model('Session', sessionSchema);
