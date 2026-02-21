import React, { useState, useEffect } from 'react';
import { SPECIALITY_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '@/app/constants/specialityCategories';
import { creatorAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, Check, CheckCircle2 } from 'lucide-react';

interface SpecialistCategorySetupProps {
  specialistEmail: string;
  onComplete?: (categories: string[]) => void;
  isOnboarding?: boolean;
}

/**
 * Post Sign-up Category Setup Wizard for Specialists
 * 
 * Features:
 * - Clean onboarding flow
 * - Multi-select with visual feedback
 * - Skip option available
 * - Minimum category validation (optional)
 * - Progress indication
 * - Success feedback
 */
export function SpecialistCategorySetup({ 
  specialistEmail, 
  onComplete,
  isOnboarding = false 
}: SpecialistCategorySetupProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setError(null);
  };

  const handleSelectAll = () => {
    setSelectedCategories(SPECIALITY_CATEGORIES);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one speciality category');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await creatorAPI.updateSpecialistCategories(
        specialistEmail, 
        selectedCategories
      );
      
      if (response?.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete(selectedCategories);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save categories:', err);
      setError('Failed to save your speciality categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    setTimeout(() => {
      if (onComplete) {
        onComplete([]);
      }
    }, 500);
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Perfect!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your speciality categories have been saved successfully
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (skipped) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-600">You can update your speciality categories anytime in your profile settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isOnboarding ? 'Set Your Speciality Categories' : 'Update Speciality Categories'}
        </CardTitle>
        <CardDescription>
          Select the areas where you specialize to help customers find you easily
          {selectedCategories.length > 0 && ` • ${selectedCategories.length} selected`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg flex items-center gap-2 bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
          {SPECIALITY_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedCategories.includes(category)
                  ? `border-indigo-600 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{category}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
                  </p>
                </div>
                {selectedCategories.includes(category) && (
                  <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || selectedCategories.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Saving...' : 'Save Categories'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
