import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

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
