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
