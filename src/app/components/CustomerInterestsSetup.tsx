import React, { useState, useEffect } from 'react';
import { SPECIALITY_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '@/app/constants/specialityCategories';
import { customerAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, Check, CheckCircle2 } from 'lucide-react';

interface CustomerInterestsSetupProps {
  customerEmail: string;
  onComplete?: (interests: string[]) => void;
  isOnboarding?: boolean;
}

/**
 * Post Sign-up Interests Setup for Customers
 * 
 * Features:
 * - Option to skip (interests are optional for customers)
 * - Multi-select with visual feedback
 * - Helpful descriptions for each category
 * - Success feedback
 */
export function CustomerInterestsSetup({ 
  customerEmail, 
  onComplete,
  isOnboarding = false 
}: CustomerInterestsSetupProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
    setError(null);
  };

  const handleSelectAll = () => {
    setSelectedInterests(SPECIALITY_CATEGORIES);
  };

  const handleClearAll = () => {
    setSelectedInterests([]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerAPI.updateInterests({
        email: customerEmail,
        interests: selectedInterests,
      });

      if (response?.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete(selectedInterests);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save interests:', err);
      setError('Failed to save your interests. Please try again.');
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
            <h3 className="text-lg font-semibold text-green-900">Interests Saved!</h3>
            <p className="text-sm text-green-700 mt-1">
              We'll use this to recommend specialists that match your interests
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
          <p className="text-gray-600">You can update your interests anytime in your profile settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isOnboarding ? 'What Are You Interested In?' : 'Update Your Interests'}
        </CardTitle>
        <CardDescription>
          Select your areas of interest to get personalized recommendations
          {selectedInterests.length > 0 && ` • ${selectedInterests.length} selected`}
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

        {/* Interests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
          {SPECIALITY_CATEGORIES.map(interest => (
            <button
              key={interest}
              onClick={() => handleInterestToggle(interest)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedInterests.includes(interest)
                  ? `border-blue-600 ${CATEGORY_COLORS[interest as keyof typeof CATEGORY_COLORS]}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{interest}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {CATEGORY_DESCRIPTIONS[interest as keyof typeof CATEGORY_DESCRIPTIONS]}
                  </p>
                </div>
                {selectedInterests.includes(interest) && (
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
            Skip
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Save Interests'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
