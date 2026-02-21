import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { PaymentBreakdown } from './PaymentBreakdown';
import { usePaymentContext } from '../context/PaymentContext';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLIC_KEY || ''
);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const context = usePaymentContext();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !context.paymentConfig) {
      setClientSecret('');
      return;
    }

    const initializePayment = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          context.paymentConfig?.onError?.('Please log in');
          return;
        }

        const user = JSON.parse(userStr);

        // This endpoint should return clientSecret
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/payments/create-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              serviceId: context.paymentConfig.serviceId,
              serviceType: context.paymentConfig.serviceType,
              customerId: user._id,
              customerEmail: user.email,
            }),
          }
        );

        const data = await response.json();
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          context.paymentConfig?.onError?.(data.message || 'Failed to initialize payment');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
        context.paymentConfig?.onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [isOpen, context.paymentConfig]);

  if (!isOpen || !context.paymentConfig) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Payment Summary with Commission Breakdown */}
        <div className="mb-6 space-y-3">
          <div className="bg-gray-50 rounded p-4">
            <div className="text-sm text-gray-600">
              <p className="font-semibold">{context.paymentConfig.serviceName}</p>
              <p className="text-xs text-gray-500">by {context.paymentConfig.specialistName}</p>
            </div>
          </div>
          <PaymentBreakdown
            amount={context.paymentConfig.amount}
            currency={context.paymentConfig.currency}
            commissionPercentage={15}
            showSpecialistBreakdown={true}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Initializing payment...</span>
          </div>
        )}

        {/* Stripe Payment Form */}
        {!isLoading && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <StripePaymentForm
              serviceId={context.paymentConfig.serviceId}
              serviceType={context.paymentConfig.serviceType}
              serviceName={context.paymentConfig.serviceName}
              amount={context.paymentConfig.amount}
              currency={context.paymentConfig.currency}
              onSuccess={() => {
                context.paymentConfig?.onSuccess?.({
                  serviceId: context.paymentConfig.serviceId,
                  amount: context.paymentConfig.amount,
                });
                onClose();
              }}
              onError={(error) => {
                context.paymentConfig?.onError?.(error);
              }}
              onClose={onClose}
            />
          </Elements>
        )}

        {/* Error State */}
        {!isLoading && !clientSecret && (
          <div className="text-center py-4 text-red-600">
            Failed to initialize payment. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
