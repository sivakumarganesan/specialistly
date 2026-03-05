import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { RazorpayPaymentForm } from './RazorpayPaymentForm';
import { PaymentBreakdown } from './PaymentBreakdown';
import { usePaymentContext } from '../context/PaymentContext';
import { CreditCard } from 'lucide-react';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const stripePromise = stripePublicKey 
  ? loadStripe(stripePublicKey)
  : Promise.reject(new Error('Stripe public key not found'));

interface PaymentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface RazorpayPaymentState {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const context = usePaymentContext();
  const isOpen = context.isOpen;
  const onClose = () => {
    context.closePayment();
    propOnClose?.();
  };

  // Payment gateway selection
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  
  // Stripe state
  const [clientSecret, setClientSecret] = useState<string>('');
  
  // Razorpay state
  const [razorpayData, setRazorpayData] = useState<RazorpayPaymentState | null>(null);
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string>('');

  // Check if Stripe key is available
  useEffect(() => {
    if (!stripePublicKey) {
      setStripeError('Stripe is not configured. Please add VITE_STRIPE_PUBLIC_KEY environment variable.');
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !context.paymentConfig) {
      setClientSecret('');
      setRazorpayData(null);
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
        const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5001/api';
        const endpoint = `${apiBaseUrl}/marketplace/payments/create-intent`;

        const requestBody = {
          courseId: context.paymentConfig.serviceId,
          customerId: user.id,
          customerEmail: user.email,
          commissionPercentage: 15,
          paymentGateway, // Add gateway selection
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!data.success) {
          const errorMsg = data.message || 'Failed to initialize payment';
          context.paymentConfig?.onError?.(errorMsg);
          setIsLoading(false);
          return;
        }

        // Handle Stripe response
        if (paymentGateway === 'stripe' && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setRazorpayData(null);
        }
        // Handle Razorpay response
        else if (paymentGateway === 'razorpay' && data.orderId) {
          setRazorpayData({
            orderId: data.orderId,
            keyId: data.keyId,
            amount: data.amount,
            currency: data.currency || 'INR',
          });
          setClientSecret('');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
        context.paymentConfig?.onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [isOpen, context.paymentConfig, paymentGateway]);


  if (!isOpen || !context.paymentConfig) {
    return null;
  }

  if (stripeError && paymentGateway === 'stripe') {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Payment Configuration Error</h2>
          <p className="text-gray-700 mb-4">{stripeError}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
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

        {/* Payment Summary */}
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

        {/* Payment Gateway Selector */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <CreditCard className="h-4 w-4 inline mr-2" />
            Choose Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-white" style={{ borderColor: paymentGateway === 'stripe' ? '#6366f1' : '#ddd', backgroundColor: paymentGateway === 'stripe' ? '#f0f4ff' : 'white' }}>
              <input
                type="radio"
                name="gateway"
                value="stripe"
                checked={paymentGateway === 'stripe'}
                onChange={(e) => setPaymentGateway(e.target.value as 'stripe')}
                disabled={isLoading}
                className="h-4 w-4"
              />
              <span className="ml-3 flex-1">
                <span className="font-semibold text-gray-900">Stripe</span>
                <span className="text-xs text-gray-500 block">Credit/Debit Card (USD)</span>
              </span>
            </label>
            <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-white" style={{ borderColor: paymentGateway === 'razorpay' ? '#6366f1' : '#ddd', backgroundColor: paymentGateway === 'razorpay' ? '#f0f4ff' : 'white' }}>
              <input
                type="radio"
                name="gateway"
                value="razorpay"
                checked={paymentGateway === 'razorpay'}
                onChange={(e) => setPaymentGateway(e.target.value as 'razorpay')}
                disabled={isLoading}
                className="h-4 w-4"
              />
              <span className="ml-3 flex-1">
                <span className="font-semibold text-gray-900">Razorpay</span>
                <span className="text-xs text-gray-500 block">Card, UPI, NetBanking (INR)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-600">Initializing payment...</span>
          </div>
        )}

        {/* Stripe Payment Form */}
        {!isLoading && paymentGateway === 'stripe' && clientSecret && (
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
              clientSecret={clientSecret}
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

        {/* Razorpay Payment Form */}
        {!isLoading && paymentGateway === 'razorpay' && razorpayData && (
          <RazorpayPaymentForm
            orderId={razorpayData.orderId}
            keyId={razorpayData.keyId}
            amount={razorpayData.amount}
            currency={razorpayData.currency}
            customerEmail={context.paymentConfig.customerEmail || localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').email : ''}
            customerName={context.paymentConfig.customerName}
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
          />
        )}

        {/* Error State */}
        {!isLoading && !clientSecret && !razorpayData && (
          <div className="text-center py-4 text-red-600">
            Failed to initialize payment. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
