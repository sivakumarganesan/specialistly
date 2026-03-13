import React, { useEffect, useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, Loader } from 'lucide-react';

interface RazorpayPaymentFormProps {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  onSuccess: (paymentDetails: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayPaymentForm: React.FC<RazorpayPaymentFormProps> = ({
  orderId,
  keyId,
  amount,
  currency,
  customerEmail,
  customerName,
  onSuccess,
  onError,
  isLoading = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
      console.log('[RazorpayPaymentForm] Razorpay SDK loaded');
    };
    script.onerror = () => {
      console.error('[RazorpayPaymentForm] Failed to load Razorpay SDK');
      onError('Failed to load payment provider');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  const handlePayment = async () => {
    if (!window.Razorpay || !razorpayLoaded) {
      onError('Payment provider not initialized. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const options = {
        key: keyId,
        order_id: orderId,
        name: 'Specialistly',
        description: 'Course Purchase',
        customer_details: {
          email: customerEmail,
          name: customerName || customerEmail,
        },
        handler: function (response: any) {
          console.log('[RazorpayPaymentForm] Payment successful:', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          // Payment successful - webhook will handle enrollment
          onSuccess({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        prefill: {
          email: customerEmail,
          name: customerName,
        },
        theme: {
          color: '#4F46E5', // Indigo color to match your theme
        },
        modal: {
          ondismiss: function () {
            console.log('[RazorpayPaymentForm] Payment modal closed');
            setIsProcessing(false);
            onError('Payment cancelled. Please try again.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('[RazorpayPaymentForm] Payment failed:', response.error);
        setIsProcessing(false);
        onError(response.error.description || 'Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (error) {
      console.error('[RazorpayPaymentForm] Error initiating payment:', error);
      setIsProcessing(false);
      onError(
        error instanceof Error ? error.message : 'Failed to initiate payment'
      );
    }
  };

  if (!razorpayLoaded) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
        <p className="text-sm text-gray-600">Loading payment provider...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Order Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Order ID:</span>
          <span className="font-mono text-sm font-semibold">{orderId}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">
            {currency === 'INR' ? '₹' : '$'}{(amount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Email Confirmation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          A confirmation will be sent to <strong>{customerEmail}</strong>
        </p>
      </div>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing || isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold"
      >
        {isProcessing || isLoading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${currency === 'INR' ? '₹' : '$'}${(amount).toFixed(2)}`
        )}
      </Button>

      {/* Security Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-semibold mb-1">Secure Payment</p>
            <p>
              Your payment is processed securely by Razorpay. We do not store
              your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        Click "Pay Now" to proceed to the secure payment page. You can use your
        card, net banking, UPI, or wallet.
      </p>
    </div>
  );
};
