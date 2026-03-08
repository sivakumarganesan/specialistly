import { API_BASE_URL } from '@/app/api/apiClient';

export const paymentAPI = {
  /**
   * Create Payment Intent (Legacy - for non-marketplace payments)
   * POST /api/payments/create-intent
   * @deprecated Use marketplacePaymentAPI.createPaymentIntent instead for course payments
   */
  createPaymentIntent: async (data: {
    serviceId: string;
    serviceType: 'course' | 'service';
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm Payment
   * POST /api/payments/confirm-payment
   */
  confirmPayment: async (data: { paymentIntentId: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  /**
   * Get Payment Details
   * GET /api/payments/:paymentId
   */
  getPaymentDetails: async (paymentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  },

  /**
   * Get Payment History
   * GET /api/payments/history/customer
   */
  getPaymentHistory: async (limit = 10, skip = 0) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/history/customer?limit=${limit}&skip=${skip}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  /**
   * Process Refund
   * POST /api/payments/:paymentId/refund
   */
  processRefund: async (paymentId: string, reason?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  },

  /**
   * Get Specialist Statistics
   * GET /api/payments/specialist/statistics
   */
  getSpecialistStatistics: async (period = 'month') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/specialist/statistics?period=${period}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching specialist statistics:', error);
      throw error;
    }
  },
};

/**
 * Marketplace Payment API - For Stripe Connect marketplace payments
 * All course payments go through the marketplace endpoint
 */
export const marketplacePaymentAPI = {
  /**
   * Create Marketplace Payment Intent
   * POST /api/marketplace/payments/create-intent
   * Used for course enrollments with specialist stripe account
   */
  createPaymentIntent: async (data: {
    courseId: string;
    customerId: string;
    customerEmail: string;
    commissionPercentage?: number;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/marketplace/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating marketplace payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm Marketplace Payment
   * POST /api/marketplace/payments/confirm-payment
   * Called after successful card payment to confirm and create enrollment
   */
  confirmPayment: async (data: { paymentIntentId: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/marketplace/payments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Include error details from server response
        const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
        console.error('[marketplacePaymentAPI.confirmPayment] Error response:', {
          status: response.status,
          message: errorMessage,
          data: responseData,
        });
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error('Error confirming marketplace payment:', error);
      throw error;
    }
  },
};
