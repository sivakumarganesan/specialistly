import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  offeringTitle: {
    type: String,
    required: true,
  },
  offeringType: {
    type: String,
    enum: ['course', 'service'],
    required: true,
  },
  offeringId: mongoose.Schema.Types.ObjectId,
  price: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['completed', 'active', 'cancelled'],
    default: 'completed',
  },
}, { _id: false });

const enrollmentSchema = new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active',
  },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  serviceId: mongoose.Schema.Types.ObjectId,
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  purchaseCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  purchases: [purchaseSchema],
  enrollments: [enrollmentSchema],
  bookings: [bookingSchema],
  specialists: [
    {
      specialistId: mongoose.Schema.Types.ObjectId,
      specialistEmail: String,
      specialistName: String,
      firstBookedDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  avatar: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Customer', customerSchema);
