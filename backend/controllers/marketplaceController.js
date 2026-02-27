import stripe from '../config/stripe.js';
import { stripeService } from '../services/stripeService.js';
import MarketplaceCommission from '../models/MarketplaceCommission.js';
import CreatorProfile from '../models/CreatorProfile.js';
import Course from '../models/Course.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';

/**
 * Create marketplace payment intent
 * Specialist receives payout after commission deduction
 * POST /api/marketplace/payments/create-intent
 */
export const createMarketplacePaymentIntent = async (req, res) => {
  try {
    const {
      courseId,
      customerId,
      customerEmail,
      commissionPercentage = 15,
    } = req.body;

    // Validate input
    if (!courseId || !customerId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Verify user is the customer
    if (req.user?.userId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check duplicate enrollment
    const existingEnrollment = await SelfPacedEnrollment.findOne({
      customerId,
      courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
        code: 'DUPLICATE_ENROLLMENT',
      });
    }

    // Get specialist Stripe account
    const specialist = await CreatorProfile.findOne({
      _id: course.specialistId,
    });

    if (!specialist?.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Specialist has not set up Stripe account. Payment cannot be processed.',
        code: 'SPECIALIST_NOT_ONBOARDED',
      });
    }

    if (specialist.stripeConnectStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Specialist account is not fully set up. Payment cannot be processed.',
        code: 'SPECIALIST_NOT_ACTIVE',
      });
    }

    // Free course - direct enrollment
    const amount = course.price || 0;
    if (amount === 0) {
      const enrollment = await SelfPacedEnrollment.create({
        customerId,
        customerEmail,
        specialistId: course.specialistId,
        specialistEmail: course.specialistEmail,
        courseId,
        paymentStatus: 'completed',
        status: 'active',
      });

      return res.status(200).json({
        success: true,
        message: 'Enrolled in free course',
        enrollmentId: enrollment._id,
        isFree: true,
      });
    }

    // Create marketplace payment intent
    const amountInCents = Math.round(amount * 100);
    const paymentResult = await stripeService.createMarketplacePaymentIntent({
      amount: amountInCents,
      specialistStripeAccountId: specialist.stripeAccountId,
      commissionPercentage: specialist.commissionPercentage || commissionPercentage,
      customerId,
      currency: 'usd',
      description: `${course.title} - Course enrollment`,
      metadata: {
        courseId: courseId.toString(),
        courseName: course.title,
        specialistEmail: course.specialistEmail,
      },
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment intent',
        error: paymentResult.error,
      });
    }

    // Create commission tracking record
    const commission = await MarketplaceCommission.create({
      paymentIntentId: paymentResult.paymentIntentId,
      customerId,
      customerEmail,
      specialistId: course.specialistId.toString(),
      specialistEmail: course.specialistEmail,
      stripeAccountId: specialist.stripeAccountId,
      serviceId: courseId,
      serviceType: 'course',
      serviceName: course.title,
      grossAmount: amountInCents,
      commissionPercentage: specialist.commissionPercentage || commissionPercentage,
      commissionAmount: paymentResult.commissionAmount,
      specialistPayout: paymentResult.specialistPayout,
      status: 'pending',
      paymentStatus: 'pending',
    });

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentResult.paymentIntentId,
      clientSecret: paymentResult.clientSecret,
      commissionRecord: commission._id,
      amount: amountInCents / 100,
      commissionAmount: paymentResult.commissionAmount / 100,
      specialistPayout: paymentResult.specialistPayout / 100,
    });
  } catch (error) {
    console.error('Error creating marketplace payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get or create specialist Stripe onboarding link
 * POST /api/marketplace/specialist/onboarding-link
 */
export const getSpecialistOnboardingLink = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const specialist = await CreatorProfile.findOne({ _id: specialistId });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist profile not found',
      });
    }

    // If already connected and active, return account status
    if (specialist.stripeAccountId && specialist.stripeConnectStatus === 'active') {
      const accountStatus = await stripeService.getSpecialistAccountStatus(
        specialist.stripeAccountId
      );

      return res.status(200).json({
        success: true,
        message: 'Already connected',
        accountId: specialist.stripeAccountId,
        status: 'active',
        accountStatus,
      });
    }

    // If onboarding link exists and hasn't expired, return it
    if (
      specialist.stripeConnectUrl &&
      specialist.stripeOnboardingExpires &&
      new Date() < specialist.stripeOnboardingExpires
    ) {
      return res.status(200).json({
        success: true,
        onboardingUrl: specialist.stripeConnectUrl,
        expiresAt: specialist.stripeOnboardingExpires,
      });
    }

    // Create new Express account for specialist
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Adjust based on specialist location
        email: specialist.email,
        business_profile: {
          name: specialist.creatorName,
          product_category: 'education',
          url: 'https://specialistly.com',
          support_email: specialist.email,
        },
      });

      // Generate onboarding link (valid for 24 hours)
      const onboardingLink = await stripe.accountLinks.create({
        account: account.id,
        type: 'account_onboarding',
        return_url: `${process.env.FRONTEND_URL}/dashboard/stripe-connected?status=success&account_id=${account.id}`,
        refresh_url: `${process.env.FRONTEND_URL}/dashboard/earnings`,
        collection_options: {
          fields: 'eventually_due',
          future_requirements: 'include',
        },
      });

      // Update specialist with account info
      specialist.stripeAccountId = account.id;
      specialist.stripeConnectStatus = 'pending';
      specialist.stripeConnectUrl = onboardingLink.url;
      specialist.stripeOnboardingExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );
      await specialist.save();

      return res.status(200).json({
        success: true,
        message: 'Onboarding link created',
        onboardingUrl: onboardingLink.url,
        expiresAt: specialist.stripeOnboardingExpires,
        accountId: account.id,
      });
    } catch (error) {
      console.error('Error creating Stripe Express account:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create Stripe account',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Error in getSpecialistOnboardingLink:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Check specialist Stripe account status
 * GET /api/marketplace/specialist/status
 */
export const getSpecialistStatus = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const specialist = await CreatorProfile.findOne({ _id: specialistId });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist profile not found',
      });
    }

    if (!specialist.stripeAccountId) {
      return res.status(200).json({
        success: true,
        status: 'not_connected',
        message: 'Not yet connected to Stripe',
      });
    }

    const accountStatus = await stripeService.getSpecialistAccountStatus(
      specialist.stripeAccountId
    );

    // Update specialist status if account is now active
    if (
      accountStatus.success &&
      accountStatus.chargesEnabled &&
      accountStatus.payoutsEnabled
    ) {
      specialist.stripeConnectStatus = 'active';
      await specialist.save();
    }

    return res.status(200).json({
      success: true,
      status: specialist.stripeConnectStatus,
      accountId: specialist.stripeAccountId,
      accountStatus,
    });
  } catch (error) {
    console.error('Error getting specialist status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get specialist earnings and balance
 * GET /api/marketplace/specialist/earnings
 */
export const getSpecialistEarnings = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const specialist = await CreatorProfile.findOne({ _id: specialistId });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist profile not found',
      });
    }

    if (!specialist.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Specialist not connected to Stripe',
      });
    }

    // Get balance from Stripe
    const balance = await stripeService.getSpecialistBalance(
      specialist.stripeAccountId
    );

    // Get commission records
    const commissions = await MarketplaceCommission.aggregate([
      {
        $match: {
          specialistId: specialist._id.toString(),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: '$specialistPayout' },
          totalCommissions: { $sum: '$commissionAmount' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const stats = commissions[0] || {
      totalPayouts: 0,
      totalCommissions: 0,
      totalTransactions: 0,
    };

    return res.status(200).json({
      success: true,
      earnings: {
        totalPayouts: stats.totalPayouts / 100, // Convert to dollars
        totalCommissionsPaid: stats.totalCommissions / 100,
        totalTransactions: stats.totalTransactions,
        lastPayoutDate: specialist.lastPayoutDate,
      },
      balance: balance.success
        ? {
            available: balance.available,
            pending: balance.pending,
          }
        : null,
    });
  } catch (error) {
    console.error('Error getting specialist earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get specialist login link to Stripe dashboard
 * POST /api/marketplace/specialist/dashboard-link
 */
export const getSpecialistDashboardLink = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const specialist = await CreatorProfile.findOne({ _id: specialistId });
    if (!specialist?.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Specialist not connected to Stripe',
      });
    }

    const loginLink = await stripeService.createSpecialistLoginLink(
      specialist.stripeAccountId
    );

    if (!loginLink.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate dashboard link',
        error: loginLink.error,
      });
    }

    return res.status(200).json({
      success: true,
      dashboardUrl: loginLink.url,
      expiresIn: '30 minutes',
    });
  } catch (error) {
    console.error('Error getting specialist dashboard link:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get commission records for a specialist
 * GET /api/marketplace/specialist/commissions
 */
export const getSpecialistCommissions = async (req, res) => {
  try {
    const specialistId = req.user?.userId;
    const { status, startDate, endDate, limit = 50, page = 1 } = req.query;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const filter = { specialistId };
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const commissions = await MarketplaceCommission.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await MarketplaceCommission.countDocuments(filter);

    return res.status(200).json({
      success: true,
      commissions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting specialist commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Disconnect specialist Stripe account
 * POST /api/marketplace/specialist/disconnect
 */
export const disconnectStripeAccount = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const specialist = await CreatorProfile.findOne({ _id: specialistId });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist profile not found',
      });
    }

    if (!specialist.stripeAccountId) {
      return res.status(200).json({
        success: true,
        message: 'No Stripe account connected',
      });
    }

    // Clear Stripe fields
    specialist.stripeAccountId = null;
    specialist.stripeConnectStatus = 'not_connected';
    specialist.stripeConnectUrl = null;
    specialist.stripeOnboardingExpires = null;
    await specialist.save();

    return res.status(200).json({
      success: true,
      message: 'Stripe account disconnected successfully',
      status: 'not_connected',
    });
  } catch (error) {
    console.error('Error disconnecting Stripe account:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
