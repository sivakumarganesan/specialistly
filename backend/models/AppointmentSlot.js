import mongoose from 'mongoose';

const appointmentSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'in-progress', 'completed'],
    default: 'available',
  },
  bookedBy: mongoose.Schema.Types.ObjectId,
  serviceTitle: String,
  specialistName: String,
  specialistId: mongoose.Schema.Types.ObjectId,
  specialistEmail: String,
  customerEmail: String,
  customerName: String,
  
  // Zoom Integration
  zoomMeetingId: String,
  zoomJoinUrl: String,
  zoomStartUrl: String,
  zoomHostId: String,
  zoomRecordingId: String,
  
  // Recording Details
  recordingLink: String,
  recordingUrl: String,
  recordingId: String,
  recordingExpiryDate: Date,
  recordingExpired: {
    type: Boolean,
    default: false,
  },
  recordingDuration: Number, // Duration in seconds
  
  // Email Reminders
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderSentAt: Date,
  recordingSentAt: Date,
  invitationSentAt: Date,
  
  // Meeting Metadata
  meetingNotes: String,
  attendanceStatus: {
    type: String,
    enum: ['attended', 'missed', 'rescheduled', null],
    default: null,
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

export default mongoose.model('AppointmentSlot', appointmentSlotSchema);
