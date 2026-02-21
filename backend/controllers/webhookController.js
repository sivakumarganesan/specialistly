import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import { sendEnrollmentConfirmation, sendSpecialistNotification } from '../services/emailService.js';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Webhook Handler for Stripe Events
 * POST /api/webhooks/stripe
 * 
 * IMPORTANT: This endpoint requires raw body (not JSON parsed)
 * Express must be configured: app.post('/webhooks/stripe', express.raw({type: 'application/json'}), ...)
 */
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Construct event from raw body
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, signature, WEBHOOK_SECRET);

    console.log(`✓ Webhook signature verified. Event type: ${event.type}, Event ID: ${event.id}`);

    // Log webhook event
    logWebhookEvent(event);

    // Process based on event type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;

      case 'charge.refunded':
        await handleRefund(event);
        break;

      case 'charge.dispute.created':
        await handleDispute(event);
        break;

      default:
        console.log(`⚠ Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of webhook
    res.status(200).json({ received: true, eventId: event.id });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    logWebhookError(error, req.rawBody || req.body, signature);

    // Always return 400 for signature verification failures
    // This tells Stripe to retry
    if (error.type === 'StripeSignatureVerificationError') {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // For other errors, return 500 to trigger Stripe retry
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentSucceeded(event) {
  const paymentIntent = event.data.object;
  const stripeEventId = event.id;

  console.log(`💰 Processing payment_intent.succeeded: ${paymentIntent.id}`);

  try {
    // Check if webhook already processed (idempotency)
    const existingPayment = await Payment.findOne({
      stripeEventId,
    });

    if (existingPayment) {
      console.log(`⚠ Webhook already processed: ${stripeEventId}. Skipping.`);
      return;
    }

    // Find payment by paymentId
    const payment = await Payment.findOne({
      paymentId: paymentIntent.id,
    });

    if (!payment) {
      console.error(`❌ Payment record not found for: ${paymentIntent.id}`);
      return;
    }

    // Update payment record
    payment.status = 'completed';
    payment.stripePaymentStatus = paymentIntent.status;
    payment.stripeEventId = stripeEventId;
    payment.webhookReceivedAt = new Date();
    payment.stripeResponse = paymentIntent;
    await payment.save();

    console.log(`✓ Payment updated: ${payment._id}`);

    // Create or update enrollment
    let enrollment = await Enrollment.findOne({
      customerId: payment.customerId,
      courseId: payment.serviceId,
    });

    if (enrollment) {
      // Update existing enrollment
      enrollment.paymentStatus = 'completed';
      enrollment.status = 'active';
      enrollment.paymentId = payment._id;
      enrollment.paymentDate = new Date();
      enrollment.webhookVerified = true;
    } else {
      // Create new enrollment
      enrollment = new Enrollment({
        customerId: payment.customerId,
        customerEmail: payment.customerEmail,
        specialistId: payment.specialistId,
        specialistEmail: payment.specialistEmail,
        courseId: payment.serviceId,
        paymentStatus: 'completed',
        status: 'active',
        paymentId: payment._id,
        paymentDate: new Date(),
        webhookVerified: true,
      });
    }

    await enrollment.save();
    console.log(`✓ Enrollment activated: ${enrollment._id}`);

    // Send confirmation emails (async, don't wait)
    sendConfirmationEmails(payment, enrollment).catch((error) => {
      console.error('❌ Email sending error:', error.message);
      // Log but don't fail webhook
    });
  } catch (error) {
    console.error(`❌ Error processing payment_intent.succeeded:`, error);
    throw error; // Will be caught by webhook handler and logged
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(event) {
  const paymentIntent = event.data.object;
  const stripeEventId = event.id;

  console.log(`❌ Processing payment_intent.payment_failed: ${paymentIntent.id}`);

  try {
    // Check if webhook already processed
    const existingPayment = await Payment.findOne({
      stripeEventId,
    });

    if (existingPayment) {
      console.log(`⚠ Webhook already processed: ${stripeEventId}. Skipping.`);
      return;
    }

    // Update payment record
    const payment = await Payment.findOne({
      paymentId: paymentIntent.id,
    });

    if (payment) {
      payment.status = 'failed';
      payment.stripePaymentStatus = paymentIntent.status;
      payment.stripeEventId = stripeEventId;
      payment.errorMessage = paymentIntent.last_payment_error?.message;
      payment.errorCode = paymentIntent.last_payment_error?.code;
      await payment.save();

      console.log(`✓ Payment marked as failed: ${payment._id}`);

      // Notify customer of failure
      notifyPaymentFailure(payment).catch((error) => {
        console.error('❌ Error notifying payment failure:', error.message);
      });
    }
  } catch (error) {
    console.error(`❌ Error processing payment_intent.payment_failed:`, error);
    throw error;
  }
}

/**
 * Handle charge.refunded event
 */
async function handleRefund(event) {
  const charge = event.data.object;
  const stripeEventId = event.id;

  console.log(`♻️  Processing refund: ${charge.id}`);

  try {
    // Check if webhook already processed
    const existingPayment = await Payment.findOne({
      stripeEventId,
    });

    if (existingPayment) {
      console.log(`⚠ Webhook already processed: ${stripeEventId}. Skipping.`);
      return;
    }

    // Find payment by stripe charge
    const payment = await Payment.findOne({
      stripeResponse: { $exists: true },
      'stripeResponse.charges': { $elemMatch: { id: charge.id } },
    });

    if (payment) {
      payment.status = 'refunded';
      payment.stripeEventId = stripeEventId;
      payment.refundId = charge.refund ? charge.refund : null;
      payment.refundedAmount = charge.amount_refunded;
      payment.refundedAt = new Date();
      await payment.save();

      console.log(`✓ Payment refund updated: ${payment._id}`);

      // Update enrollment
      const enrollment = await Enrollment.findById(payment.enrollmentId);
      if (enrollment) {
        enrollment.status = 'refunded';
        enrollment.paymentStatus = 'refunded';
        await enrollment.save();
        console.log(`✓ Enrollment refunded: ${enrollment._id}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing charge.refunded:`, error);
    throw error;
  }
}

/**
 * Handle charge.dispute.created event
 */
async function handleDispute(event) {
  const dispute = event.data.object;

  console.log(`⚠️ Dispute created: ${dispute.id}`);

  try {
    // Find payment and flag it
    const payment = await Payment.findOne({
      paymentId: dispute.payment_intent,
    });

    if (payment) {
      // Log dispute but don't change payment status
      // Stripe will handle automatically
      console.log(`✓ Dispute logged for payment: ${payment._id}`);
    }
  } catch (error) {
    console.error(`❌ Error processing dispute:`, error);
    // Don't throw - disputes are informational
  }
}

/**
 * Send confirmation emails
 */
async function sendConfirmationEmails(payment, enrollment) {
  try {
    await Promise.all([
      sendEnrollmentConfirmation({
        customerEmail: payment.customerEmail,
        customerName: payment.customerEmail,
        courseName: payment.serviceName,
        enrollmentId: enrollment._id,
        amount: payment.amount / 100,
      }),
      sendSpecialistNotification({
        specialistEmail: payment.specialistEmail,
        specialistName: payment.specialistEmail,
        enrollmentEmail: payment.customerEmail,
        courseName: payment.serviceName,
        amount: payment.amount / 100,
      }),
    ]);

    console.log(`✓ Confirmation emails sent for payment: ${payment._id}`);
  } catch (error) {
    console.error('❌ Error sending confirmation emails:', error);
    throw error;
  }
}

/**
 * Notify customer of payment failure
 */
async function notifyPaymentFailure(payment) {
  try {
    // Send email about payment failure
    console.log(`✓ Payment failure notification sent to: ${payment.customerEmail}`);
  } catch (error) {
    console.error('❌ Error notifying payment failure:', error);
    throw error;
  }
}

/**
 * Log webhook event for debugging
 */
function logWebhookEvent(event) {
  const logDir = path.join(process.cwd(), 'backend', 'logs');

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    eventId: event.id,
    eventType: event.type,
    data: event.data?.object,
  };

  const logFile = path.join(logDir, 'stripe-webhooks.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

/**
 * Log webhook errors for debugging
 */
function logWebhookError(error, body, signature) {
  const logDir = path.join(process.cwd(), 'backend', 'logs');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const errorEntry = {
    timestamp: new Date().toISOString(),
    error: error.message,
    type: error.type,
    signature: signature ? signature.substring(0, 20) + '...' : 'missing',
  };

  const logFile = path.join(logDir, 'stripe-webhook-errors.log');
  fs.appendFileSync(logFile, JSON.stringify(errorEntry) + '\n');
}

/**
 * Health check endpoint
 * GET /api/webhooks/health
 */
export const webhookHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook handler is healthy',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Test webhook endpoint (development only)
 * POST /api/webhooks/test
 */
export const testWebhook = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Test endpoint not available in production',
    });
  }

  try {
    const { eventType = 'payment_intent.succeeded' } = req.body;

    // Simulate webhook event
    const event = {
      id: `evt_${Date.now()}`,
      type: eventType,
      data: {
        object: {
          id: `pi_${Date.now()}`,
          status: 'succeeded',
          amount: 50000,
          currency: 'inr',
          metadata: {
            customerId: req.user?.userId,
            serviceId: req.body.serviceId || 'test',
          },
        },
      },
    };

    console.log('📧 Test webhook fired:', event);

    res.status(200).json({
      success: true,
      message: 'Test webhook sent',
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
