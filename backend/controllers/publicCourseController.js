import { stripeService } from '../services/stripeService.js';
import { razorpayService } from '../services/razorpayService.js';
import MarketplaceCommission from '../models/MarketplaceCommission.js';
import CreatorProfile from '../models/CreatorProfile.js';
import Course from '../models/Course.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import Customer from '../models/Customer.js';
import Coupon from '../models/Coupon.js';
import { sendEnrollmentConfirmation, sendCohortEnrollmentConfirmation, sendSpecialistNotification } from '../services/emailService.js';
import mongoose from 'mongoose';

/**
 * Find or create a Customer record and link the specialist + enrollment.
 */
async function linkCustomerToSpecialist({ customerEmail, customerName, specialistEmail, specialistId, courseId, courseTitle, amount }) {
  try {
    let customer = await Customer.findOne({ email: customerEmail });
    if (!customer) {
      customer = await Customer.create({
        name: customerName || customerEmail.split('@')[0],
        email: customerEmail,
        status: 'active',
      });
    }

    // Add specialist if not already linked
    const hasSpecialist = customer.specialists?.some(
      (s) => s.specialistEmail === specialistEmail,
    );
    if (!hasSpecialist) {
      customer.specialists.push({
        specialistId,
        specialistEmail,
        firstBookedDate: new Date(),
      });
    }

    // Add enrollment if not already present
    const hasEnrollment = customer.enrollments?.some(
      (e) => e.courseId?.toString() === courseId?.toString(),
    );
    if (!hasEnrollment) {
      customer.enrollments.push({
        courseId,
        enrolledAt: new Date(),
        status: 'active',
      });
    }

    // Add purchase record
    customer.purchases.push({
      offeringTitle: courseTitle || 'Course',
      offeringType: 'course',
      offeringId: courseId,
      price: String(amount || 0),
      status: 'completed',
    });

    if (amount > 0) {
      customer.totalSpent = (customer.totalSpent || 0) + Number(amount);
    }
    customer.purchaseCount = (customer.purchaseCount || 0) + 1;
    customer.updatedAt = new Date();

    await customer.save();
  } catch (err) {
    console.error('linkCustomerToSpecialist error (non-blocking):', err.message);
  }
}

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
      couponCode,
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

    // Use real userId if authenticated, otherwise guest prefix
    const customerId = req.user?.userId || `guest_${customerEmail}`;
    const isAuthenticated = !!req.user?.userId;

    // For cohort courses, block enrollment after start date
    if ((course.courseType === 'cohort' || course.courseType === 'cohort-based') && course.startDate) {
      const now = new Date();
      const startDate = new Date(course.startDate);
      if (now >= startDate) {
        return res.status(400).json({
          success: false,
          message: 'Enrollment for this course has closed. The course has already started.',
          code: 'ENROLLMENT_CLOSED',
        });
      }
    }

    // Check duplicate enrollment (by userId if authenticated, or by email for guests)
    const enrollmentQuery = isAuthenticated
      ? { $or: [{ customerId, courseId }, { customerEmail, courseId }], status: { $in: ['active', 'completed'] } }
      : { customerEmail, courseId, status: { $in: ['active', 'completed'] } };
    const existingEnrollment = await SelfPacedEnrollment.findOne(enrollmentQuery);

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
    let useSpecialistRazorpay = false;

    if (courseCurrency === 'INR') {
      // Priority: specialist's own Razorpay > platform domestic Razorpay > Stripe
      if (specialist?.razorpayConfigured && specialist.razorpayKeyId && specialist.razorpayKeySecret) {
        paymentGateway = 'razorpay';
        useSpecialistRazorpay = true;
      } else if (!razorpayService.isInternationalAccount()) {
        paymentGateway = 'razorpay';
      } else {
        paymentGateway = 'stripe';
      }
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

    // Coupon logic (authenticated users only)
    let discountAmount = 0;
    let appliedCoupon = null;
    let amount = course.price || 0;
    if (couponCode && req.user?.userId) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        course: course._id,
        isActive: true,
      });
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
      }
      if (isCouponExpired(coupon.expiresAt)) {
        return res.status(400).json({ success: false, message: 'Coupon expired' });
      }
      if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
        return res.status(400).json({ success: false, message: 'Coupon fully redeemed' });
      }
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((amount * coupon.discountValue) / 100);
      } else if (coupon.discountType === 'fixed') {
        discountAmount = Math.round(coupon.discountValue);
      }
      if (discountAmount > amount) discountAmount = amount;
      amount = amount - discountAmount;
      appliedCoupon = coupon;
    }

    // Free course - direct enrollment
    if (amount === 0) {
      const enrollment = await SelfPacedEnrollment.create({
        customerId,
        customerEmail,
        specialistId: course.specialistId,
        specialistEmail: course.specialistEmail,
        courseId,
        paymentStatus: 'completed',
        status: 'active',
        amount: 0,
      });

      // Send confirmation emails for free course
      try {
        if (course.courseType === 'cohort' || course.courseType === 'cohort-based') {
          await sendCohortEnrollmentConfirmation({
            customerEmail,
            customerName: customerName || customerEmail.split('@')[0],
            courseName: course.title,
            enrollmentId: enrollment._id.toString(),
            startDate: course.startDate,
            endDate: course.endDate,
            schedule: course.schedule,
            meetingPlatform: course.meetingPlatform,
            zoomLink: course.zoomLink,
            purchaseNote: course.purchaseNote,
          });
        } else {
          await sendEnrollmentConfirmation({
            customerEmail,
            customerName: customerName || customerEmail.split('@')[0],
            courseName: course.title,
            enrollmentId: enrollment._id.toString(),
            purchaseNote: course.purchaseNote,
          });
        }
        await sendSpecialistNotification({
          specialistEmail: course.specialistEmail,
          specialistName: course.specialistEmail.split('@')[0],
          enrollmentEmail: customerEmail,
          courseName: course.title,
          courseType: course.courseType,
          zoomLink: course.zoomLink,
          meetingPlatform: course.meetingPlatform,
          startDate: course.startDate,
          schedule: course.schedule,
        });
      } catch (emailErr) {
        console.error('Email sending failed (non-blocking):', emailErr.message);
      }

      // Link customer to specialist
      await linkCustomerToSpecialist({
        customerEmail,
        customerName,
        specialistEmail: course.specialistEmail,
        specialistId: course.specialistId,
        courseId,
        courseTitle: course.title,
        amount: 0,
      });

      // Increment coupon redemptions if coupon was applied
      if (appliedCoupon) {
        appliedCoupon.redemptions += 1;
        await appliedCoupon.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Enrolled in free course',
        enrollmentId: enrollment._id,
        isFree: true,
        discountAmount,
        couponCode: couponCode || null,
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

      // Increment coupon redemptions
      if (appliedCoupon) {
        appliedCoupon.redemptions += 1;
        await appliedCoupon.save();
      }

      return res.status(200).json({
        success: true,
        paymentGateway: 'stripe',
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        amount: amountInCents / 100,
        discountAmount,
        couponCode: couponCode || null,
      });
    }

    // Create Razorpay order
    if (paymentGateway === 'razorpay') {
      const razorpayCurrency = useSpecialistRazorpay ? courseCurrency : razorpayService.getSupportedCurrency();
      const amountInSmallestUnit = Math.round(amount * 100);

      let orderResult;
      if (useSpecialistRazorpay) {
        // Use specialist's own Razorpay credentials — payment goes directly to their account
        orderResult = await razorpayService.createOrderWithSpecialistKeys({
          specialistKeyId: specialist.razorpayKeyId,
          specialistKeySecret: specialist.razorpayKeySecret,
          amount: amountInSmallestUnit,
          currency: razorpayCurrency,
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
      } else {
        // Use platform's global Razorpay credentials
        orderResult = await razorpayService.createOrder({
          amount: amountInSmallestUnit,
          currency: razorpayCurrency,
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
      }

      if (!orderResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create payment order',
        });
      }

      const commPct = specialist?.commissionPercentage || commissionPercentage;
      const commissionAmount = Math.round(amountInSmallestUnit * commPct / 100);
      const specialistPayout = amountInSmallestUnit - commissionAmount;

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
        grossAmount: amountInSmallestUnit,
        currency: razorpayCurrency,
        commissionPercentage: commPct,
        commissionAmount: commissionAmount,
        specialistPayout: specialistPayout,
        status: 'pending',
        paymentStatus: 'pending',
        useSpecialistRazorpay: useSpecialistRazorpay || false,
      });

      // Increment coupon redemptions
      if (appliedCoupon) {
        appliedCoupon.redemptions += 1;
        await appliedCoupon.save();
      }

      return res.status(200).json({
        success: true,
        paymentGateway: 'razorpay',
        orderId: orderResult.orderId,
        amount: amountInSmallestUnit / 100,
        currency: razorpayCurrency,
        keyId: useSpecialistRazorpay ? specialist.razorpayKeyId : process.env.RAZORPAY_KEY_ID,
        discountAmount,
        couponCode: couponCode || null,
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
          amount: commission.grossAmount ? Math.round(commission.grossAmount / 100) : 0,
        });
      }

      // Send confirmation emails
      try {
        const course = await Course.findById(commission.serviceId);
        if (course && (course.courseType === 'cohort' || course.courseType === 'cohort-based')) {
          await sendCohortEnrollmentConfirmation({
            customerEmail: commission.customerEmail,
            customerName: commission.customerEmail.split('@')[0],
            courseName: course.title,
            enrollmentId: enrollment._id.toString(),
            startDate: course.startDate,
            endDate: course.endDate,
            schedule: course.schedule,
            meetingPlatform: course.meetingPlatform,
            zoomLink: course.zoomLink,
            purchaseNote: course.purchaseNote,
          });
        } else if (course) {
          await sendEnrollmentConfirmation({
            customerEmail: commission.customerEmail,
            customerName: commission.customerEmail.split('@')[0],
            courseName: course.title,
            enrollmentId: enrollment._id.toString(),
            purchaseNote: course.purchaseNote,
          });
        }
        // Notify specialist
        if (course) {
          await sendSpecialistNotification({
            specialistEmail: commission.specialistEmail,
            specialistName: commission.specialistEmail.split('@')[0],
            enrollmentEmail: commission.customerEmail,
            courseName: course.title,
            courseType: course.courseType,
            zoomLink: course.zoomLink,
            meetingPlatform: course.meetingPlatform,
            startDate: course.startDate,
            schedule: course.schedule,
          });
        }
      } catch (emailErr) {
        console.error('Email sending failed (non-blocking):', emailErr.message);
      }

      // Link customer to specialist
      const confirmedCourse = await Course.findById(commission.serviceId);
      await linkCustomerToSpecialist({
        customerEmail: commission.customerEmail,
        customerName: commission.customerEmail.split('@')[0],
        specialistEmail: commission.specialistEmail,
        specialistId: commission.specialistId,
        courseId: commission.serviceId,
        courseTitle: confirmedCourse?.title,
        amount: commission.totalAmount || 0,
      });

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

/**
 * Confirm Razorpay public course payment and create enrollment
 * POST /api/public/course-purchase/confirm-razorpay
 */
export const confirmRazorpayPublicPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'razorpayOrderId and razorpayPaymentId are required',
      });
    }

    // Find commission record
    const commission = await MarketplaceCommission.findOne({ razorpayOrderId });

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Verify signature if available
    if (razorpaySignature) {
      let verification;

      // If this order used specialist's Razorpay keys, verify with their secret
      if (commission.useSpecialistRazorpay) {
        const specialist = await CreatorProfile.findOne({ email: commission.specialistEmail });
        if (specialist?.razorpayKeySecret) {
          verification = razorpayService.verifyPaymentSignatureWithSecret(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            specialist.razorpayKeySecret,
          );
        } else {
          return res.status(400).json({
            success: false,
            message: 'Specialist Razorpay configuration not found for verification',
          });
        }
      } else {
        verification = await razorpayService.verifyPaymentSignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        );
      }

      if (!verification.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed',
        });
      }
    }

    // Update commission
    commission.status = 'completed';
    commission.paymentStatus = 'succeeded';
    commission.paymentCompletedAt = new Date();
    commission.razorpayPaymentId = razorpayPaymentId;
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
        paymentGateway: 'razorpay',
        razorpayOrderId,
        razorpayPaymentId,
        amount: commission.grossAmount ? Math.round(commission.grossAmount / 100) : 0,
      });
    } else if (enrollment.status !== 'active') {
      enrollment.paymentStatus = 'completed';
      enrollment.status = 'active';
      enrollment.razorpayOrderId = razorpayOrderId;
      enrollment.razorpayPaymentId = razorpayPaymentId;
      await enrollment.save();
    }

    // Send confirmation emails
    try {
      const course = await Course.findById(commission.serviceId);
      if (course && (course.courseType === 'cohort' || course.courseType === 'cohort-based')) {
        await sendCohortEnrollmentConfirmation({
          customerEmail: commission.customerEmail,
          customerName: commission.customerEmail.split('@')[0],
          courseName: course.title,
          enrollmentId: enrollment._id.toString(),
          startDate: course.startDate,
          endDate: course.endDate,
          schedule: course.schedule,
          meetingPlatform: course.meetingPlatform,
          zoomLink: course.zoomLink,
          purchaseNote: course.purchaseNote,
        });
      } else if (course) {
        await sendEnrollmentConfirmation({
          customerEmail: commission.customerEmail,
          customerName: commission.customerEmail.split('@')[0],
          courseName: course.title,
          enrollmentId: enrollment._id.toString(),
          purchaseNote: course.purchaseNote,
        });
      }
      // Notify specialist
      if (course) {
        await sendSpecialistNotification({
          specialistEmail: commission.specialistEmail,
          specialistName: commission.specialistEmail.split('@')[0],
          enrollmentEmail: commission.customerEmail,
          courseName: course.title,
          courseType: course.courseType,
          zoomLink: course.zoomLink,
          meetingPlatform: course.meetingPlatform,
          startDate: course.startDate,
          schedule: course.schedule,
        });
      }
    } catch (emailErr) {
      console.error('Email sending failed (non-blocking):', emailErr.message);
    }

    // Link customer to specialist
    const razorpayCourse = await Course.findById(commission.serviceId);
    await linkCustomerToSpecialist({
      customerEmail: commission.customerEmail,
      customerName: commission.customerEmail.split('@')[0],
      specialistEmail: commission.specialistEmail,
      specialistId: commission.specialistId,
      courseId: commission.serviceId,
      courseTitle: razorpayCourse?.title,
      amount: commission.totalAmount || 0,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed and enrollment created',
      enrollmentId: enrollment._id,
      status: 'succeeded',
    });
  } catch (error) {
    console.error('Error confirming Razorpay public payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
