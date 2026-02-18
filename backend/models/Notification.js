import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'booking_confirmation',
      'booking_reminder',
      'booking_cancelled',
      'session_started',
      'session_reminder',
      'session_completed',
      'recording_ready',
      'payment_received',
      'payment_failed',
      'refund_processed',
      'specialist_request',
      'availability_request',
      'message_received',
      'status_update',
    ],
    required: true,
  },
  
  // Content
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  action: String, // e.g., "join_meeting", "view_recording", "view_booking"
  actionUrl: String,
  
  // Related Resource IDs
  bookingId: mongoose.Schema.Types.ObjectId,
  paymentId: mongoose.Schema.Types.ObjectId,
  sessionId: mongoose.Schema.Types.ObjectId,
  
  // Status
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  
  // Delivery Channels
  channels: [{
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
  }],
  
  // Delivery Status
  delivery: {
    emailSent: Boolean,
    emailSentAt: Date,
    emailFailed: Boolean,
    emailFailureReason: String,
    
    smsSent: Boolean,
    smsSentAt: Date,
    smsFailed: Boolean,
    smsFailureReason: String,
    
    pushSent: Boolean,
    pushSentAt: Date,
    pushFailed: Boolean,
    pushFailureReason: String,
  },
  
  // Metadata
  metadata: {
    specialistName: String,
    customerName: String,
    specialistEmail: String,
    customerEmail: String,
    sessionTime: Date,
    amount: Number,
    currency: String,
  },
  
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  
  // TTL Index - auto-delete after expiry
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for common queries
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ bookingId: 1 });
notificationSchema.index({ paymentId: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model('Notification', notificationSchema);
