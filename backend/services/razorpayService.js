import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay with API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const razorpayService = {
  /**
   * Create a Razorpay Order for payment processing
   * @param {Object} options - Configuration options
   * @param {number} options.amount - Amount in smallest unit (paise for INR)
   * @param {string} options.currency - Currency code (INR, USD, etc.)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.customerEmail - Customer email
   * @param {string} options.description - Payment description
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} Razorpay Order object
   */
  createOrder: async ({
    amount,
    currency = 'INR',
    customerId,
    customerEmail,
    description,
    metadata = {},
  }) => {
    try {
      if (amount < 100) {
        throw new Error('Amount must be at least 100 paise (₹1 for INR)');
      }

      const orderData = {
        amount, // Amount in paise for INR
        currency,
        description,
        customer_notify: 1,
        notes: {
          customerId,
          customerEmail,
          ...metadata,
        },
      };

      const order = await razorpay.orders.create(orderData);

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      };
    } catch (error) {
      console.error('[RazorpayService] Error creating order:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  },

  /**
   * Verify Razorpay payment signature
   * @param {string} orderId - Razorpay Order ID
   * @param {string} paymentId - Razorpay Payment ID
   * @param {string} signature - Razorpay Signature from webhook
   * @returns {Promise<Object>} Verification result
   */
  verifyPaymentSignature: async (orderId, paymentId, signature) => {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isSignatureValid = expectedSignature === signature;

      if (!isSignatureValid) {
        console.warn('[RazorpayService] Signature verification failed');
        return {
          success: false,
          error: 'Invalid signature',
          isValid: false,
        };
      }

      console.log('[RazorpayService] Signature verified successfully');
      return {
        success: true,
        isValid: true,
        orderId,
        paymentId,
      };
    } catch (error) {
      console.error('[RazorpayService] Error verifying signature:', error);
      return {
        success: false,
        error: error.message,
        isValid: false,
      };
    }
  },

  /**
   * Retrieve Razorpay Payment details
   * @param {string} paymentId - Razorpay Payment ID
   * @returns {Promise<Object>} Payment details
   */
  retrievePayment: async (paymentId) => {
    try {
      const payment = await razorpay.payments.fetch(paymentId);

      console.log('[RazorpayService] Retrieved payment:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
      });

      return {
        success: true,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.method,
        orderId: payment.order_id,
        customerId: payment.notes?.customerId,
      };
    } catch (error) {
      console.error('[RazorpayService] Error retrieving payment:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Retrieve Razorpay Order details
   * @param {string} orderId - Razorpay Order ID
   * @returns {Promise<Object>} Order details
   */
  retrieveOrder: async (orderId) => {
    try {
      const order = await razorpay.orders.fetch(orderId);

      console.log('[RazorpayService] Retrieved order:', {
        id: order.id,
        status: order.status,
        amount: order.amount,
      });

      return {
        success: true,
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        paymentIds: order.payments?.items || [],
      };
    } catch (error) {
      console.error('[RazorpayService] Error retrieving order:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Process refund for a payment
   * @param {string} paymentId - Razorpay Payment ID
   * @param {number} amount - Refund amount in paise (optional, full refund if not provided)
   * @param {string} notes - Refund notes
   * @returns {Promise<Object>} Refund result
   */
  processRefund: async (paymentId, amount = null, notes = '') => {
    try {
      const refundData = {
        notes: notes ? { reason: notes } : undefined,
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await razorpay.payments.refund(paymentId, refundData);

      console.log('[RazorpayService] Refund processed:', {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
      };
    } catch (error) {
      console.error('[RazorpayService] Error processing refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
