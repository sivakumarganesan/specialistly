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
  // Google Meet Integration
  googleMeetLink: String,
  googleEventId: String,
  specialistEmail: String,
  customerEmail: String,
  customerName: String,
  // Recording Details
  recordingLink: String,
  recordingId: String,
  recordingExpiryDate: Date,
  recordingExpired: {
    type: Boolean,
    default: false,
  },
  // Email Reminders
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderSentAt: Date,
  recordingSentAt: Date,
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
