import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';

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
      name: 'Free',
      price: 0,
      billing: 'forever',
      features: [
        'Up to 3 courses',
        'Up to 10 sessions per month',
        'Email support',
        'Specialistly branding',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 999,
      billing: 'monthly',
      currency: '₹',
      features: [
        'Unlimited courses',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Specialistly</h1>
          <p className="text-gray-600">Share your expertise and reach millions of learners</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Signup Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>Sign up as a specialist to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isSpecialist"
                      name="isSpecialist"
                      checked={formData.isSpecialist}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer"
                    />
                    <Label htmlFor="isSpecialist" className="cursor-pointer">
                      I want to be a Specialist Member
                    </Label>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentPage('login')}
                      className="text-purple-600 hover:underline font-medium"
                    >
                      Login here
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Membership Plans */}
          {formData.isSpecialist && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Select Your Plan</h3>
              <div className="space-y-4">
                {plans.map(plan => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600'
                        : 'hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id as 'free' | 'pro')}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                          <p className="text-sm text-gray-600">
                            {plan.price === 0
                              ? 'Forever'
                              : `₹${plan.price}/${plan.billing}`}
                          </p>
                        </div>
                        <Checkbox
                          checked={selectedPlan === plan.id}
                          onChange={() => setSelectedPlan(plan.id as 'free' | 'pro')}
                        />
                      </div>

                      <div className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="text-purple-600">✓</span>
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
