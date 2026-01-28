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
    enum: ['available', 'booked'],
    default: 'available',
  },
  bookedBy: mongoose.Schema.Types.ObjectId,
  serviceTitle: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('AppointmentSlot', appointmentSlotSchema);
