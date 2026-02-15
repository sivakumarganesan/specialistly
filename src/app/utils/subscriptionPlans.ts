// Subscription and Plan Configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: '₹',
    billingCycle: 'forever',
    description: 'Perfect to get started',
    features: [
      { name: 'Up to 3 courses/webinars', included: true },
      { name: 'Up to 10 sessions per month', included: true },
      { name: 'Email support', included: true },
      { name: 'Specialistly branding', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Custom branding', included: false },
      { name: 'Priority support', included: false },
    ],
    limits: {
      maxCourses: 3,
      maxSessionsPerMonth: 10,
      maxWebinars: 3,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    currency: '₹',
    billingCycle: 'monthly',
    description: 'For serious professionals',
    badge: 'Most Popular',
    features: [
      { name: 'Unlimited courses/webinars', included: true },
      { name: 'Unlimited sessions per month', included: true },
      { name: 'Email support', included: true },
      { name: 'Specialistly branding', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Priority 24/7 support', included: true },
    ],
    limits: {
      maxCourses: -1, // Unlimited
      maxSessionsPerMonth: -1, // Unlimited
      maxWebinars: -1, // Unlimited
    },
  },
};

// Helper to get plan by type
export const getPlanConfig = (planType: string | undefined) => {
  return SUBSCRIPTION_PLANS[planType as 'free' | 'pro'] || SUBSCRIPTION_PLANS.free;
};

// Helper to check if user has exceeded limits
export const checkUserLimits = (
  planType: string | undefined,
  currentCount: number,
  limitType: 'maxCourses' | 'maxSessionsPerMonth' | 'maxWebinars'
) => {
  const plan = getPlanConfig(planType);
  const limit = plan.limits[limitType];
  
  if (limit === -1) return { exceeded: false, remaining: -1 }; // Unlimited
  
  return {
    exceeded: currentCount >= limit,
    remaining: Math.max(0, limit - currentCount),
    limit,
    current: currentCount,
  };
};

// Feature availability checker
export const isFeatureAvailable = (
  planType: string | undefined,
  feature: string
): boolean => {
  const plan = getPlanConfig(planType);
  const featureObj = plan.features.find(f => f.name === feature);
  return featureObj?.included || false;
};

export default SUBSCRIPTION_PLANS;
