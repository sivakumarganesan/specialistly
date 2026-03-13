import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, CreditCard, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/app/api/apiClient';
import { RazorpayPaymentForm } from './RazorpayPaymentForm';

// Fetch Stripe public key from backend at runtime
let stripePromiseCache: Promise<Stripe | null> | null = null;
function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromiseCache) {
    stripePromiseCache = fetch(`${API_BASE_URL}/config/stripe-key`)
      .then(r => r.json())
      .then(data => {
        if (data.stripePublicKey) return loadStripe(data.stripePublicKey);
        return null;
      })
      .catch(() => null);
  }
  return stripePromiseCache;
}

interface CourseInfo {
  _id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  thumbnail?: string;
  courseImage?: string;
  specialistEmail?: string;
}

interface PublicCourseCheckoutProps {
  course: CourseInfo;
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'details' | 'payment' | 'success';
type PaymentGateway = 'stripe' | 'razorpay';

interface RazorpayData {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

/** Inner form that uses Stripe hooks (must be inside <Elements>) */
function StripeCardForm({
  clientSecret,
  customerEmail,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  customerEmail: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setLoading(false);
        return;
      }

      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm on backend (public endpoint)
        const confirmRes = await fetch(`${API_BASE_URL}/public/course-purchase/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerEmail,
          }),
        });
        const confirmData = await confirmRes.json();

        if (confirmData.success) {
          onSuccess();
        } else {
          throw new Error(confirmData.message || 'Failed to confirm enrollment');
        }
      } else {
        setError('Payment could not be completed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      onError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a1a1a',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Pay Now
          </>
        )}
      </button>
    </form>
  );
}

export function PublicCourseCheckout({ course, isOpen, onClose }: PublicCourseCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>('details');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('stripe');
  const [razorpayData, setRazorpayData] = useState<RazorpayData | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('details');
      setCustomerName('');
      setCustomerEmail('');
      setError(null);
      setClientSecret(null);
      setRazorpayData(null);
      setLoading(false);
    }
  }, [isOpen]);

  const isFree = !course.price || course.price === 0;
  const currencySymbol = course.currency === 'INR' ? '₹' : '$';

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/public/course-purchase/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course._id,
          customerEmail,
          customerName,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to initialize payment');
        setLoading(false);
        return;
      }

      // Free course: enrolled directly
      if (data.isFree) {
        setStep('success');
        setLoading(false);
        return;
      }

      // Paid course: show payment form
      if (data.paymentGateway === 'stripe' && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentGateway('stripe');
        setStep('payment');
      } else if (data.paymentGateway === 'razorpay' && data.orderId) {
        setRazorpayData({
          orderId: data.orderId,
          keyId: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
        });
        setPaymentGateway('razorpay');
        setStep('payment');
      } else {
        setError('Payment initialization failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'success' ? 'Enrollment Confirmed!' : isFree ? 'Enroll in Course' : 'Purchase Course'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Course Summary */}
          {step !== 'success' && (
            <div className="mb-5 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
              )}
              <div className="mt-2 font-bold text-lg text-indigo-600">
                {isFree ? 'Free' : `${currencySymbol}${course.price}`}
              </div>
            </div>
          )}

          {/* Step 1: Customer Details */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Enter your email"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    {isFree ? 'Enrolling...' : 'Initializing...'}
                  </>
                ) : (
                  isFree ? 'Enroll Now' : 'Continue to Payment'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Payment - Stripe */}
          {step === 'payment' && paymentGateway === 'stripe' && clientSecret && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <CreditCard className="h-4 w-4" />
                <span>Enter your card details</span>
              </div>

              <Elements
                stripe={getStripePromise()}
                options={{
                  clientSecret,
                  appearance: { theme: 'stripe' },
                }}
              >
                <StripeCardForm
                  clientSecret={clientSecret}
                  customerEmail={customerEmail}
                  onSuccess={() => setStep('success')}
                  onError={(msg) => setError(msg)}
                />
              </Elements>

              <button
                onClick={() => {
                  setStep('details');
                  setClientSecret(null);
                  setError(null);
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                &larr; Back to details
              </button>
            </div>
          )}

          {/* Step 2: Payment - Razorpay */}
          {step === 'payment' && paymentGateway === 'razorpay' && razorpayData && (
            <div className="space-y-4">
              <RazorpayPaymentForm
                orderId={razorpayData.orderId}
                keyId={razorpayData.keyId}
                amount={razorpayData.amount}
                currency={razorpayData.currency}
                customerEmail={customerEmail}
                customerName={customerName}
                onSuccess={() => setStep('success')}
                onError={(msg) => setError(msg)}
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => {
                  setStep('details');
                  setRazorpayData(null);
                  setError(null);
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                &larr; Back to details
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isFree ? 'Successfully Enrolled!' : 'Payment Successful!'}
              </h3>
              <p className="text-gray-600 mb-2">
                You are now enrolled in <strong>{course.title}</strong>.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                A confirmation has been sent to <strong>{customerEmail}</strong>.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
