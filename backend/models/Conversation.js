import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      userId: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      userType: {
        type: String,
        enum: ['specialist', 'customer'],
        required: true,
      },
    },
  ],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageTime: {
    type: Date,
    default: Date.now,
  },
  lastMessageSenderId: {
    type: String,
  },
  preview: {
    type: String,
    max: 100,
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
  isArchived: {
    type: Boolean,
    default: false,
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

// Index for faster queries
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ lastMessageTime: -1 });

export default mongoose.model('Conversation', conversationSchema);
