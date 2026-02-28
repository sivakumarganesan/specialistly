/**
 * Refund Service
 * Handles payment refunds for cancelled bookings
 * Currently mocked - ready for Stripe integration
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const STRIPE_API_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

/**
 * Process refund for a cancelled booking
 * @param {string} paymentIntentId - Original Stripe payment intent ID
 * @param {number} refundAmount - Amount to refund in cents
 * @param {string} reason - Reason for refund
 * @returns {object} - Refund result
 */
export const processRefund = async (paymentIntentId, refundAmount, reason = 'requested_by_merchant') => {
  try {
    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required');
    }

    console.log(`💰 Processing refund...`);
    console.log(`   Payment Intent ID: ${paymentIntentId}`);
    console.log(`   Refund Amount: $${(refundAmount / 100).toFixed(2)}`);
    console.log(`   Reason: ${reason}`);

    // Check if Stripe API key is configured
    if (!STRIPE_API_KEY) {
      console.warn('⚠️  STRIPE_SECRET_KEY not configured. Running in mock mode.');
      return {
        success: true,
        mock: true,
        refundId: `mock_refund_${Date.now()}`,
        message: 'Mock refund processed successfully (production Stripe integration not configured)',
        amount: refundAmount,
        paymentIntentId,
      };
    }

    // Call Stripe API to create refund
    const response = await axios.post(
      `${STRIPE_API_BASE}/refunds`,
      {
        payment_intent: paymentIntentId,
        amount: refundAmount,
        reason: reason,
        metadata: {
          source: 'specialistly_booking_cancellation',
          timestamp: new Date().toISOString(),
        },
      },
      {
        auth: {
          username: STRIPE_API_KEY,
          password: '',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log(`✅ Refund processed successfully`);
    console.log(`   Refund ID: ${response.data.id}`);
    console.log(`   Status: ${response.data.status}`);

    return {
      success: true,
      refundId: response.data.id,
      status: response.data.status,
      amount: response.data.amount,
      paymentIntentId,
    };
  } catch (error) {
    console.error('❌ Error processing refund:', error.message);
    
    if (error.response?.data) {
      console.error('   Stripe Error:', error.response.data);
    }

    return {
      success: false,
      error: error.message,
      retryable: error.response?.status === 429 || !error.response, // Retry on rate limit or network errors
    };
  }
};

/**
 * Get refund status from Stripe
 * @param {string} refundId - Stripe refund ID
 * @returns {object} - Refund status
 */
export const getRefundStatus = async (refundId) => {
  try {
    if (!STRIPE_API_KEY) {
      console.warn('⚠️  STRIPE_SECRET_KEY not configured. Cannot fetch refund status.');
      return {
        success: false,
        error: 'Stripe not configured',
      };
    }

    const response = await axios.get(
      `${STRIPE_API_BASE}/refunds/${refundId}`,
      {
        auth: {
          username: STRIPE_API_KEY,
          password: '',
        },
      }
    );

    console.log(`✅ Fetched refund status: ${response.data.status}`);

    return {
      success: true,
      refundId: response.data.id,
      status: response.data.status,
      amount: response.data.amount,
      reason: response.data.reason,
    };
  } catch (error) {
    console.error('❌ Error fetching refund status:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Mock refund for testing (when Stripe is not configured)
 * @param {number} amount - Amount to mock refund
 * @returns {object} - Mock refund result
 */
export const mockRefund = async (amount) => {
  console.log(`🎭 Mock refund: $${(amount / 100).toFixed(2)}`);
  
  return {
    success: true,
    mock: true,
    refundId: `mock_refund_${Date.now()}`,
    status: 'succeeded',
    amount,
  };
};

export default {
  processRefund,
  getRefundStatus,
  mockRefund,
};
