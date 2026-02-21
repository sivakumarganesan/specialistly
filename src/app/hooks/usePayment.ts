import { useCallback } from 'react';
import { usePaymentContext, PaymentConfig } from '../context/PaymentContext';
import { paymentAPI } from '../api/paymentAPI';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export const usePayment = () => {
  const context = usePaymentContext();

  const initiatePayment = useCallback(
    async (config: Omit<PaymentConfig, 'onSuccess' | 'onError'> & {
      onSuccess?: (paymentData: any) => void;
      onError?: (error: string) => void;
    }) => {
      try {
        // Get the current user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          config.onError?.('Please log in to continue');
          return;
        }

        const user = JSON.parse(userStr);
        
        // Create payment intent
        const response = await paymentAPI.createPaymentIntent({
          serviceId: config.serviceId,
          serviceType: config.serviceType,
          customerId: user._id,
          customerEmail: user.email,
        });

        if (!response.success) {
          config.onError?.(response.message || 'Failed to create payment');
          return;
        }

        // Open payment modal with config
        context.openPayment({
          ...config,
          onSuccess: config.onSuccess,
          onError: config.onError,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
        config.onError?.(errorMessage);
      }
    },
    [context]
  );

  return {
    initiatePayment,
    openPayment: context.openPayment,
    closePayment: context.closePayment,
    isPaymentOpen: context.isOpen,
    paymentConfig: context.paymentConfig,
    isProcessing: context.isProcessing,
  };
};
