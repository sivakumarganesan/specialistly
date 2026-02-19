import mongoose from 'mongoose';

const webinarDateSchema = new mongoose.Schema({
  date: String,
  time: String,
}, { _id: false });

const weeklyScheduleSchema = new mongoose.Schema({
  day: String,
  time: String,
  enabled: Boolean,
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['webinar', 'consulting'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: false,  // Required for consulting, optional for webinar
  },
  schedule: {
    type: String,
    default: 'Flexible',
  },
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'draft',
  },
  // Webinar specific
  eventType: {
    type: String,
    enum: ['single', 'multiple', ''],
  },
  location: {
    type: String,
    default: 'zoom',
  },
  creator: {
    type: String,
    required: false,
  },
  sessionFrequency: {
    type: String,
    enum: ['onetime', 'selected', 'repeat', ''],
  },
  webinarDates: [webinarDateSchema],
  weeklySchedule: [weeklyScheduleSchema],
  // Consulting specific - customer assignment
  assignedCustomerEmail: {
    type: String,
    required: false,
  },
  assignedCustomer: {
    type: String,
    required: false,
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

export default mongoose.model('Service', serviceSchema);
