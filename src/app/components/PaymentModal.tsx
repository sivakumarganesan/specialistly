import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { RazorpayPaymentForm } from './RazorpayPaymentForm';
import { PaymentBreakdown } from './PaymentBreakdown';
import { usePaymentContext } from '../context/PaymentContext';
import { CreditCard } from 'lucide-react';

// Load Stripe public key from environment
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

console.log('[PaymentModal] Checking Stripe config:', {
  hasStripeKey: !!stripePublicKey,
  keyLength: stripePublicKey?.length || 0,
  envKeys: Object.keys(import.meta.env).filter(k => k.includes('STRIPE')),
  allEnvVars: Object.keys(import.meta.env).slice(0, 15),
});

const stripePromise = stripePublicKey 
  ? loadStripe(stripePublicKey)
  : Promise.reject(new Error('Stripe public key not found in environment. Please set VITE_STRIPE_PUBLIC_KEY'));

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
  
  // Gateway availability
  const [availableGateways, setAvailableGateways] = useState<{ stripe: boolean; razorpay: boolean }>({
    stripe: true,
    razorpay: false,
  });
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string>('');

  // Check if Stripe key is available
  useEffect(() => {
    if (!stripePublicKey) {
      setStripeError('Stripe is not configured. Please add VITE_STRIPE_PUBLIC_KEY environment variable.');
    }
  }, []);

  // Check available payment gateways on mount
  useEffect(() => {
    const checkGateways = async () => {
      try {
        const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || '/api';
        const response = await fetch(`${apiBaseUrl}/marketplace/payments/gateways`);
        const data = await response.json();
        
        console.log('[PaymentModal] Gateway availability:', {
          response: data,
          stripe: data.gateways?.stripe?.available,
          razorpay: data.gateways?.razorpay?.available,
        });
        
        if (data.success && data.gateways) {
          setAvailableGateways({
            stripe: data.gateways.stripe?.available || false,
            razorpay: data.gateways.razorpay?.available || false,
          });
        }
      } catch (error) {
        console.error('[PaymentModal] Error checking gateways:', error);
        // Default to Stripe if check fails
        setAvailableGateways({ stripe: true, razorpay: false });
      }
    };
    
    checkGateways();
  }, []);

  // Auto-select payment gateway based on currency when modal opens
  useEffect(() => {
    if (!isOpen || !context.paymentConfig) {
      return;
    }

    const currency = context.paymentConfig.currency?.toUpperCase() || 'USD';
    console.log('[PaymentModal] Auto-selecting gateway based on currency:', {
      currency,
      paymentConfig: context.paymentConfig,
    });

    if (currency === 'INR') {
      setPaymentGateway('razorpay');
    } else if (currency === 'USD') {
      setPaymentGateway('stripe');
    }
  }, [isOpen, context.paymentConfig]);

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
        const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || '/api';
        const endpoint = `${apiBaseUrl}/marketplace/payments/create-intent`;

        const requestBody = {
          courseId: context.paymentConfig.serviceId,
          customerId: user.id,
          customerEmail: user.email,
          commissionPercentage: 15,
          // Backend auto-selects gateway based on course currency - no need to send paymentGateway param
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

        // Determine which response to expect based on currency
        const currency = context.paymentConfig.currency?.toUpperCase() || 'USD';
        
        if (currency === 'USD' && data.clientSecret) {
          console.log('[PaymentModal] Received Stripe payment intent');
          setClientSecret(data.clientSecret);
          setRazorpayData(null);
          setPaymentGateway('stripe');
        } 
        else if (currency === 'INR' && data.orderId) {
          console.log('[PaymentModal] Received Razorpay order');
          setRazorpayData({
            orderId: data.orderId,
            keyId: data.keyId,
            amount: data.amount,
            currency: data.currency || 'INR',
          });
          setClientSecret('');
          setPaymentGateway('razorpay');
        }
        else {
          console.error('[PaymentModal] Unexpected response format:', {
            currency,
            response: data,
          });
          const errorMsg = `Payment initialization failed. Unexpected response for ${currency} payment.`;
          context.paymentConfig?.onError?.(errorMsg);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
        context.paymentConfig?.onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [isOpen, context.paymentConfig?.serviceId, context.paymentConfig?.currency]);


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

        {/* Payment Gateway Info */}
        <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Payment Method</p>
              <p className="text-blue-800">
                {paymentGateway === 'stripe' && '💳 Stripe (Credit/Debit Card) - USD'}
                {paymentGateway === 'razorpay' && '🇮🇳 Razorpay (Card, UPI, NetBanking) - INR'}
              </p>
            </div>
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
