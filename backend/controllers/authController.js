import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Course from '../models/Course.js';
import Service from '../models/Service.js';
import ConsultingSlot from '../models/ConsultingSlot.js';
import AppointmentSlot from '../models/AppointmentSlot.js';
import CreatorProfile from '../models/CreatorProfile.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import MarketplaceCommission from '../models/MarketplaceCommission.js';
import Booking from '../models/Booking.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  });
};

export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      isSpecialist,
      membership,
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email',
      });
    }

    // Get subscription plan features
    const getPlanFeatures = (planType) => {
      const features = {
        free: [
          'Up to 3 courses',
          'Up to 10 sessions per month',
          'Email support',
          'Specialistly branding',
        ],
        pro: [
          'Unlimited courses',
          'Advanced analytics',
          'Priority support',
          'Custom branding',
        ],
      };
      return features[planType] || features.free;
    };

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: isSpecialist ? 'specialist' : 'user',
      isSpecialist: isSpecialist || false,
      membership: membership || 'free',
      subscription: {
        planType: membership || 'free',
        price: membership === 'pro' ? 999 : 0,
        currency: '₹',
        status: 'active',
        billingCycle: membership === 'pro' ? 'monthly' : 'forever',
        features: getPlanFeatures(membership || 'free'),
        autoRenew: membership === 'pro',
      },
    });

    await user.save();

    // Create a Customer record for non-specialist users
    if (!isSpecialist) {
      try {
        const customer = new Customer({
          email: user.email,
          name: user.name,
          enrollments: [],
          bookings: [],
        });
        await customer.save();
        console.log('✅ Customer record created for:', email);
      } catch (customerError) {
        console.warn('⚠️ Failed to create customer record:', customerError.message);
        // Don't fail the signup if customer creation fails
      }
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name,
        userType: isSpecialist ? 'specialist' : 'customer',
        categories: isSpecialist ? user.specialityCategories : user.customerInterests,
      });
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email:', emailError.message);
      // Don't fail the signup if email fails
    }

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      message: 'User created successfully',
      token,
      userType: isSpecialist ? 'specialist' : 'customer',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSpecialist: user.isSpecialist,
        membership: user.membership,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    console.log('Login attempt:', { email, passwordLength: password?.length });

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    console.log('User found:', email);
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.email);

    res.json({
      message: 'Login successful',
      token,
      userType: user.isSpecialist ? 'specialist' : 'customer',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSpecialist: user.isSpecialist,
        membership: user.membership,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSpecialist: user.isSpecialist,
      membership: user.membership,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { planType } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const getPlanFeatures = (type) => {
      const features = {
        free: [
          'Up to 3 courses',
          'Up to 10 sessions per month',
          'Email support',
          'Specialistly branding',
        ],
        pro: [
          'Unlimited courses',
          'Advanced analytics',
          'Priority support',
          'Custom branding',
        ],
      };
      return features[type] || features.free;
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.membership = planType;
    user.subscription = {
      planType,
      price: planType === 'pro' ? 999 : 0,
      currency: '₹',
      status: 'active',
      startDate: new Date(),
      billingCycle: planType === 'pro' ? 'monthly' : 'forever',
      features: getPlanFeatures(planType),
      autoRenew: planType === 'pro',
    };

    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSpecialist: user.isSpecialist,
        membership: user.membership,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark user onboarding as complete
 * POST /api/user/onboarding-complete
 */
export const markOnboardingComplete = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.onboardingComplete = true;
    user.categoriesSetAt = new Date();
    await user.save();

    // Send welcome email with categories/interests after onboarding complete
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name,
        userType: user.isSpecialist ? 'specialist' : 'customer',
        categories: user.isSpecialist ? user.specialityCategories : user.customerInterests,
      });
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email after onboarding:', emailError.message);
      // Don't fail the onboarding if email fails
    }

    res.json({
      success: true,
      message: 'Onboarding marked as complete',
      user: {
        id: user._id,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (error) {
    console.error('Mark onboarding complete error:', error);
    res.status(500).json({ error: error.message });
  }
};
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    console.log('[AuthController] deleteAccount called for:', { userId, userEmail });

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Determine if specialist or customer based on user type
    const isSpecialist = user.isSpecialist;

    // Delete specialist's courses, services, and consulting slots if specialist
    if (isSpecialist) {
      console.log('[AuthController] Deleting specialist data for:', userEmail);

      // Delete courses
      const deletedCourses = await Course.deleteMany({ specialistEmail: userEmail });
      console.log('[AuthController] Deleted courses:', deletedCourses.deletedCount);

      // Delete services
      const deletedServices = await Service.deleteMany({ creator: userEmail });
      console.log('[AuthController] Deleted services:', deletedServices.deletedCount);

      // Delete consulting slots
      const deletedSlots = await ConsultingSlot.deleteMany({ specialistEmail: userEmail });
      console.log('[AuthController] Deleted consulting slots:', deletedSlots.deletedCount);

      // Delete appointment slots
      const deletedAppointmentSlots = await AppointmentSlot.deleteMany({ specialistId: userId });
      console.log('[AuthController] Deleted appointment slots:', deletedAppointmentSlots.deletedCount);

      // Delete bookings
      const deletedBookings = await Booking.deleteMany({ specialistId: userId });
      console.log('[AuthController] Deleted bookings:', deletedBookings.deletedCount);

      // Delete creator profile
      const deletedProfile = await CreatorProfile.deleteOne({ _id: user.creatorProfileId });
      console.log('[AuthController] Deleted creator profile:', !!deletedProfile.deletedCount);

      // Delete marketplace commissions for this specialist
      const deletedCommissions = await MarketplaceCommission.deleteMany({ specialistId: userId });
      console.log('[AuthController] Deleted marketplace commissions:', deletedCommissions.deletedCount);
    } else {
      // Customer - delete enrollments and related data
      console.log('[AuthController] Deleting customer data for:', userEmail);

      // Delete self-paced enrollments
      const deletedEnrollments = await SelfPacedEnrollment.deleteMany({ customerId: userId });
      console.log('[AuthController] Deleted enrollments:', deletedEnrollments.deletedCount);

      // Delete bookings for this customer
      const deletedBookings = await Booking.deleteMany({ customerId: userId });
      console.log('[AuthController] Deleted bookings:', deletedBookings.deletedCount);

      // Delete marketplace commissions for this customer
      const deletedCommissions = await MarketplaceCommission.deleteMany({ customerId: userId });
      console.log('[AuthController] Deleted marketplace commissions:', deletedCommissions.deletedCount);
    }

    // Delete user account
    const deletedUser = await User.findByIdAndDelete(userId);
    console.log('[AuthController] User account deleted:', !!deletedUser);

    // Also delete from Customer model if exists
    if (!isSpecialist) {
      await Customer.deleteOne({ _id: user.customerId || userId });
    }

    res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('[AuthController] deleteAccount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message,
    });
  }
};

/**
 * Request password reset
 * POST /api/user/request-password-reset
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hashed token in database with 1 hour expiration
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email with unhashed token (user will use unhashed token in link)
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetToken: resetToken,
      });
    } catch (emailError) {
      console.warn('⚠️ Failed to send password reset email:', emailError.message);
      // Clear the reset token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(500).json({
        error: 'Failed to send reset email. Please try again later.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reset password with token
 * POST /api/user/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Reset token and new password are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with matching token and valid expiration
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
};