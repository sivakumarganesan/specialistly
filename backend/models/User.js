import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'specialist', 'admin'],
    default: 'user',
  },
  membership: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  subscription: {
    planType: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: '₹',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'forever'],
      default: 'forever',
    },
    features: [String],
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  isSpecialist: {
    type: Boolean,
    default: false,
  },
  profileImage: String,
  phone: String,
  bio: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
