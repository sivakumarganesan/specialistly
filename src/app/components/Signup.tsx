import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle, Zap } from 'lucide-react';

export function Signup() {
  const { signup, setCurrentPage } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isSpecialist: false,
  });

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      billing: 'forever',
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
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 999,
      billing: 'monthly',
      currency: '₹',
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
    },
  ];

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        userType: formData.isSpecialist ? 'specialist' : 'customer',
        isSpecialist: formData.isSpecialist,
        membership: formData.isSpecialist ? selectedPlan : 'customer',
      });

      alert('✓ Signup successful! Welcome to Specialistly!');
      setCurrentPage('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Join Specialistly</h1>
          <p className="text-lg text-gray-600">Share your expertise and reach millions of learners worldwide</p>
        </div>

        {!formData.isSpecialist ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Signup Form */}
            <div>
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle>Create Your Account</CardTitle>
                  <CardDescription>Sign up to get started on Specialistly</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="name" className="font-medium">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="font-medium">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="font-medium">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="isSpecialist"
                        name="isSpecialist"
                        checked={formData.isSpecialist}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer"
                      />
                      <Label htmlFor="isSpecialist" className="cursor-pointer text-gray-700">
                        I want to be a Specialist and earn by sharing my expertise
                      </Label>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                        ⚠️ {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>

                    <p className="text-center text-sm text-gray-600 pt-2">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setCurrentPage('login')}
                        className="text-purple-600 hover:underline font-semibold"
                      >
                        Login here
                      </button>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Why Specialist Benefits */}
            <div className="space-y-6">
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Why Become a Specialist?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'Reach Global Audience', desc: 'Share your expertise with millions of learners worldwide' },
                    { title: 'Earn Passive Income', desc: 'Create courses and earn money while you sleep' },
                    { title: 'Build Your Brand', desc: 'Establish yourself as an authority in your field' },
                    { title: 'Free to Start', desc: 'Get started for free with our Free Plan' },
                    { title: 'Scale Your Business', desc: 'Upgrade to Pro for unlimited possibilities' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Plan Selection */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">Select the perfect plan to start earning</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map(plan => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all transform hover:scale-105 ${
                    selectedPlan === plan.id
                      ? 'border-purple-600 ring-2 ring-purple-600 shadow-xl'
                      : 'border-gray-200 hover:border-purple-300 shadow-lg'
                  } ${plan.id === 'pro' && selectedPlan !== plan.id ? 'md:scale-105' : ''}`}
                  onClick={() => setSelectedPlan(plan.id as 'free' | 'pro')}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-4 bg-purple-600 px-4 py-1">
                      {plan.badge}
                    </Badge>
                  )}
                  
                  <CardHeader className={plan.id === 'pro' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : ''}>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className={plan.id === 'pro' ? 'text-white' : ''}>{plan.name}</CardTitle>
                        <CardDescription className={plan.id === 'pro' ? 'text-purple-100' : ''}>
                          {plan.description}
                        </CardDescription>
                      </div>
                      <Checkbox
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id as 'free' | 'pro')}
                        className="mt-1"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-600">/{plan.billing}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {feature.included ? (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          )}
                          <span className={feature.included ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Form and Error */}
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-medium">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="font-medium">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="font-medium">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, isSpecialist: false }))}
                    >
                      Back
                    </Button>
                    
                    {error && (
                      <div className="text-red-600 text-sm font-medium">{error}</div>
                    )}

                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : `Continue with ${selectedPlan === 'pro' ? 'Pro' : 'Free'} Plan`}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
