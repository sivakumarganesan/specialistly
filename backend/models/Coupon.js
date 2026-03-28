import mongoose from 'mongoose';
const { Schema } = mongoose;

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  specialist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  maxRedemptions: { type: Number, default: 1 },
  redemptions: { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

couponSchema.index({ code: 1, course: 1 }, { unique: true });

couponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Coupon', couponSchema);
