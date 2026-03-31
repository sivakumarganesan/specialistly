import express from 'express';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isCouponExpired } from '../utils/couponUtils.js';

const router = express.Router();

// Middleware to check if user is a specialist
const requireSpecialist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('role isSpecialist');
    if (!user || (user.role !== 'specialist' && user.role !== 'admin' && !user.isSpecialist)) {
      return res.status(403).json({ error: 'Specialist access required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify specialist status' });
  }
};

// Create a new coupon
router.post('/', authMiddleware, requireSpecialist, async (req, res) => {
  try {
    const { code, course, discountType, discountValue, maxRedemptions, expiresAt } = req.body;
    const specialist = req.user.userId;
    const coupon = new Coupon({
      code,
      course,
      specialist,
      discountType,
      discountValue,
      maxRedemptions,
      expiresAt,
    });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `A coupon with code "${code.toUpperCase()}" already exists. Please use a different code.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// Get all coupons for a specialist (optionally filter by course)
router.get('/', authMiddleware, requireSpecialist, async (req, res) => {
  try {
    const { course } = req.query;
    const query = { specialist: req.user.userId };
    if (course) query.course = course;
    const coupons = await Coupon.find(query).populate('course');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate a coupon by code (public, for checkout)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { course } = req.query;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), course, isActive: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found or inactive' });
    if (isCouponExpired(coupon.expiresAt)) return res.status(400).json({ error: 'Coupon expired' });
    if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) return res.status(400).json({ error: 'Coupon fully redeemed' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a coupon (specialist only)
router.put('/:id', authMiddleware, requireSpecialist, async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOne({ _id: id, specialist: req.user.userId });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    Object.assign(coupon, req.body);
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a coupon (specialist only)
router.delete('/:id', authMiddleware, requireSpecialist, async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOneAndDelete({ _id: id, specialist: req.user.userId });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
