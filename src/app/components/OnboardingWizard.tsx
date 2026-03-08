import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { SpecialistCategorySetup } from './SpecialistCategorySetup';
import { CustomerInterestsSetup } from './CustomerInterestsSetup';
import { Progress } from '@/app/components/ui/progress';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { authAPI } from '@/app/api/apiClient';

interface OnboardingWizardProps {
  userEmail: string;
  userRole: 'specialist' | 'customer';
  onComplete: () => void;
}

/**
 * Post Sign-up Onboarding Wizard
 * 
 * Flow:
 * Step 1: Welcome + Role confirmation
 * Step 2: Category/Interest selection (specialist or customer)
 * Step 3: Completion
 */
export function OnboardingWizard({ userEmail, userRole, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  
  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleCategoryComplete = (selectedCategories: string[]) => {
    setCategories(selectedCategories);
    setCurrentStep(3);
  };

  const handleFinish = async () => {
    // Mark onboarding as complete in user profile
    try {
      await authAPI.markOnboardingComplete({ email: userEmail });
    } catch (err) {
      console.error('Failed to mark onboarding complete:', err);
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {totalSteps}
            </h3>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        {currentStep === 1 && (
          <div>
            <CardHeader>
              <CardTitle>Welcome to Specialistly! 👋</CardTitle>
              <CardDescription>
                Let's set up your account in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-900 mb-2">Account Type</h4>
                <p className="text-indigo-700">
                  {userRole === 'specialist' 
                    ? 'You\'re signing up as a Specialist' 
                    : 'You\'re signing up as a Customer'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">What's Next?</h4>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-3">
                    <span className="font-semibold text-indigo-600 flex-shrink-0">1</span>
                    <span>
                      {userRole === 'specialist' 
                        ? 'Set up your speciality categories' 
                        : 'Select your interests'}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-indigo-600 flex-shrink-0">2</span>
                    <span>Complete your profile (optional for now)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-indigo-600 flex-shrink-0">3</span>
                    <span>Start exploring the platform!</span>
                  </li>
                </ol>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Let's Get Started
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <CardHeader>
              <CardTitle>
                {userRole === 'specialist' 
                  ? 'Set Your Specialities' 
                  : 'Tell Us Your Interests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userRole === 'specialist' ? (
                <SpecialistCategorySetup 
                  specialistEmail={userEmail}
                  onComplete={handleCategoryComplete}
                  isOnboarding
                />
              ) : (
                <CustomerInterestsSetup 
                  customerEmail={userEmail}
                  onComplete={handleCategoryComplete}
                  isOnboarding
                />
              )}
            </CardContent>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <CardHeader>
              <CardTitle>All Set! 🎉</CardTitle>
              <CardDescription>
                Your account is ready to go
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Setup Complete</h4>
                <p className="text-sm text-green-700">
                  {userRole === 'specialist'
                    ? 'Your speciality categories have been saved. You can now start taking consultations!'
                    : 'Your interests have been saved. You can now browse and book with specialists!'}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">Quick Tips:</h4>
                <ul className="space-y-1 text-gray-600">
                  {userRole === 'specialist' ? (
                    <>
                      <li>• Update your profile with more details to attract more clients</li>
                      <li>• Set your availability for consultations</li>
                      <li>• Create course material to expand your reach</li>
                    </>
                  ) : (
                    <>
                      <li>• Browse specialists by category in the marketplace</li>
                      <li>• Book a consultation with your favorite specialist</li>
                      <li>• Take courses to expand your knowledge</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}
