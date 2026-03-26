import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, CreditCard, CheckCircle, Loader, AlertCircle, LogIn, UserPlus } from 'lucide-react';
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
  courseType?: string;
  startDate?: string;
  endDate?: string;
  schedule?: string;
  meetingPlatform?: string;
  zoomLink?: string;
}

interface PublicCourseCheckoutProps {
  course: CourseInfo;
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'account' | 'payment' | 'success';
type PaymentGateway = 'stripe' | 'razorpay';
type AuthTab = 'login' | 'signup';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface RazorpayData {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

/** Build headers for API calls (includes auth token if available) */
function buildHeaders(authToken: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

/** Inner form that uses Stripe hooks (must be inside <Elements>) */
function StripeCardForm({
  clientSecret,
  customerEmail,
  authToken,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  customerEmail: string;
  authToken: string | null;
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
        const confirmRes = await fetch(`${API_BASE_URL}/public/course-purchase/confirm-payment`, {
          method: 'POST',
          headers: buildHeaders(authToken),
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
        className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  const [step, setStep] = useState<CheckoutStep>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('stripe');
  const [razorpayData, setRazorpayData] = useState<RazorpayData | null>(null);

  // Auth state
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setAuthToken(savedToken);
          setAuthUser({ id: user.id, name: user.name, email: user.email });
        } catch {
          // Invalid saved data, ignore
        }
      }
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('account');
      setError(null);
      setClientSecret(null);
      setRazorpayData(null);
      setLoading(false);
      setLoginEmail('');
      setLoginPassword('');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirm('');
      setAuthTab('login');
    }
  }, [isOpen]);

  const isFree = !course.price || course.price === 0;
  const courseCurrencySymbol = course.currency === 'INR' ? '₹' : '$';

  /** Call create-intent and proceed to payment (or success for free) */
  const initiatePayment = async (name: string, email: string, token: string | null) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/public/course-purchase/create-intent`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({
          courseId: course._id,
          customerEmail: email,
          customerName: name,
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

  /** Handle login */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store auth data
      const user: AuthUser = { id: data.user.id, name: data.user.name, email: data.user.email };
      setAuthToken(data.token);
      setAuthUser(user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userType', data.userType || 'customer');

      // Proceed to payment
      await initiatePayment(user.name, user.email, data.token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  /** Handle signup */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          confirmPassword: signupConfirm,
          isSpecialist: false,
          userType: 'customer',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Store auth data
      const user: AuthUser = { id: data.user.id, name: data.user.name, email: data.user.email };
      setAuthToken(data.token);
      setAuthUser(user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userType', data.userType || 'customer');

      // Proceed to payment
      await initiatePayment(user.name, user.email, data.token);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  /** Continue as already-logged-in user */
  const handleContinueLoggedIn = async () => {
    if (!authUser) return;
    await initiatePayment(authUser.name, authUser.email, authToken);
  };

  /** Switch to a different account */
  const handleSwitchAccount = () => {
    setAuthToken(null);
    setAuthUser(null);
    setAuthTab('login');
    setError(null);
  };

  /** Handle Razorpay payment success — confirm on backend, then show success */
  const handleRazorpaySuccess = async (paymentDetails: any) => {
    try {
      const confirmRes = await fetch(`${API_BASE_URL}/public/course-purchase/confirm-razorpay`, {
        method: 'POST',
        headers: buildHeaders(authToken),
        body: JSON.stringify({
          razorpayOrderId: paymentDetails.orderId,
          razorpayPaymentId: paymentDetails.paymentId,
          razorpaySignature: paymentDetails.signature,
        }),
      });
      const confirmData = await confirmRes.json();
      if (confirmData.success) {
        setStep('success');
      } else {
        setError(confirmData.message || 'Enrollment confirmation failed. Your payment was received — please contact support.');
      }
    } catch {
      setError('Enrollment confirmation failed. Your payment was received — please contact support.');
    }
  };

  /** Navigate to My Learning (main app) in a new tab */
  const goToMyLearning = () => {
    window.open('https://www.specialistly.com', '_blank', 'noopener');
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'success'
              ? 'Enrollment Confirmed!'
              : step === 'account'
                ? (isFree ? 'Enroll in Course' : 'Purchase Course')
                : 'Complete Payment'}
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
              <div className="mt-2 font-bold text-lg text-gray-900">
                {isFree ? 'Free' : `${courseCurrencySymbol}${course.price}`}
              </div>
            </div>
          )}

          {/* Step 1: Account — Login or Sign Up */}
          {step === 'account' && (
            <>
              {/* Already logged in */}
              {authUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
                      {authUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{authUser.name}</p>
                      <p className="text-sm text-gray-500">{authUser.email}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleContinueLoggedIn}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                  <button
                    onClick={handleSwitchAccount}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    Use a different account
                  </button>
                </div>
              ) : (
                /* Not logged in — show login/signup tabs */
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => { setAuthTab('login'); setError(null); }}
                      className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
                        authTab === 'login'
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <LogIn className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                      Log In
                    </button>
                    <button
                      onClick={() => { setAuthTab('signup'); setError(null); }}
                      className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
                        authTab === 'signup'
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <UserPlus className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                      Sign Up
                    </button>
                  </div>

                  {/* Login Form */}
                  {authTab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                          placeholder="Enter your password"
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
                        className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            {isFree ? 'Logging in & Enrolling...' : 'Logging in...'}
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            {isFree ? 'Log In & Enroll' : 'Log In & Continue'}
                          </>
                        )}
                      </button>

                      <p className="text-center text-sm text-gray-500">
                        Don&apos;t have an account?{' '}
                        <button type="button" onClick={() => { setAuthTab('signup'); setError(null); }} className="text-gray-900 font-medium hover:underline">
                          Sign up
                        </button>
                      </p>
                    </form>
                  )}

                  {/* Signup Form */}
                  {authTab === 'signup' && (
                    <form onSubmit={handleSignup} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                          placeholder="Create a password (min 6 chars)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={signupConfirm}
                          onChange={(e) => setSignupConfirm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                          placeholder="Confirm your password"
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
                        className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            {isFree ? 'Creating account & Enrolling...' : 'Creating account...'}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            {isFree ? 'Sign Up & Enroll' : 'Sign Up & Continue'}
                          </>
                        )}
                      </button>

                      <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <button type="button" onClick={() => { setAuthTab('login'); setError(null); }} className="text-gray-900 font-medium hover:underline">
                          Log in
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              )}
            </>
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
                  customerEmail={authUser?.email || ''}
                  authToken={authToken}
                  onSuccess={() => setStep('success')}
                  onError={(msg) => setError(msg)}
                />
              </Elements>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => {
                  setStep('account');
                  setClientSecret(null);
                  setError(null);
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                &larr; Back
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
                customerEmail={authUser?.email || ''}
                customerName={authUser?.name}
                onSuccess={handleRazorpaySuccess}
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
                  setStep('account');
                  setRazorpayData(null);
                  setError(null);
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                &larr; Back
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
              {authUser && (
                <p className="text-sm text-gray-500 mb-4">
                  Logged in as <strong>{authUser.email}</strong>
                </p>
              )}

              {/* Cohort course details on success */}
              {course.courseType === 'cohort' && (course.startDate || course.schedule || course.zoomLink) && (
                <div className="text-left mt-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Course Details</h4>
                  <div className="space-y-2 text-sm">
                    {course.startDate && (
                      <div className="flex items-center gap-2 text-gray-900">
                        <span className="font-medium">Starts:</span>
                        <span>{new Date(course.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    {course.schedule && (
                      <div className="flex items-center gap-2 text-gray-900">
                        <span className="font-medium">Schedule:</span>
                        <span>{course.schedule}</span>
                      </div>
                    )}
                    {course.meetingPlatform && (
                      <div className="flex items-center gap-2 text-gray-900">
                        <span className="font-medium">Platform:</span>
                        <span>{course.meetingPlatform}</span>
                      </div>
                    )}
                    {course.zoomLink && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900 mb-1">Meeting Link</p>
                        <a
                          href={course.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-gray-800 underline break-all text-xs"
                        >
                          {course.zoomLink}
                        </a>
                        <p className="text-xs text-gray-500 mt-1">A confirmation email with the meeting link has been sent to your email.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {authUser && (
                  <button
                    onClick={goToMyLearning}
                    className="w-full px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                  >
                    Go to My Learning
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={authUser
                    ? "w-full px-6 py-2 text-gray-600 hover:text-gray-800 text-sm"
                    : "w-full px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                  }
                >
                  {authUser ? 'Continue Browsing' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
