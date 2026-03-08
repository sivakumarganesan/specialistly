import { useAuth } from '@/app/context/AuthContext';

// Define plan features
export const PLAN_FEATURES = {
  free: {
    name: 'Free Plan',
    price: 0,
    billingCycle: 'forever',
    maxCourses: 3,
    maxSessionsPerMonth: 10,
    advancedAnalytics: false,
    customBranding: false,
    prioritySupport: false,
    apiAccess: false,
    features: [
      'Up to 3 courses/webinars',
      'Up to 10 sessions per month',
      'Email support',
      'Specialistly branding',
      'Basic analytics',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: 999,
    billingCycle: 'monthly',
    currency: '₹',
    maxCourses: -1, // Unlimited
    maxSessionsPerMonth: -1, // Unlimited
    advancedAnalytics: true,
    customBranding: true,
    prioritySupport: true,
    apiAccess: false,
    features: [
      'Unlimited courses/webinars',
      'Unlimited sessions per month',
      'Advanced analytics & insights',
      'Custom branding',
      'Priority 24/7 support',
      'Advanced scheduling',
      'Bulk operations',
    ],
  },
};

export const useFeatureGate = () => {
  const { user } = useAuth();

  const planType = (user?.subscription?.planType || 'free') as 'free' | 'pro';
  const planConfig = PLAN_FEATURES[planType];

  return {
    planType,
    planConfig,
    
    // Individual feature checks
    canCreateUnlimitedCourses: () => planConfig.maxCourses === -1,
    canCreateCourses: () => {
      const freelimit = PLAN_FEATURES.free.maxCourses;
      if (planType === 'free') return freelimit === -1 || (user?.servicesCount || 0) < freelimit;
      return true;
    },
    canAccessAdvancedAnalytics: () => planConfig.advancedAnalytics,
    canUseCustomBranding: () => planConfig.customBranding,
    canAccessPrioritySupport: () => planConfig.prioritySupport,
    canAccessAPI: () => planConfig.apiAccess,
    
    // Check if specific feature is available
    hasFeature: (feature: keyof typeof planConfig) => {
      return (planConfig[feature] as boolean | number) === true || 
             (typeof planConfig[feature] === 'number' && (planConfig[feature] as number) !== 0);
    },
    
    // Get feature status with message
    checkFeature: (feature: string) => {
      const features = planConfig as any;
      const value = features[feature];
      
      if (value === true) return { allowed: true, message: 'Available' };
      if (value === false) return { allowed: false, message: `Available in Pro plan` };
      if (typeof value === 'number' && value > 0) {
        return { allowed: true, message: `${value} limit` };
      }
      return { allowed: false, message: 'Available in Pro plan' };
    },
  };
};

// Component for displaying feature status
export function FeatureBadge({ feature, allowed }: { feature: string; allowed: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
      allowed 
        ? 'bg-green-100 text-green-700' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      {allowed ? '✓' : '—'} {feature}
    </span>
  );
}

// Component for showing upgrade prompt
export function UpgradePrompt({ 
  feature, 
  onUpgradeClick 
}: { 
  feature: string; 
  onUpgradeClick?: () => void 
}) {
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
      <p className="text-sm text-gray-700 mb-3">
        <strong>{feature}</strong> is available only in the <strong>Pro Plan</strong>
      </p>
      <button
        onClick={onUpgradeClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium transition"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

export default useFeatureGate;
