import { API_BASE_URL } from '@/app/api/apiClient';

export const paymentAPI = {
  /**
   * Create Payment Intent
   * POST /api/payments/create-intent
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
