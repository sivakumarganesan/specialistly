import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { authAPI } from '@/app/api/apiClient';

export function ForgotPassword() {
  const { setCurrentPage } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email) {
        setError('Email is required');
        return;
      }

      const response = await authAPI.requestPasswordReset(email);
      
      // Show success message regardless of whether account exists (for security)
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-green-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600">Check Your Email</CardTitle>
              <CardDescription>Password reset link sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  If an account exists with your email address, you'll receive a password reset link shortly. 
                  The link will expire in 1 hour.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Didn't receive the email?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Verify you entered the correct email address</li>
                  <li>• Try requesting a new reset link</li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setSuccess(false);
                  setCurrentPage('login');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentPage('login')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-100 rounded-full p-3">
                <Mail className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="mt-2"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
