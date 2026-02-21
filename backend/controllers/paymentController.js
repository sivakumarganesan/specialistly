import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import CommissionConfig from '../models/CommissionConfig.js';
import { stripeService } from '../services/stripeService.js';
import { sendEnrollmentConfirmation, sendSpecialistNotification } from '../services/emailService.js';
import mongoose from 'mongoose';

/**
 * Create Payment Intent
 * POST /api/payments/create-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { serviceId, serviceType, customerId, customerEmail } = req.body;
    const authenticatedUserId = req.user?.userId;

    // Validate input
    if (!serviceId || !serviceType || !customerId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Verify user owns this payment attempt
    if (authenticatedUserId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check for existing pending/completed payment (prevent duplicates)
    const existingPayment = await Payment.findOne({
      customerId,
      serviceId,
      status: { $in: ['pending', 'completed'] },
      createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 minutes
    });

    if (existingPayment?.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course/service',
        code: 'DUPLICATE_ENROLLMENT',
      });
    }

    if (existingPayment?.status === 'pending') {
      // Return existing payment intent for retry
      return res.status(200).json({
        success: true,
        paymentIntentId: existingPayment.paymentId,
        clientSecret: existingPayment.stripeResponse?.client_secret,
        message: 'Payment already in progress',
        idempotencyKey: existingPayment.idempotencyKey,
      });
    }

    // Fetch service/course details
    let service;
    let specialist;

    if (serviceType === 'course') {
      service = await Course.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }
      specialist = { _id: service.specialistId, email: service.specialistEmail };
    } else {
      // For services, fetch from Service model
      // Assume similar structure
      return res.status(400).json({
        success: false,
        message: 'Service payment not yet implemented',
      });
    }

    // Validate amount
    const amount = service.price || 0;
    if (amount === 0) {
      // Free course - create enrollment directly
      const enrollment = await Enrollment.create({
        customerId,
        customerEmail,
        specialistId: specialist._id,
        specialistEmail: specialist.email,
        courseId: serviceId,
        paymentStatus: 'completed',
        status: 'active',
      });

      return res.status(200).json({
        success: true,
        message: 'Enrolled to free course',
        enrollmentId: enrollment._id,
        isFree: true,
      });
    }

    // Generate idempotency key
    const idempotencyKey = `${customerId}-${serviceId}-${Date.now()}`;

    // Create Stripe customer if not exists
    const customerResult = await stripeService.createCustomer({
      email: customerEmail,
      name: req.user?.name || customerEmail,
      metadata: {
        userId: customerId,
      },
    });

    if (!customerResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment customer',
      });
    }

    // Create payment intent with Stripe
    const paymentIntentResult = await stripeService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'INR',
      customerId: customerResult.customerId,
      description: `${serviceType === 'course' ? 'Course' : 'Service'}: ${service.title}`,
      metadata: {
        customerId,
        serviceId: serviceId.toString(),
        serviceType,
        serviceName: service.title,
        idempotencyKey,
      },
    });

    if (!paymentIntentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: paymentIntentResult.error,
      });
    }

    // Get commission configuration
    const commissionConfig = await CommissionConfig.getCurrentRates();
    const commissionalBreakdown = commissionConfig.calculateCommission(
      Math.round(amount * 100),
      serviceType
    );

    // Create Payment record in MongoDB with commission info
    const payment = await Payment.create({
      paymentId: paymentIntentResult.paymentIntentId,
      customerId,
      customerEmail,
      specialistId: specialist._id,
      specialistEmail: specialist.email,
      serviceId,
      serviceType,
      serviceName: service.title,
      amount: Math.round(amount * 100),
      currency: 'INR',
      status: 'pending',
      idempotencyKey,
      commissionPercentage: commissionalBreakdown.commissionPercentage,
      commissionAmount: commissionalBreakdown.platformCommission,
      specialistEarnings: commissionalBreakdown.specialistEarnings,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
      stripeResponse: paymentIntentResult,
    });

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntentResult.paymentIntentId,
      clientSecret: paymentIntentResult.clientSecret,
      amount: amount,
      currency: 'INR',
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    });
  }
};

/**
 * Confirm Payment (verified by webhook, but client can call this too)
 * POST /api/payments/confirm-payment
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const authenticatedUserId = req.user?.userId;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID required',
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ paymentId: paymentIntentId }).populate(
      'serviceId'
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify ownership
    if (payment.customerId.toString() !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check Stripe for payment status
    const paymentIntentResult = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (!paymentIntentResult.success) {
      return res.status(400).json({
        success: false,
        message: paymentIntentResult.error,
      });
    }

    if (paymentIntentResult.status === 'succeeded') {
      // Update payment status
      payment.status = 'completed';
      payment.stripePaymentStatus = 'succeeded';
      payment.webhookReceivedAt = new Date();
      await payment.save();

      // Check if enrollment exists
      let enrollment = await Enrollment.findOne({
        customerId: payment.customerId,
        courseId: payment.serviceId,
      });

      if (!enrollment) {
        // Create enrollment
        enrollment = await Enrollment.create({
          customerId: payment.customerId,
          customerEmail: payment.customerEmail,
          specialistId: payment.specialistId,
          specialistEmail: payment.specialistEmail,
          courseId: payment.serviceId,
          paymentStatus: 'completed',
          status: 'active',
          paymentId: payment._id,
          paymentDate: new Date(),
        });
      } else {
        // Update existing enrollment
        enrollment.paymentStatus = 'completed';
        enrollment.status = 'active';
        enrollment.paymentId = payment._id;
        enrollment.paymentDate = new Date();
        await enrollment.save();
      }

      // Send confirmation emails
      await Promise.all([
        sendEnrollmentConfirmation({
          customerEmail: payment.customerEmail,
          customerName: req.user?.name || payment.customerEmail,
          courseName: payment.serviceName,
          enrollmentId: enrollment._id,
        }),
        sendSpecialistNotification({
          specialistEmail: payment.specialistEmail,
          specialistName: payment.specialistEmail,
          enrollmentEmail: payment.customerEmail,
          courseName: payment.serviceName,
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed and enrollment activated',
        enrollmentId: enrollment._id,
        paymentId: payment._id,
      });
    } else if (paymentIntentResult.status === 'processing') {
      return res.status(202).json({
        success: true,
        message: 'Payment is processing',
        status: 'processing',
        paymentId: payment._id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment failed or not completed',
        status: paymentIntentResult.status,
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message,
    });
  }
};

/**
 * Get Payment Details
 * GET /api/payments/:paymentId
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const authenticatedUserId = req.user?.userId;

    const payment = await Payment.findById(paymentId).select(
      'paymentId customerId customerEmail specialistId specialistEmail amount currency status createdAt serviceName'
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check ownership (customer or specialist)
    if (
      payment.customerId.toString() !== authenticatedUserId &&
      payment.specialistId.toString() !== authenticatedUserId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: payment._id,
        paymentId: payment.paymentId,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        serviceName: payment.serviceName,
        customerEmail: payment.customerEmail,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message,
    });
  }
};

/**
 * Get Payment History for Customer
 * GET /api/payments/history/customer
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const authenticatedUserId = req.user?.userId;
    const { limit = 10, skip = 0 } = req.query;

    const payments = await Payment.find({
      customerId: authenticatedUserId,
    })
      .select('paymentId amount currency status serviceName createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Payment.countDocuments({
      customerId: authenticatedUserId,
    });

    return res.status(200).json({
      success: true,
      data: payments,
      total,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

/**
 * Process Refund
 * POST /api/payments/:paymentId/refund
 */
export const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const authenticatedUserId = req.user?.userId;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Only specialist or admin can refund
    if (payment.specialistId.toString() !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only specialist can process refunds',
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments',
      });
    }

    // Process refund with Stripe
    const refundResult = await stripeService.processRefund(
      payment.paymentId,
      null, // Full refund
      reason || 'requested_by_customer'
    );

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: refundResult.error,
      });
    }

    // Update payment record
    payment.status = 'refunded';
    payment.refundId = refundResult.refundId;
    payment.refundedAmount = refundResult.amount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    // Update enrollment if exists
    const enrollment = await Enrollment.findOne({
      paymentId: payment._id,
    });

    if (enrollment) {
      enrollment.status = 'refunded';
      enrollment.paymentStatus = 'refunded';
      await enrollment.save();
    }

    // Send refund notification emails
    await Promise.all([
      sendEnrollmentConfirmation({
        customerEmail: payment.customerEmail,
        customerName: payment.customerEmail,
        courseName: payment.serviceName,
        type: 'refund',
        amount: payment.amount / 100,
      }),
      sendSpecialistNotification({
        specialistEmail: payment.specialistEmail,
        type: 'refund_processed',
        amount: payment.amount / 100,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refundId: refundResult.refundId,
      refundedAmount: refundResult.amount / 100,
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  }
};

/**
 * Get Specialist Payment Statistics
 * GET /api/payments/specialist/statistics
 */
export const getSpecialistStatistics = async (req, res) => {
  try {
    const authenticatedUserId = req.user?.userId;
    const { period = 'month' } = req.query;

    const stats = await Payment.aggregate([
      {
        $match: {
          specialistId: mongoose.Types.ObjectId(authenticatedUserId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$currency',
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
        },
      },
    ]);

    // Get recent payments
    const recentPayments = await Payment.find({
      specialistId: authenticatedUserId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('paymentId amount currency customerEmail serviceName createdAt');

    return res.status(200).json({
      success: true,
      statistics: stats,
      recentPayments,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};
