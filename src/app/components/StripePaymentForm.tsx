import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
} from '@stripe/react-stripe-js';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { paymentAPI } from '@/app/api/paymentAPI';

interface StripePaymentFormProps {
  serviceId: string;
  serviceType: 'course' | 'service';
  serviceName: string;
  amount: number;
  currency?: string;
  onSuccess: (enrollmentId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function StripePaymentForm({
  serviceId,
  serviceType,
  serviceName,
  amount,
  currency = 'INR',
  onSuccess,
  onError,
  onClose,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Step 1: Create Payment Intent when component mounts
  useEffect(() => {
    const createIntent = async () => {
      try {
        setLoading(true);
        const response = await paymentAPI.createPaymentIntent({
          serviceId,
          serviceType,
        });

        if (response.success) {
          setClientSecret(response.clientSecret);
          setPaymentIntentId(response.paymentIntentId);
        } else {
          setError(response.message || 'Failed to create payment');
          setPaymentStatus('error');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
        setPaymentStatus('error');
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [serviceId, serviceType]);

  // Step 2: Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setError(null);

    try {
      // Confirm card payment with Stripe using modern Payment Intent API
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              // Get user info from form if needed
            },
          },
        },
        { handleActions: false }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setPaymentStatus('error');
        onError(stripeError.message || 'Payment failed');
        return;
      }

      if (!paymentIntent) {
        setError('Payment processing failed');
        setPaymentStatus('error');
        return;
      }

      // Step 3: Handle different payment intent statuses
      if (paymentIntent.status === 'succeeded') {
        // Payment successful!
        setPaymentStatus('success');

        // Confirm payment on backend
        const confirmResponse = await paymentAPI.confirmPayment({
          paymentIntentId: paymentIntent.id,
        });

        if (confirmResponse.success) {
          onSuccess(confirmResponse.enrollmentId);
        } else {
          throw new Error(confirmResponse.message || 'Failed to activate enrollment');
        }
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other authentication required
        setError('Additional authentication required. Please complete the 3D Secure challenge.');
        setPaymentStatus('error');
      } else if (paymentIntent.status === 'processing') {
        // Still processing
        setError('Payment is processing, please wait...');
        setPaymentStatus('processing');
        // Poll for completion
        pollPaymentStatus(paymentIntent.id);
      } else {
        setError('Payment could not be completed');
        setPaymentStatus('error');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed');
      setPaymentStatus('error');
      onError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  // Poll for payment status (for processing payments)
  const pollPaymentStatus = async (intentId: string, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setError('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    setTimeout(async () => {
      try {
        const response = await paymentAPI.confirmPayment({
          paymentIntentId: intentId,
        });

        if (response.success) {
          setPaymentStatus('success');
          onSuccess(response.enrollmentId);
        } else if (response.status === 'processing') {
          // Still processing, poll again
          pollPaymentStatus(intentId, attempts + 1);
        } else {
          setError('Payment failed. Please try again.');
          setPaymentStatus('error');
        }
      } catch (err) {
        // Retry on error
        pollPaymentStatus(intentId, attempts + 1);
      }
    }, pollInterval);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
      },
    },
  };

  if (loading && !clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <Loader className="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Initializing payment...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{serviceName}</span>
            <span className="font-bold text-lg">
              {currency === 'INR' ? '₹' : '$'}
              {(amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">
              {currency === 'INR' ? '₹' : '$'}
              {(amount / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Payment Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Payment Successful!</p>
              <p className="text-green-700 text-sm">Your enrollment is now active. Redirecting...</p>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {paymentStatus !== 'success' && (
          <form onSubmit={handlePaymentSubmit}>
            {/* Card Element */}
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement
                options={cardElementOptions}
                onChange={(event) => {
                  if (event.error) {
                    setError(event.error.message);
                  } else {
                    setError(null);
                  }
                }}
              />
            </div>

            {/* Test Card Numbers Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-800">
              <p className="font-semibold mb-1">🧪 Testing?</p>
              <p>Success: <code className="bg-white px-2 py-1">4242 4242 4242 4242</code></p>
              <p>Decline: <code className="bg-white px-2 py-1">4000 0000 0000 0002</code></p>
              <p>Use any future date and any CVC</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !clientSecret || paymentStatus === 'success'}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {currency === 'INR' ? '₹' : '$'}
                    {(amount / 100).toFixed(2)}
                  </>
                )}
              </Button>
            </div>

            {/* Security Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Payment is encrypted and secure. Your card details are never stored on our servers.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
