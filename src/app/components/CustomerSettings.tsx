import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { CustomerInterestsSetup } from '@/app/components/CustomerInterestsSetup';
import { customerAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CustomerSettingsProps {
  onBack?: () => void;
}

/**
 * Customer Settings Page - Allows editing of interests
 * Can be accessed from profile/settings menu
 */
export function CustomerSettings({ onBack }: CustomerSettingsProps) {
  const { user } = useAuth();
  const [showInterestEdit, setShowInterestEdit] = useState(false);
  const [customerInterests, setCustomerInterests] = useState<string[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);

  // Load customer interests when component mounts
  useEffect(() => {
    const loadInterests = async () => {
      if (!user?.email) return;
      try {
        const response = await customerAPI.getInterests(user.email);
        if (response?.interests && Array.isArray(response.interests)) {
          setCustomerInterests(response.interests);
        }
      } catch (err) {
        console.error('Failed to load interests:', err);
      } finally {
        setLoadingInterests(false);
      }
    };

    loadInterests();
  }, [user?.email]);

  if (!user || !user.email) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Please log in to access settings</p>
      </div>
    );
  }

  const handleInterestUpdate = () => {
    setShowInterestEdit(false);
    // Reload interests after update
    const loadInterests = async () => {
      try {
        const response = await customerAPI.getInterests(user.email);
        if (response?.interests && Array.isArray(response.interests)) {
          setCustomerInterests(response.interests);
        }
      } catch (err) {
        console.error('Failed to reload interests:', err);
      }
    };
    loadInterests();
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        {/* Interests Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Interests</CardTitle>
            <CardDescription>
              Manage your areas of interest for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showInterestEdit ? (
              <div className="space-y-4">
                {/* View Mode */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  {loadingInterests ? (
                    <p className="text-blue-700 text-sm">Loading your interests...</p>
                  ) : customerInterests && customerInterests.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900 mb-3">
                        You are interested in {customerInterests.length} categor{customerInterests.length === 1 ? 'y' : 'ies'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {customerInterests.map(interest => (
                          <span
                            key={interest}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-blue-700 text-sm">
                      No interests selected yet. Click "Edit" to add some for better recommendations.
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setShowInterestEdit(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit Interests
                </Button>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <CustomerInterestsSetup
                  customerEmail={user.email}
                  onComplete={handleInterestUpdate}
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
              <div>
                <label className="text-sm font-medium text-gray-700">Account Type</label>
                <p className="text-gray-900 mt-1">Customer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Courses & Bookings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
            <CardDescription>
              Your courses and consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Enrolled Courses: <span className="font-semibold">0</span></p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Completed Consultations: <span className="font-semibold">0</span></p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Upcoming Bookings: <span className="font-semibold">0</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Manage your notification and recommendation preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">Receive recommendations based on my interests</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">Email notifications for new courses in my interests</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
