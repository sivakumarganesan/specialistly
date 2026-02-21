import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { SpecialistCategorySetup } from '@/app/components/SpecialistCategorySetup';
import { creatorAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
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
                  className="bg-indigo-600 hover:bg-indigo-700"
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

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Your current subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="font-semibold text-indigo-900 capitalize">
                {user.membership || 'Free'} Plan
              </p>
              <p className="text-sm text-indigo-700 mt-1">
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
