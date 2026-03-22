import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { SpecialistCategorySetup } from '@/app/components/SpecialistCategorySetup';
import { creatorAPI } from '@/app/api/apiClient';
import { specialistRazorpayAPI } from '@/app/api/paymentAPI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface SpecialistSettingsProps {
  onBack?: () => void;
}

/**
 * Specialist Settings Page - Allows editing of speciality categories
 * Can be accessed from profile/settings menu
 */
export function SpecialistSettings({ onBack }: SpecialistSettingsProps) {
  const { user } = useAuth();
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [specialityCategories, setSpecialityCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Razorpay config state
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [razorpayKeyIdMasked, setRazorpayKeyIdMasked] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpayMessage, setRazorpayMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRazorpayForm, setShowRazorpayForm] = useState(false);

  // Load specialist categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      if (!user?.email) return;
      try {
        const response = await creatorAPI.getSpecialistCategories(user.email);
        if (response?.categories && Array.isArray(response.categories)) {
          setSpecialityCategories(response.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [user?.email]);

  // Load Razorpay config
  useEffect(() => {
    const loadRazorpayConfig = async () => {
      try {
        const data = await specialistRazorpayAPI.getConfig();
        if (data.success) {
          setRazorpayConfigured(data.razorpayConfigured);
          setRazorpayKeyIdMasked(data.keyIdMasked);
        }
      } catch (err) {
        console.error('Failed to load Razorpay config:', err);
      }
    };
    loadRazorpayConfig();
  }, []);

  if (!user || !user.email) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Please log in to access settings</p>
      </div>
    );
  }

  const handleCategoryUpdate = () => {
    setShowCategoryEdit(false);
    // Reload categories after update
    const loadCategories = async () => {
      if (!user?.email) return;
      try {
        const response = await creatorAPI.getSpecialistCategories(user.email);
        if (response?.categories && Array.isArray(response.categories)) {
          setSpecialityCategories(response.categories);
        }
      } catch (err) {
        console.error('Failed to reload categories:', err);
      }
    };
    loadCategories();
  };

  const handleSaveRazorpay = async () => {
    setRazorpayMessage(null);
    setRazorpayLoading(true);
    try {
      const data = await specialistRazorpayAPI.saveConfig({
        razorpayKeyId: razorpayKeyId.trim(),
        razorpayKeySecret: razorpayKeySecret.trim(),
      });
      if (data.success) {
        setRazorpayConfigured(true);
        setRazorpayKeyIdMasked(data.keyIdMasked);
        setRazorpayKeyId('');
        setRazorpayKeySecret('');
        setShowRazorpayForm(false);
        setRazorpayMessage({ type: 'success', text: 'Razorpay credentials saved and verified!' });
      } else {
        setRazorpayMessage({ type: 'error', text: data.message || 'Failed to save credentials' });
      }
    } catch (err: any) {
      setRazorpayMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleRemoveRazorpay = async () => {
    setRazorpayMessage(null);
    setRazorpayLoading(true);
    try {
      const data = await specialistRazorpayAPI.removeConfig();
      if (data.success) {
        setRazorpayConfigured(false);
        setRazorpayKeyIdMasked(null);
        setRazorpayMessage({ type: 'success', text: 'Razorpay credentials removed' });
      }
    } catch (err: any) {
      setRazorpayMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setRazorpayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Speciality Categories Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Specialities</CardTitle>
            <CardDescription>
              Manage the speciality categories that describe your expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCategoryEdit ? (
              <div className="space-y-4">
                {/* View Mode */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  {loadingCategories ? (
                    <p className="text-gray-600 text-sm">Loading your specialities...</p>
                  ) : specialityCategories && specialityCategories.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        You have selected {specialityCategories.length} specialit{specialityCategories.length === 1 ? 'y' : 'ies'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {specialityCategories.map(category => (
                          <span
                            key={category}
                            className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-medium"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      No specialities added yet. Click "Edit" to add some.
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setShowCategoryEdit(true)}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Edit Specialities
                </Button>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <SpecialistCategorySetup
                  specialistEmail={user.email}
                  onComplete={handleCategoryUpdate}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Settings Sections */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Basic information about your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 mt-1">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{user.email}</p>
              </div>
              {user.isSpecialist && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Type</label>
                  <p className="text-gray-900 mt-1">Specialist</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Razorpay Payment Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Razorpay Payment Setup</CardTitle>
            <CardDescription>
              Connect your Razorpay account so customers can pay you directly via Razorpay for INR courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {razorpayMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                razorpayMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {razorpayMessage.text}
              </div>
            )}

            {razorpayConfigured && !showRazorpayForm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">✓</div>
                  <div>
                    <p className="font-medium text-green-800">Razorpay Connected</p>
                    <p className="text-sm text-green-600">Key: {razorpayKeyIdMasked}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Customer payments for your INR courses will go directly to your Razorpay account.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRazorpayForm(true)}
                  >
                    Update Credentials
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleRemoveRazorpay}
                    disabled={razorpayLoading}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!showRazorpayForm && !razorpayConfigured && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Connect your Razorpay account to receive direct payments from customers who purchase your INR-priced courses.
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowRazorpayForm(true)}
                    >
                      Connect Razorpay Account
                    </Button>
                  </div>
                )}

                {showRazorpayForm && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                      You can find your API keys in the{' '}
                      <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                        Razorpay Dashboard → Settings → API Keys
                      </a>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razorpay Key Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={razorpayKeySecret}
                          onChange={(e) => setRazorpayKeySecret(e.target.value)}
                          placeholder="Enter your key secret"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSaveRazorpay}
                        disabled={razorpayLoading || !razorpayKeyId.trim() || !razorpayKeySecret.trim()}
                      >
                        {razorpayLoading ? 'Verifying...' : 'Save & Verify'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRazorpayForm(false);
                          setRazorpayKeyId('');
                          setRazorpayKeySecret('');
                          setRazorpayMessage(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Your current subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 capitalize">
                {user.membership || 'Free'} Plan
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {user.membership === 'pro'
                  ? 'You have unlimited access to all features'
                  : 'Upgrade to Pro for unlimited features'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
