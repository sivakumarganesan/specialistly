import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  maxNetworkRetries: 2,
  timeout: 60000,
});

export const stripeService = {
  /**
   * Create a Payment Intent for payment processing
   * @param {Object} options - Configuration options
   * @param {number} options.amount - Amount in smallest unit (cents/paise)
   * @param {string} options.currency - Currency code (USD, INR, etc.)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.description - Payment description
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} Payment Intent object
   */
  createPaymentIntent: async ({
    amount,
    currency,
    customerId,
    description,
    metadata = {},
  }) => {
    try {
      if (amount < 100) {
        throw new Error('Amount must be at least 100 smallest units');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        description,
        metadata,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  },

  /**
   * Retrieve Payment Intent status
   * @param {string} paymentIntentId - Stripe Payment Intent ID
   * @returns {Promise<Object>} Payment Intent details
   */
  retrievePaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        charges: paymentIntent.charges.data,
        paymentMethod: paymentIntent.payment_method,
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Confirm Payment Intent (already done by client with Stripe.js)
   * This is just for verification
   */
  confirmPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          status: 'completed',
          paymentMethod: paymentIntent.payment_method_details,
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: false,
          status: 'requires_action',
          error: '3D Secure authentication required',
        };
      } else if (paymentIntent.status === 'processing') {
        return {
          success: false,
          status: 'processing',
          error: 'Payment is being processed',
        };
      } else {
        return {
          success: false,
          status: paymentIntent.status,
          error: 'Payment failed',
        };
      }
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Process a refund
   * @param {string} paymentIntentId - Stripe Payment Intent ID
   * @param {number} amount - Amount to refund (optional, full refund if not specified)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  processRefund: async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount, // null means full refund
        reason,
        metadata: {
          processedAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Retrieve refund status
   * @param {string} refundId - Stripe Refund ID
   */
  getRefundStatus: async (refundId) => {
    try {
      const refund = await stripe.refunds.retrieve(refundId);
      return {
        success: true,
        status: refund.status,
        amount: refund.amount,
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      console.error('Error retrieving refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create or retrieve a Stripe customer
   * @param {Object} options - Customer data
   */
  createCustomer: async ({ email, name, metadata = {} }) => {
    try {
      // Check if customer exists
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return {
          success: true,
          customerId: existingCustomers.data[0].id,
          isNew: false,
        };
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      return {
        success: true,
        customerId: customer.id,
        isNew: true,
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create Stripe Product
   * @param {Object} options - Product data
   */
  createProduct: async ({ name, description, metadata = {} }) => {
    try {
      const product = await stripe.products.create({
        name,
        description,
        type: 'service',
        metadata,
      });

      return {
        success: true,
        productId: product.id,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Verify webhook signature
   * Static method for webhook verification
   */
  verifyWebhookSignature: (body, signature, secret) => {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, secret);
      return {
        success: true,
        event,
      };
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Retrieve charge details
   */
  getChargeDetails: async (chargeId) => {
    try {
      const charge = await stripe.charges.retrieve(chargeId);
      return {
        success: true,
        charge: {
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          paymentMethod: charge.payment_method_details,
          created: new Date(charge.created * 1000),
        },
      };
    } catch (error) {
      console.error('Error retrieving charge:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * List payments for a customer (last 10)
   */
  listCustomerPayments: async (customerId, limit = 10) => {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit,
      });

      return {
        success: true,
        payments: paymentIntents.data.map((pi) => ({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: new Date(pi.created * 1000),
        })),
      };
    } catch (error) {
      console.error('Error listing payments:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get account balance
   */
  getAccountBalance: async () => {
    try {
      const balance = await stripe.balance.retrieve();
      return {
        success: true,
        account: {
          available: balance.available,
          pending: balance.pending,
          connect_reserved: balance.connect_reserved,
        },
      };
    } catch (error) {
      console.error('Error retrieving balance:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default stripe;
