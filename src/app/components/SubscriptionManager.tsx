import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { PLAN_FEATURES } from '@/app/hooks/useFeatureGate';
import { CheckCircle, Zap, TrendingUp } from 'lucide-react';

interface SubscriptionManagerProps {
  onUpgradeStart?: () => void;
  showComparison?: boolean;
}

export function SubscriptionManager({ 
  onUpgradeStart,
  showComparison = true 
}: SubscriptionManagerProps) {
  const { user, updateSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentPlan = (user?.subscription?.planType || 'free') as 'free' | 'pro';
  const currentConfig = PLAN_FEATURES[currentPlan];

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      await updateSubscription('pro');
      setSuccess('✓ Successfully upgraded to Pro Plan!');
      
      // Reload or trigger page refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentPlan === 'pro' ? (
                  <>
                    <Zap className="h-5 w-5 text-purple-600" />
                    Pro Plan
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    Free Plan
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {currentConfig && `₹${currentConfig.price === 0 ? 'Free' : currentConfig.price}/${currentConfig.billingCycle}`}
              </CardDescription>
            </div>
            {currentPlan === 'free' && (
              <Badge className="bg-purple-100 text-purple-800">Upgrade Available</Badge>
            )}
            {currentPlan === 'pro' && (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Features List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Included Features:</h4>
              <ul className="space-y-2">
                {currentConfig.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade CTA for Free Users */}
            {currentPlan === 'free' && (
              <div className="pt-4 mt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Upgrade to Pro for More Features
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Unlock unlimited courses, advanced analytics, priority support, and more.
                </p>
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Upgrading...' : `Upgrade to Pro - ₹${PLAN_FEATURES.pro.price}/month`}
                </Button>
                {onUpgradeStart && (
                  <button
                    onClick={onUpgradeStart}
                    className="w-full mt-2 text-sm text-purple-600 hover:underline"
                  >
                    Contact Sales
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                {success}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>Choose the plan that best fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Free</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-gray-700">Price</td>
                    <td className="text-center py-3 px-4">Free</td>
                    <td className="text-center py-3 px-4">₹{PLAN_FEATURES.pro.price}/month</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">Courses/Webinars</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs">
                        Up to 3
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-gray-700">Sessions/Month</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs">
                        Up to 10
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">Advanced Analytics</td>
                    <td className="text-center py-3 px-4">—</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-gray-700">Custom Branding</td>
                    <td className="text-center py-3 px-4">—</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">Priority Support</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4">24/7 Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SubscriptionManager;
