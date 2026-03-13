import { stripeService } from '../services/stripeService.js';
import { razorpayService } from '../services/razorpayService.js';
import MarketplaceCommission from '../models/MarketplaceCommission.js';
import CreatorProfile from '../models/CreatorProfile.js';
import Course from '../models/Course.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import mongoose from 'mongoose';

/**
 * Create payment intent for public (guest) course purchase
 * POST /api/public/course-purchase/create-intent
 * No authentication required - collects customer email/name
 */
export const createPublicPaymentIntent = async (req, res) => {
  try {
    const {
      courseId,
      customerEmail,
      customerName,
      commissionPercentage = 15,
    } = req.body;

    // Validate input
    if (!courseId || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, customerEmail, customerName',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID',
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

    // Use email as guest customer ID
    const customerId = `guest_${customerEmail}`;

    // Check duplicate enrollment
    const existingEnrollment = await SelfPacedEnrollment.findOne({
      customerEmail,
      courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'This email is already enrolled in this course',
        code: 'DUPLICATE_ENROLLMENT',
      });
    }

    // Get specialist account
    const specialist = await CreatorProfile.findOne({
      email: course.specialistEmail,
    });

    // Auto-select payment gateway based on course currency
    const courseCurrency = course.currency || 'USD';
    let paymentGateway = 'stripe';

    if (courseCurrency === 'INR') {
      paymentGateway = 'razorpay';
    } else if (courseCurrency === 'USD') {
      paymentGateway = 'stripe';
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported currency: ${courseCurrency}`,
      });
    }

    // For Stripe: Check specialist onboarding
    if (paymentGateway === 'stripe') {
      if (!specialist?.stripeAccountId || specialist.stripeConnectStatus !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Payment is not available for this course at the moment.',
          code: 'SPECIALIST_NOT_ONBOARDED',
        });
      }
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

    // Create Stripe payment
    if (paymentGateway === 'stripe') {
      const stripeCurrency = courseCurrency.toLowerCase();

      // Create Stripe customer
      const stripeCustomerResult = await stripeService.createCustomer({
        email: customerEmail,
        name: customerName,
        metadata: { guestPurchase: 'true' },
      });

      if (!stripeCustomerResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment customer',
        });
      }

      // Create marketplace payment intent
      const amountInCents = Math.round(amount * 100);
      const paymentResult = await stripeService.createMarketplacePaymentIntent({
        amount: amountInCents,
        specialistStripeAccountId: specialist.stripeAccountId,
        commissionPercentage: specialist.commissionPercentage || commissionPercentage,
        stripeCustomerId: stripeCustomerResult.customerId,
        currency: stripeCurrency,
        description: `${course.title} - Course enrollment`,
        metadata: {
          courseId: courseId.toString(),
          courseName: course.title,
          specialistEmail: course.specialistEmail,
          guestPurchase: 'true',
          customerEmail,
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
        paymentGateway: 'stripe',
        customerId,
        customerEmail,
        specialistId: course.specialistId.toString(),
        specialistEmail: course.specialistEmail,
        stripeAccountId: specialist.stripeAccountId,
        serviceId: courseId,
        serviceType: 'course',
        serviceName: course.title,
        grossAmount: amountInCents,
        currency: course.currency,
        commissionPercentage: specialist.commissionPercentage || commissionPercentage,
        commissionAmount: paymentResult.commissionAmount,
        specialistPayout: paymentResult.specialistPayout,
        status: 'pending',
        paymentStatus: 'pending',
      });

      return res.status(200).json({
        success: true,
        paymentGateway: 'stripe',
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        amount: amountInCents / 100,
      });
    }

    // Create Razorpay order
    if (paymentGateway === 'razorpay') {
      const amountInPaise = Math.round(amount * 100);
      const orderResult = await razorpayService.createOrder({
        amount: amountInPaise,
        currency: 'INR',
        customerId,
        customerEmail,
        description: `${course.title} - Course enrollment`,
        metadata: {
          courseId: courseId.toString(),
          courseName: course.title,
          specialistEmail: course.specialistEmail,
          guestPurchase: 'true',
          customerEmail,
        },
      });

      if (!orderResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create payment order',
        });
      }

      const commPct = specialist?.commissionPercentage || commissionPercentage;
      const commissionAmountPaise = Math.round(amountInPaise * commPct / 100);
      const specialistPayoutPaise = amountInPaise - commissionAmountPaise;

      await MarketplaceCommission.create({
        razorpayOrderId: orderResult.orderId,
        paymentGateway: 'razorpay',
        customerId,
        customerEmail,
        specialistId: course.specialistId.toString(),
        specialistEmail: course.specialistEmail,
        serviceId: courseId,
        serviceType: 'course',
        serviceName: course.title,
        grossAmount: amountInPaise,
        currency: course.currency,
        commissionPercentage: commPct,
        commissionAmount: commissionAmountPaise,
        specialistPayout: specialistPayoutPaise,
        status: 'pending',
        paymentStatus: 'pending',
      });

      return res.status(200).json({
        success: true,
        paymentGateway: 'razorpay',
        orderId: orderResult.orderId,
        amount: amountInPaise / 100,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }
  } catch (error) {
    console.error('Error creating public payment intent:', error);
    // Return friendly message for known errors
    let friendlyMessage = 'Something went wrong. Please try again.';
    if (error.code === 11000) {
      friendlyMessage = 'A payment is already being processed. Please wait a moment and try again.';
    }
    res.status(500).json({
      success: false,
      message: friendlyMessage,
    });
  }
};

/**
 * Confirm public course payment and create enrollment
 * POST /api/public/course-purchase/confirm-payment
 * No authentication required - uses paymentIntentId + customerEmail for verification
 */
export const confirmPublicPayment = async (req, res) => {
  try {
    const { paymentIntentId, customerEmail } = req.body;

    if (!paymentIntentId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId and customerEmail are required',
      });
    }

    // Find commission record
    const commission = await MarketplaceCommission.findOne({ paymentIntentId });

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify customer email matches
    if (commission.customerEmail !== customerEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check Stripe payment status
    const paymentIntentResult = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (!paymentIntentResult?.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to retrieve payment status',
      });
    }

    if (paymentIntentResult.status === 'succeeded') {
      // Update commission
      commission.status = 'completed';
      commission.paymentStatus = 'succeeded';
      commission.paymentCompletedAt = new Date();
      await commission.save();

      // Create or find enrollment
      let enrollment = await SelfPacedEnrollment.findOne({
        customerEmail: commission.customerEmail,
        courseId: commission.serviceId,
      });

      if (!enrollment) {
        enrollment = await SelfPacedEnrollment.create({
          customerId: commission.customerId,
          customerEmail: commission.customerEmail,
          specialistId: commission.specialistId,
          specialistEmail: commission.specialistEmail,
          courseId: commission.serviceId,
          paymentStatus: 'completed',
          status: 'active',
          stripePaymentId: paymentIntentId,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed and enrollment created',
        enrollmentId: enrollment._id,
        status: 'succeeded',
      });
    } else if (paymentIntentResult.status === 'processing') {
      return res.status(200).json({
        success: false,
        message: 'Payment is still processing',
        status: 'processing',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment could not be confirmed',
        status: paymentIntentResult.status,
      });
    }
  } catch (error) {
    console.error('Error confirming public payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
